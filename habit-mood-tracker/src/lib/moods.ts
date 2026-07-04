// Russell's circumplex model of affect: mood as a point in a 2D space of
// valence (unpleasant <-> pleasant) and arousal (calm <-> energized).

export interface Quadrant {
  label: string;
  emoji: string;
  color: string;
}

/** Classify a valence/arousal pair (each -100..100) into a named affect. */
export function classify(valence: number, arousal: number): Quadrant {
  const hi = arousal >= 0;
  const pos = valence >= 0;
  const intense = Math.hypot(valence, arousal) > 55;

  if (pos && hi) return { label: intense ? "Elated" : "Upbeat", emoji: "🤩", color: "#f59e0b" };
  if (pos && !hi) return { label: intense ? "Serene" : "Content", emoji: "😌", color: "#22c55e" };
  if (!pos && hi) return { label: intense ? "Stressed" : "Tense", emoji: "😣", color: "#ef4444" };
  return { label: intense ? "Down" : "Flat", emoji: "😔", color: "#3b82f6" };
}

/** Map valence (-100..100) to a 5-color scale for heatmaps. */
export function valenceColor(v: number): string {
  if (v <= -60) return "#ef4444";
  if (v <= -20) return "#f97316";
  if (v < 20) return "#eab308";
  if (v < 60) return "#22c55e";
  return "#06b6d4";
}

/** A single 0..100 "mood score" from the circumplex, weighted toward valence. */
export function moodScore(valence: number, arousal: number): number {
  return Math.round(((valence * 0.8 + arousal * 0.2) + 100) / 2);
}
