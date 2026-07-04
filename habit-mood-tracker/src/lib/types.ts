export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  target_per_week: number;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // yyyy-MM-dd
}

export type FactorKind = "scale" | "hours" | "bool";

export interface TrackedFactor {
  id: string;
  user_id: string;
  key: string;
  label: string;
  emoji: string;
  kind: FactorKind;
  min: number;
  max: number;
  sort_order: number;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  logged_at: string; // ISO timestamp
  valence: number; // -100..100  (unpleasant -> pleasant)
  arousal: number; // -100..100  (calm -> energized)
  factors: Record<string, number>;
  tags: string[];
  note: string | null;
}

/** Sensible starting factors seeded for brand-new users. */
export const DEFAULT_FACTORS: Omit<TrackedFactor, "id" | "user_id">[] = [
  { key: "sleep", label: "Sleep", emoji: "😴", kind: "hours", min: 0, max: 12, sort_order: 0 },
  { key: "energy", label: "Energy", emoji: "⚡", kind: "scale", min: 0, max: 10, sort_order: 1 },
  { key: "stress", label: "Stress", emoji: "🔥", kind: "scale", min: 0, max: 10, sort_order: 2 },
  { key: "anxiety", label: "Anxiety", emoji: "🌀", kind: "scale", min: 0, max: 10, sort_order: 3 },
  { key: "social", label: "Social", emoji: "🫂", kind: "scale", min: 0, max: 10, sort_order: 4 },
];

export const DEFAULT_HABITS: Omit<
  Habit,
  "id" | "user_id" | "created_at" | "archived"
>[] = [
  { name: "Move / exercise", emoji: "🏃", color: "#22c55e", target_per_week: 5, sort_order: 0 },
  { name: "Read", emoji: "📖", color: "#06b6d4", target_per_week: 7, sort_order: 1 },
  { name: "Meditate", emoji: "🧘", color: "#a855f7", target_per_week: 7, sort_order: 2 },
  { name: "Sleep by 11", emoji: "🌙", color: "#f59e0b", target_per_week: 7, sort_order: 3 },
];
