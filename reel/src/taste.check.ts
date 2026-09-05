/**
 * Self-check for the taste model: `npm run check`.
 * Covers the parts that would silently give bad recommendations if they broke.
 */

import assert from "node:assert/strict";
import { emptyProfile, rate, score, weightOf, isoWeek, pickFrom, blindSpot } from "./taste.ts";
import type { Title } from "./tmdb.ts";

let n = 0;
const t = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

const HORROR = 27, ROMANCE = 10749, MUSIC = 10402, DRAMA = 18;

const title = (id: number, genres: number[], over: Partial<Title> = {}): Title => ({
  id, kind: "movie", key: `movie:${id}`, name: `Title ${id}`, year: 2015,
  overview: "", poster: "/p.jpg", backdrop: null, genres, lang: "en",
  rating: 7, votes: 1000, popularity: 10, ...over,
});

t("one 'loved' shrinks toward zero rather than maxing out", () => {
  const p = rate(emptyProfile(), title(1, [HORROR]), "loved");
  // 3 / (1 + 2) === 1, not the raw 3.
  assert.equal(weightOf(p, `g:${HORROR}`), 1);
});

t("evidence accumulates toward the full verdict weight", () => {
  let p = emptyProfile();
  for (let i = 0; i < 10; i++) p = rate(p, title(i, [HORROR]), "loved");
  assert.ok(weightOf(p, `g:${HORROR}`) > 2.4, "ten loves should approach +3");
});

t("liked genres outrank disliked ones", () => {
  let p = emptyProfile();
  p = rate(p, title(1, [HORROR]), "loved");
  p = rate(p, title(2, [HORROR]), "loved");
  p = rate(p, title(3, [ROMANCE]), "nope");
  const horror = score(p, title(90, [HORROR]));
  const romance = score(p, title(91, [ROMANCE]));
  assert.ok(horror.score > romance.score, `${horror.score} !> ${romance.score}`);
});

t("a rejected feature vetoes an otherwise-liked title", () => {
  let p = emptyProfile();
  for (let i = 0; i < 6; i++) p = rate(p, title(i, [DRAMA]), "loved");
  for (let i = 10; i < 16; i++) p = rate(p, title(i, [MUSIC]), "nope");
  const plain = score(p, title(90, [DRAMA]));
  const musical = score(p, title(91, [DRAMA, MUSIC]));
  assert.ok(musical.score < plain.score - 1, "the musical should be pushed well below");
});

t("re-rating replaces the old verdict instead of stacking on it", () => {
  const film = title(1, [HORROR]);
  let p = rate(emptyProfile(), film, "loved");
  p = rate(p, film, "nope");
  assert.equal(p.feat[`g:${HORROR}`].n, 1, "should still be one piece of evidence");
  assert.ok(weightOf(p, `g:${HORROR}`) < 0, "should now read as disliked");
});

t("'loved' counts are tracked separately so the copy can cite them", () => {
  let p = emptyProfile();
  p = rate(p, title(1, [HORROR]), "loved");
  p = rate(p, title(2, [HORROR]), "nope");
  p = rate(p, title(3, [HORROR]), "loved");
  assert.equal(p.feat[`g:${HORROR}`].pos, 2);
  assert.equal(p.feat[`g:${HORROR}`].n, 3);
  // Flipping a love to a nope must decrement the love count too.
  p = rate(p, title(1, [HORROR]), "nope");
  assert.equal(p.feat[`g:${HORROR}`].pos, 1);
});

t("keywords sharpen the score beyond genre alone", () => {
  let p = emptyProfile();
  p.feat["k:4565"] = { sum: 9, n: 3, pos: 3 }; // three loved "dystopia" titles
  const withKeyword = score(p, title(90, [DRAMA]), {}, [4565]);
  const without = score(p, title(90, [DRAMA]));
  assert.ok(withKeyword.score > without.score);
});

t("reasons name the features that actually drove the pick", () => {
  let p = emptyProfile();
  for (let i = 0; i < 5; i++) p = rate(p, title(i, [HORROR], { lang: "ko" }), "loved");
  const s = score(p, title(90, [HORROR], { lang: "ko" }), { [`g:${HORROR}`]: "Horror" });
  assert.ok(s.reasons.some((r) => r.label === "Horror"), `got ${JSON.stringify(s.reasons)}`);
});

t("isoWeek anchors and advances correctly", () => {
  assert.equal(isoWeek(new Date("2026-01-01T12:00:00Z")), "2026-W01");
  // Mon 31 Aug and Sun 6 Sep 2026 are the same ISO week.
  assert.equal(isoWeek(new Date("2026-08-31T12:00:00Z")), isoWeek(new Date("2026-09-06T12:00:00Z")));
  assert.notEqual(isoWeek(new Date("2026-09-06T12:00:00Z")), isoWeek(new Date("2026-09-07T12:00:00Z")));
});

t("a week's picks are stable, and the next week's differ", () => {
  let p = emptyProfile();
  p = rate(p, title(1, [HORROR]), "loved");
  const pool = Array.from({ length: 40 }, (_, i) => title(100 + i, [i % 2 ? HORROR : DRAMA]));
  const a = pickFrom(p, pool, 6, "2026-W36").map((s) => s.title.key);
  const b = pickFrom(p, pool, 6, "2026-W36").map((s) => s.title.key);
  const c = pickFrom(p, pool, 6, "2026-W37").map((s) => s.title.key);
  assert.deepEqual(a, b, "same week must be deterministic");
  assert.notDeepEqual(a, c, "a new week must reshuffle");
});

t("already rated, watched or served titles never come back", () => {
  let p = emptyProfile();
  p = rate(p, title(100, [DRAMA]), "loved");
  p.watched.push("movie:101");
  const pool = [title(100, [DRAMA]), title(101, [DRAMA]), title(102, [DRAMA])];
  const picks = pickFrom(p, pool, 6, "seed", {}, new Set(["movie:102"])).map((s) => s.title.key);
  assert.deepEqual(picks, []);
});

t("blind spot finds the least-explored genre, skipping rejected ones", () => {
  let p = emptyProfile();
  for (let i = 0; i < 4; i++) p = rate(p, title(i, [DRAMA]), "loved");
  for (let i = 10; i < 14; i++) p = rate(p, title(i, [MUSIC]), "nope");
  const genres = { [DRAMA]: "Drama", [MUSIC]: "Music", [HORROR]: "Horror" };
  assert.equal(blindSpot(p, genres), HORROR);
});

console.log(`\n${n} checks passed`);
