/**
 * The taste model. Pure functions over a plain profile object — no network, no
 * React — so `npm run check` can exercise it directly.
 *
 * A title is reduced to features: genres, original language, decade, and the
 * keywords TMDB attaches to it. Every verdict pushes each of that title's
 * features up or down. A feature's weight is its mean verdict, shrunk toward
 * zero by how little evidence there is, so one lucky Korean thriller doesn't
 * convince the model you only watch Korean thrillers.
 */

import type { Title } from "./tmdb.ts";

export type Verdict = "loved" | "meh" | "nope";

export const VERDICT_WEIGHT: Record<Verdict, number> = { loved: 3, meh: -0.5, nope: -2 };

/** How much evidence a feature needs before its weight counts at full strength. */
const SHRINK = 2;

/** Feature families and how much each one moves a recommendation. */
const FAMILY_WEIGHT = { g: 1, k: 1.3, l: 0.6, d: 0.35 } as const;

export type Profile = {
  v: 1;
  verdicts: Record<string, Verdict>;
  /** feature key -> running total. "g:27" genre, "k:9715" keyword, "l:ko" language, "d:1990" decade.
   *  `pos` counts outright loves, so the programme can say "you said yes eleven times" truthfully. */
  feat: Record<string, { sum: number; n: number; pos: number }>;
  labels: Record<string, string>;
  watchlist: string[];
  watched: string[];
  /** Titles already served in a weekly drop, so the next one doesn't repeat them. */
  served: string[];
};

export const emptyProfile = (): Profile => ({
  v: 1,
  verdicts: {},
  feat: {},
  labels: {},
  watchlist: [],
  watched: [],
  served: [],
});

const decadeOf = (year: number | null) => (year ? `${Math.floor(year / 10) * 10}` : null);

/** The feature keys a title contributes to. Keywords arrive later, on rating. */
export function featuresOf(title: Title, keywordIds: number[] = []): string[] {
  const keys = title.genres.map((g) => `g:${g}`);
  keys.push(`l:${title.lang}`);
  const decade = decadeOf(title.year);
  if (decade) keys.push(`d:${decade}`);
  for (const id of keywordIds) keys.push(`k:${id}`);
  return keys;
}

export function weightOf(profile: Profile, key: string): number {
  const f = profile.feat[key];
  if (!f) return 0;
  return f.sum / (f.n + SHRINK);
}

/** Record a verdict. Idempotent per title: re-rating replaces the old verdict. */
export function rate(profile: Profile, title: Title, verdict: Verdict, keywordIds: number[] = []): Profile {
  const next: Profile = { ...profile, verdicts: { ...profile.verdicts }, feat: { ...profile.feat } };
  const keys = featuresOf(title, keywordIds);
  const previous = profile.verdicts[title.key];

  if (previous) {
    // Undo the old verdict before applying the new one, or the two stack up.
    for (const key of keys) {
      const f = next.feat[key];
      if (!f) continue;
      next.feat[key] = {
        sum: f.sum - VERDICT_WEIGHT[previous],
        n: Math.max(0, f.n - 1),
        pos: Math.max(0, f.pos - (previous === "loved" ? 1 : 0)),
      };
    }
  }

  for (const key of keys) {
    const f = next.feat[key] ?? { sum: 0, n: 0, pos: 0 };
    next.feat[key] = {
      sum: f.sum + VERDICT_WEIGHT[verdict],
      n: f.n + 1,
      pos: f.pos + (verdict === "loved" ? 1 : 0),
    };
  }
  next.verdicts[title.key] = verdict;
  return next;
}

/** Keywords arrive asynchronously after a rating; fold them in when they land. */
export function addKeywords(profile: Profile, titleKey: string, keywords: { id: number; name: string }[]): Profile {
  const verdict = profile.verdicts[titleKey];
  if (!verdict) return profile;
  const next: Profile = { ...profile, feat: { ...profile.feat }, labels: { ...profile.labels } };
  for (const kw of keywords) {
    const key = `k:${kw.id}`;
    const f = next.feat[key] ?? { sum: 0, n: 0, pos: 0 };
    next.feat[key] = {
      sum: f.sum + VERDICT_WEIGHT[verdict],
      n: f.n + 1,
      pos: f.pos + (verdict === "loved" ? 1 : 0),
    };
    next.labels[key] = kw.name;
  }
  return next;
}

export type Reason = { key: string; label: string };
export type Scored = { title: Title; score: number; reasons: Reason[] };

/**
 * Score a candidate. Families are averaged rather than summed so a title with
 * five genres doesn't beat a sharper one with two, and a single strongly
 * disliked feature vetoes the title outright — that's how "no gore" or "never
 * musicals" survives a hundred positive signals elsewhere.
 */
export function score(
  profile: Profile,
  title: Title,
  labels: Record<string, string> = {},
  keywordIds: number[] = []
): Scored {
  const keys = featuresOf(title, keywordIds);
  const byFamily: Record<string, number[]> = {};
  const contributions: { key: string; value: number }[] = [];

  for (const key of keys) {
    const family = key[0];
    const w = weightOf(profile, key);
    (byFamily[family] ??= []).push(w);
    if (w !== 0) contributions.push({ key, value: w * (FAMILY_WEIGHT[family as keyof typeof FAMILY_WEIGHT] ?? 1) });
  }

  let total = 0;
  for (const [family, weights] of Object.entries(byFamily)) {
    const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
    total += mean * (FAMILY_WEIGHT[family as keyof typeof FAMILY_WEIGHT] ?? 1);
  }

  // A modest quality prior, so two equally-matched titles break ties on merit.
  if (title.votes > 200) total += Math.max(-0.5, Math.min(0.5, (title.rating - 6.8) * 0.2));

  // Veto: anything carrying a feature you've clearly rejected drops out.
  const worst = Math.min(0, ...contributions.map((c) => c.value));
  if (worst < -1.2) total -= 1.5;

  const reasons = contributions
    .filter((c) => c.value > 0.35)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((c) => ({ key: c.key, label: labelFor(c.key, { ...labels, ...profile.labels }) }))
    .filter((r) => !!r.label);

  return { title, score: total, reasons };
}

export function labelFor(key: string, labels: Record<string, string>): string {
  if (labels[key]) return labels[key];
  const [family, value] = [key[0], key.slice(2)];
  if (family === "d") return `${value}s`;
  if (family === "l") return value.toUpperCase();
  return value;
}

/* ---------- weekly drop ---------- */

/** ISO-8601 week, e.g. "2026-W36" — the seed that keeps a week's picks fixed. */
export function isoWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick `count` from a pool: taste order, with a seeded nudge so the same week
 * always yields the same picks and a new week reshuffles the near-ties.
 */
export function pickFrom(
  profile: Profile,
  pool: Title[],
  count: number,
  seed: string,
  labels: Record<string, string> = {},
  exclude = new Set<string>(),
  keywords: Record<string, number[]> = {}
): Scored[] {
  const next = rng(seed);
  return pool
    .filter((t) => t.poster && !exclude.has(t.key) && !profile.verdicts[t.key] && !profile.watched.includes(t.key))
    .map((t) => {
      const s = score(profile, t, labels, keywords[t.key] ?? []);
      return { ...s, score: s.score + next() * 0.45 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/** The genre you've engaged with least — this week's deliberate blind spot. */
export function blindSpot(profile: Profile, genres: Record<number, string>): number | null {
  const ids = Object.keys(genres).map(Number);
  if (!ids.length) return null;
  let best: number | null = null;
  let fewest = Infinity;
  for (const id of ids) {
    const f = profile.feat[`g:${id}`];
    const n = f?.n ?? 0;
    // Skip genres you've actively rejected — a blind spot isn't a punishment.
    if (weightOf(profile, `g:${id}`) < -0.8) continue;
    if (n < fewest) {
      fewest = n;
      best = id;
    }
  }
  return best;
}
