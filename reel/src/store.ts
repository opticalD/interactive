/**
 * Persistence and the weekly assembly. Everything lives in localStorage —
 * no accounts, no server state, by design.
 */

import {
  buildDeck, discover, genreMap, keywordsFor, LANGUAGE_NAMES, list, providersFor,
  type Kind, type Providers, type Title,
} from "./tmdb";
import {
  blindSpot, emptyProfile, isoWeek, pickFrom, type Profile, type Scored,
} from "./taste";

const PROFILE_KEY = "reel.profile.v1";
const DECK_KEY = "reel.deck.v1";
const DROP_KEY = "reel.drop.v1";
const GENRES_KEY = "reel.genres.v1";
const STOCK_KEY = "reel.stock";
const DECK_TTL = 1000 * 60 * 60 * 24 * 3;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full quota shouldn't take the programme down with it.
  }
}

export const loadProfile = (): Profile => {
  const p = read<Profile>(PROFILE_KEY, emptyProfile());
  return { ...emptyProfile(), ...p };
};
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p);

export const loadStock = () => read<"cream" | "black" | null>(STOCK_KEY, null);
export const saveStock = (s: "cream" | "black" | null) => write(STOCK_KEY, s);

export async function loadGenres(): Promise<Record<number, string>> {
  const cached = read<Record<number, string> | null>(GENRES_KEY, null);
  if (cached && Object.keys(cached).length) return cached;
  const fresh = await genreMap();
  write(GENRES_KEY, fresh);
  return fresh;
}

/** The deck is ~80 requests to assemble, so it's cached for three days. */
export async function loadDeck(): Promise<Title[]> {
  const cached = read<{ at: number; titles: Title[] } | null>(DECK_KEY, null);
  if (cached && Date.now() - cached.at < DECK_TTL && cached.titles.length > 100) {
    return cached.titles;
  }
  const titles = await buildDeck();
  write(DECK_KEY, { at: Date.now(), titles });
  return titles;
}

export type Slot = "lead" | "new" | "theatre" | "match" | "blind";

export type Pick = Scored & {
  slot: Slot;
  /** Filled in lazily — availability is a tag on the card, never a filter. */
  providers?: Providers;
};

export type Drop = { week: string; region: string; marks: number; picks: Pick[] };

const ago = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

const topGenres = (profile: Profile, n: number) =>
  Object.entries(profile.feat)
    .filter(([k]) => k.startsWith("g:"))
    .map(([k, v]) => ({ id: Number(k.slice(2)), w: v.sum / (v.n + 2) }))
    .filter((g) => g.w > 0.4)
    .sort((a, b) => b.w - a.w)
    .slice(0, n)
    .map((g) => g.id);

/**
 * Assemble one week's programme.
 *
 * Two passes: score the pools on genre, language and decade to get a shortlist,
 * then fetch keywords for just that shortlist and score again. Keywords are
 * where taste actually lives — "slow burn", "one location", "unreliable
 * narrator" — but they cost a request per title, so only finalists get one.
 */
export async function buildDrop(
  profile: Profile,
  genres: Record<number, string>,
  region: string
): Promise<Drop> {
  const week = isoWeek();
  const labels: Record<string, string> = {};
  for (const [id, name] of Object.entries(genres)) labels[`g:${id}`] = name;
  for (const [code, name] of Object.entries(LANGUAGE_NAMES)) labels[`l:${code}`] = name;

  const liked = topGenres(profile, 3);
  const blind = blindSpot(profile, genres);
  const quiet = { "vote_count.gte": 40, sort_by: "popularity.desc" } as const;

  const [freshMovies, freshTv, theatres, matchMovies, matchTv, blindPool] = await Promise.all([
    // Recently landed on digital/TV anywhere — release types 4 and 6.
    discover("movie", { with_release_type: "4|6", "primary_release_date.gte": ago(75), ...quiet }),
    discover("tv", { "first_air_date.gte": ago(75), ...quiet }),
    list("movie/now_playing", "movie", { region }),
    discover("movie", {
      ...(liked.length ? { with_genres: liked.join("|") } : {}),
      "vote_count.gte": 300,
      sort_by: "vote_average.desc",
    }),
    discover("tv", {
      ...(liked.length ? { with_genres: liked.join("|") } : {}),
      "vote_count.gte": 200,
      sort_by: "vote_average.desc",
    }),
    blind
      ? discover("movie", { with_genres: blind, "vote_count.gte": 600, sort_by: "vote_average.desc" })
      : Promise.resolve([] as Title[]),
  ]);

  const used = new Set<string>(profile.served);
  const take = (pool: Title[], n: number, salt: string) => {
    const chosen = pickFrom(profile, pool, n, `${week}:${salt}`, labels, used);
    for (const c of chosen) used.add(c.title.key);
    return chosen;
  };

  // Pass one: a shortlist twice the size of the final programme.
  const shortlist: { slot: Slot; scored: Scored }[] = [
    ...take([...freshMovies, ...freshTv], 4, "new").map((s) => ({ slot: "new" as Slot, scored: s })),
    ...take(theatres, 2, "theatre").map((s) => ({ slot: "theatre" as Slot, scored: s })),
    ...take([...matchMovies, ...matchTv], 8, "match").map((s) => ({ slot: "match" as Slot, scored: s })),
    ...take(blindPool, 2, "blind").map((s) => ({ slot: "blind" as Slot, scored: s })),
  ];

  // Pass two: keywords for the finalists only.
  const keywords: Record<string, number[]> = {};
  await Promise.all(
    shortlist.map(async ({ scored }) => {
      try {
        const kws = await keywordsFor(scored.title.kind, scored.title.id);
        keywords[scored.title.key] = kws.map((k) => k.id);
        for (const k of kws) labels[`k:${k.id}`] = k.name;
      } catch {
        keywords[scored.title.key] = [];
      }
    })
  );

  const quota: Record<Slot, number> = { lead: 0, new: 2, theatre: 1, match: 4, blind: 1 };
  const TARGET = 8;
  const picks: Pick[] = [];
  const chosen = new Set<string>();
  for (const slot of ["new", "theatre", "match", "blind"] as Slot[]) {
    const pool = shortlist.filter((s) => s.slot === slot).map((s) => s.scored.title);
    const rescored = pickFrom(profile, pool, quota[slot], `${week}:${slot}:2`, labels, chosen, keywords);
    for (const s of rescored) {
      chosen.add(s.title.key);
      picks.push({ ...s, slot });
    }
  }

  // A thin slot — no theatrical listings in this region, a blind-spot genre with
  // nothing left in it — must not shorten the programme.
  if (picks.length < TARGET) {
    const rest = shortlist.map((s) => s.scored.title);
    for (const s of pickFrom(profile, rest, TARGET - picks.length, `${week}:fill`, labels, chosen, keywords)) {
      chosen.add(s.title.key);
      picks.push({ ...s, slot: "match" });
    }
  }

  // The strongest match leads the programme and gets the reproduced still.
  picks.sort((a, b) => b.score - a.score);
  const leadIndex = picks.findIndex((p) => p.title.backdrop);
  if (leadIndex >= 0) {
    const [lead] = picks.splice(leadIndex, 1);
    picks.unshift({ ...lead, slot: "lead" });
  }

  return { week, region, marks: Object.keys(profile.verdicts).length, picks };
}

export const loadDrop = () => read<Drop | null>(DROP_KEY, null);
export const saveDrop = (d: Drop) => write(DROP_KEY, d);

/** Availability, fetched per card once the programme is on screen. */
export async function withProviders(kind: Kind, id: number): Promise<Providers | null> {
  try {
    return await providersFor(kind, id);
  } catch {
    return null;
  }
}
