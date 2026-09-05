/**
 * The programme's voice. Every sentence is derived from counts the model
 * actually holds — it never invents criticism it can't support.
 */

import type { Profile } from "./taste";
import type { Pick } from "./store";

const TIMES = ["", "once", "twice", "three times", "four times", "five times", "six times",
  "seven times", "eight times", "nine times", "ten times", "eleven times", "twelve times"];
const times = (n: number) => TIMES[n] ?? `${n} times`;

const marks = (profile: Profile) => Object.keys(profile.verdicts).length;

/** Stable per title, so a pick's sentence never changes between visits. */
function variant(seed: string, count: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Math.abs(h) % count;
}

/** The clause that explains the match itself, before any slot framing. */
function because(pick: Pick, profile: Profile): string {
  const [first, second] = pick.reasons;
  const yes = (key: string) => profile.feat[key]?.pos ?? 0;

  const thing = pick.title.kind === "tv" ? "series" : "film";

  if (first && second) {
    const n = yes(first.key);
    const pair = [
      `You've said yes to ${first.label} ${times(n)}, and to ${second.label} as well. This ${thing} is both at once.`,
      `${first.label} and ${second.label} — a pairing your ballot keeps circling back to.`,
      `Your record leans ${first.label}. It leans ${second.label} too. This sits on the join.`,
      `Two things you keep marking yes: ${first.label}, then ${second.label}. Here they are together.`,
      `${first.label} again, but crossed with ${second.label}, which is the part you haven't tried.`,
    ];
    return pair[variant(pick.title.key, pair.length)];
  }
  if (first) {
    const n = yes(first.key);
    const solo = [
      `You've said yes to ${first.label} ${times(n)}. You haven't seen this one.`,
      `${first.label} is the strongest thing in your record, and this is the gap in it.`,
      `Straight down the line of your ${first.label} marks.`,
      `Your ballot points at ${first.label} more than anything else. This is where that leads.`,
    ];
    return solo[variant(pick.title.key, solo.length)];
  }
  if (pick.title.votes > 500) {
    return `Nothing in your ballot points here — but ${pick.title.votes.toLocaleString()} people rate it ${pick.title.rating.toFixed(1)}, and nothing in your ballot argues against it either.`;
  }
  return "A quieter one, and too little-seen for the crowd to vouch for it. That's the appeal.";
}

export function argument(pick: Pick, profile: Profile, genres: Record<number, string>): string {
  if (pick.slot === "blind") {
    const genre = pick.title.genres.map((g) => genres[g]).find(Boolean);
    const total = marks(profile);
    if (genre && total > 0) {
      return `You've marked ${total} titles and barely any of them were ${genre}. This is the one to test that against.`;
    }
    return "Outside everything you've marked so far, which is exactly why it's here.";
  }
  if (pick.slot === "theatre") return `Showing now, and not for long. ${because(pick, profile)}`;
  if (pick.slot === "new") return `Landed in the last few weeks. ${because(pick, profile)}`;
  return because(pick, profile);
}

export const SLOT_LABEL: Record<Pick["slot"], string> = {
  lead: "This week's",
  new: "Newly landed",
  theatre: "In cinemas",
  match: "For you",
  blind: "Blind spot",
};

/** "5–11 September 2026" for a given ISO week string. */
export function weekRange(week: string): string {
  const [year, w] = week.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
  const day = (d: Date) => d.getUTCDate();
  return month(monday) === month(sunday)
    ? `${day(monday)}–${day(sunday)} ${month(sunday)} ${year}`
    : `${day(monday)} ${month(monday)} – ${day(sunday)} ${month(sunday)} ${year}`;
}
