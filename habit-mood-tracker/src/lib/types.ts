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

export type WellnessKind = "supplement" | "skincare";

export interface WellnessItem {
  id: string;
  user_id: string;
  kind: WellnessKind;
  name: string;
  emoji: string;
  dose: string | null;
  schedule: string | null;
  brand: string | null;
  notes: string | null;
  color: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface WellnessLog {
  id: string;
  item_id: string;
  date: string;
}

export const SCHEDULES = ["AM", "PM", "Both", "With food", "As needed"] as const;

/** One-tap starter suggestions so the tracker never feels empty. */
export const WELLNESS_SUGGESTIONS: Record<
  WellnessKind,
  { name: string; emoji: string; dose?: string; schedule?: string; color: string }[]
> = {
  supplement: [
    { name: "Vitamin D3", emoji: "☀️", dose: "1000 IU", schedule: "With food", color: "#f59e0b" },
    { name: "Omega-3", emoji: "🐟", dose: "1000 mg", schedule: "With food", color: "#06b6d4" },
    { name: "Magnesium", emoji: "🌙", dose: "300 mg", schedule: "PM", color: "#a855f7" },
    { name: "Multivitamin", emoji: "💊", schedule: "AM", color: "#22c55e" },
    { name: "Creatine", emoji: "💪", dose: "5 g", schedule: "AM", color: "#ef4444" },
    { name: "Vitamin B12", emoji: "⚡", dose: "500 mcg", schedule: "AM", color: "#eab308" },
    { name: "Zinc", emoji: "🛡️", dose: "15 mg", schedule: "With food", color: "#14b8a6" },
    { name: "Probiotic", emoji: "🦠", schedule: "AM", color: "#ec4899" },
  ],
  skincare: [
    { name: "Cleanser", emoji: "🧼", schedule: "Both", color: "#06b6d4" },
    { name: "Moisturizer", emoji: "💧", schedule: "Both", color: "#3b82f6" },
    { name: "Sunscreen SPF", emoji: "🧴", schedule: "AM", color: "#f59e0b" },
    { name: "Vitamin C serum", emoji: "🍊", schedule: "AM", color: "#eab308" },
    { name: "Retinol", emoji: "🌛", schedule: "PM", color: "#a855f7" },
    { name: "Niacinamide", emoji: "✨", schedule: "Both", color: "#22c55e" },
    { name: "Hyaluronic acid", emoji: "💦", schedule: "Both", color: "#0ea5e9" },
    { name: "Face mask", emoji: "🎭", schedule: "As needed", color: "#ec4899" },
  ],
};

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
