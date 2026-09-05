/**
 * Everything that talks to TMDB. All calls go through /api/tmdb so the key
 * stays on the server — see netlify/functions/tmdb.mjs.
 */

export type Kind = "movie" | "tv";

export type Title = {
  id: number;
  kind: Kind;
  key: string; // "movie:603" — the id used everywhere in the taste profile
  name: string;
  year: number | null;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  genres: number[];
  lang: string;
  rating: number;
  votes: number;
  popularity: number;
};

export type Providers = { flatrate: string[]; rent: string[]; regions: string[] };

const IMG = "https://image.tmdb.org/t/p";
export const poster = (path: string | null, size: "w342" | "w500" = "w342") =>
  path ? `${IMG}/${size}${path}` : null;

async function api<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const q = new URLSearchParams({ path });
  for (const [k, v] of Object.entries(params)) q.set(k, String(v));
  const res = await fetch(`/api/tmdb?${q}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `tmdb ${res.status}`);
  return body as T;
}

/** Discover results differ between movie and tv; flatten both to one shape. */
function toTitle(raw: any, kind: Kind): Title | null {
  const name = kind === "movie" ? raw.title : raw.name;
  const date = kind === "movie" ? raw.release_date : raw.first_air_date;
  if (!name || !raw.id) return null;
  return {
    id: raw.id,
    kind,
    key: `${kind}:${raw.id}`,
    name,
    year: date ? Number(date.slice(0, 4)) : null,
    overview: raw.overview ?? "",
    poster: raw.poster_path ?? null,
    backdrop: raw.backdrop_path ?? null,
    genres: raw.genre_ids ?? (raw.genres ?? []).map((g: any) => g.id),
    lang: raw.original_language ?? "en",
    rating: raw.vote_average ?? 0,
    votes: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
  };
}

export async function discover(kind: Kind, params: Record<string, string | number>) {
  const data = await api<{ results: any[] }>(`discover/${kind}`, {
    include_adult: "false",
    language: "en-US",
    ...params,
  });
  return (data.results ?? []).map((r) => toTitle(r, kind)).filter((t): t is Title => !!t);
}

export async function list(path: string, kind: Kind, params: Record<string, string | number> = {}) {
  const data = await api<{ results: any[] }>(path, { language: "en-US", ...params });
  return (data.results ?? []).map((r) => toTitle(r, kind)).filter((t): t is Title => !!t);
}

export async function genreMap(): Promise<Record<number, string>> {
  const [movie, tv] = await Promise.all([
    api<{ genres: { id: number; name: string }[] }>("genre/movie/list", { language: "en-US" }),
    api<{ genres: { id: number; name: string }[] }>("genre/tv/list", { language: "en-US" }),
  ]);
  const out: Record<number, string> = {};
  for (const g of [...movie.genres, ...tv.genres]) out[g.id] = g.name;
  return out;
}

/** Keywords are the sharp taste signal — "time loop", "slow burn" — but only
 *  the details endpoint returns them, so this is fetched once per rated title. */
export async function keywordsFor(kind: Kind, id: number): Promise<{ id: number; name: string }[]> {
  const data = await api<any>(`${kind}/${id}`, { append_to_response: "keywords" });
  const raw = kind === "movie" ? data.keywords?.keywords : data.keywords?.results;
  // TMDB stores these lowercase ("based on manga"). Sentence case reads as a
  // label beside the genre names without turning into Title Case Nonsense.
  return (raw ?? []).slice(0, 12).map((k: any) => ({
    id: k.id,
    name: k.name.charAt(0).toUpperCase() + k.name.slice(1),
  }));
}

/** Every region TMDB knows about, collapsed to a de-duped list of service names. */
export async function providersFor(kind: Kind, id: number): Promise<Providers> {
  const data = await api<any>(`${kind}/${id}/watch/providers`);
  const results = data.results ?? {};
  const flatrate = new Set<string>();
  const rent = new Set<string>();
  const regions: string[] = [];
  for (const [code, r] of Object.entries<any>(results)) {
    if (r.flatrate?.length || r.rent?.length || r.buy?.length) regions.push(code);
    for (const p of r.flatrate ?? []) flatrate.add(p.provider_name);
    for (const p of [...(r.rent ?? []), ...(r.buy ?? [])]) rent.add(p.provider_name);
  }
  return { flatrate: [...flatrate], rent: [...rent], regions };
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", ko: "Korean", ja: "Japanese", fr: "French", es: "Spanish",
  hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam", kn: "Kannada",
  bn: "Bengali", mr: "Marathi", da: "Danish", sv: "Swedish", de: "German",
  it: "Italian", zh: "Chinese", cn: "Chinese", pt: "Portuguese", ru: "Russian",
  fa: "Persian", th: "Thai", tr: "Turkish", pl: "Polish", nl: "Dutch",
  no: "Norwegian", is: "Icelandic", he: "Hebrew", ar: "Arabic", id: "Indonesian",
};

/**
 * The seed deck. One query per bucket, drawn one-at-a-time in round-robin so
 * consecutive cards never come from the same corner of the catalogue. Together
 * these span every major genre, six decades, and twenty-odd film industries.
 */
export type DeckQuery = { kind: Kind; label: string; params: Record<string, string | number> };

const canon = { "vote_count.gte": 4000, sort_by: "vote_average.desc" };
const solid = { "vote_count.gte": 700, sort_by: "vote_average.desc" };
const loved = { "vote_count.gte": 2000, sort_by: "popularity.desc" };

export const DECK: DeckQuery[] = [
  { kind: "movie", label: "the canon", params: canon },
  { kind: "movie", label: "crowd favourites", params: loved },
  { kind: "movie", label: "horror", params: { with_genres: 27, ...solid } },
  { kind: "movie", label: "sci-fi", params: { with_genres: 878, ...solid } },
  { kind: "movie", label: "comedy", params: { with_genres: 35, ...solid } },
  { kind: "movie", label: "crime", params: { with_genres: 80, ...solid } },
  { kind: "movie", label: "romance", params: { with_genres: 10749, ...solid } },
  { kind: "movie", label: "thriller", params: { with_genres: 53, ...solid } },
  { kind: "movie", label: "animation", params: { with_genres: 16, ...solid } },
  { kind: "movie", label: "documentary", params: { with_genres: 99, ...solid } },
  { kind: "movie", label: "action", params: { with_genres: 28, ...solid } },
  { kind: "movie", label: "fantasy", params: { with_genres: 14, ...solid } },
  { kind: "movie", label: "mystery", params: { with_genres: 9648, ...solid } },
  { kind: "movie", label: "war & history", params: { with_genres: "10752|36", ...solid } },
  { kind: "movie", label: "westerns", params: { with_genres: 37, ...solid } },
  { kind: "movie", label: "music films", params: { with_genres: 10402, ...solid } },
  { kind: "movie", label: "family", params: { with_genres: 10751, ...solid } },
  { kind: "movie", label: "the 70s", params: { "primary_release_date.lte": "1979-12-31", "primary_release_date.gte": "1970-01-01", ...solid } },
  { kind: "movie", label: "the 80s", params: { "primary_release_date.lte": "1989-12-31", "primary_release_date.gte": "1980-01-01", ...solid } },
  { kind: "movie", label: "the 90s", params: { "primary_release_date.lte": "1999-12-31", "primary_release_date.gte": "1990-01-01", ...solid } },
  { kind: "movie", label: "the 2000s", params: { "primary_release_date.lte": "2009-12-31", "primary_release_date.gte": "2000-01-01", ...solid } },
  { kind: "movie", label: "the 2010s", params: { "primary_release_date.lte": "2019-12-31", "primary_release_date.gte": "2010-01-01", ...solid } },
  { kind: "movie", label: "this decade", params: { "primary_release_date.gte": "2020-01-01", ...solid } },
  { kind: "movie", label: "Korean", params: { with_original_language: "ko", "vote_count.gte": 300, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Japanese", params: { with_original_language: "ja", "vote_count.gte": 300, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Hindi", params: { with_original_language: "hi", "vote_count.gte": 150, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Tamil & Telugu", params: { with_original_language: "ta|te", "vote_count.gte": 80, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Malayalam", params: { with_original_language: "ml", "vote_count.gte": 50, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "French", params: { with_original_language: "fr", "vote_count.gte": 300, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Spanish", params: { with_original_language: "es", "vote_count.gte": 300, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Nordic", params: { with_original_language: "da|sv|no|is", "vote_count.gte": 120, sort_by: "vote_average.desc" } },
  { kind: "movie", label: "Italian & German", params: { with_original_language: "it|de", "vote_count.gte": 250, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "prestige TV", params: { "vote_count.gte": 1200, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "TV drama", params: { with_genres: 18, "vote_count.gte": 400, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "TV comedy", params: { with_genres: 35, "vote_count.gte": 400, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "TV crime & mystery", params: { with_genres: "80|9648", "vote_count.gte": 300, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "sci-fi & fantasy TV", params: { with_genres: 10765, "vote_count.gte": 400, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "anime", params: { with_genres: 16, with_original_language: "ja", "vote_count.gte": 200, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "docuseries", params: { with_genres: 99, "vote_count.gte": 80, sort_by: "vote_average.desc" } },
  { kind: "tv", label: "TV right now", params: { "first_air_date.gte": "2023-01-01", "vote_count.gte": 300, sort_by: "popularity.desc" } },
];

/** Two pages of each bucket, round-robined into one varied, de-duped deck. */
export async function buildDeck(pages = 2): Promise<Title[]> {
  const buckets = await Promise.all(
    DECK.map(async (q) => {
      const runs = await Promise.all(
        Array.from({ length: pages }, (_, i) =>
          discover(q.kind, { ...q.params, page: i + 1 }).catch(() => [] as Title[])
        )
      );
      return runs.flat();
    })
  );

  const deck: Title[] = [];
  const seen = new Set<string>();
  const depth = Math.max(...buckets.map((b) => b.length), 0);
  for (let i = 0; i < depth; i++) {
    for (const bucket of buckets) {
      const t = bucket[i];
      if (!t || seen.has(t.key) || !t.poster) continue;
      seen.add(t.key);
      deck.push(t);
    }
  }
  return deck;
}
