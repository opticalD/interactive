export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface DayEntry {
  /** ISO date, e.g. "2026-07-04" */
  date: string;
  mood?: MoodLevel;
  /** habit id -> completed */
  habits: Record<string, boolean>;
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface AppData {
  habits: Habit[];
  entries: Record<string, DayEntry>;
}

export const MOODS: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😖", label: "Awful", color: "#ef4444" },
  2: { emoji: "🙁", label: "Low", color: "#f97316" },
  3: { emoji: "😐", label: "Okay", color: "#eab308" },
  4: { emoji: "🙂", label: "Good", color: "#22c55e" },
  5: { emoji: "😄", label: "Great", color: "#06b6d4" },
};
