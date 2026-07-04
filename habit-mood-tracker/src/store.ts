import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import type { AppData, DayEntry, Habit, MoodLevel } from "./types";

const KEY = "bloom.data.v1";

const DEFAULT_HABITS: Habit[] = [
  { id: "move", name: "Move / exercise", emoji: "🏃", color: "#22c55e" },
  { id: "read", name: "Read", emoji: "📖", color: "#06b6d4" },
  { id: "water", name: "Hydrate", emoji: "💧", color: "#3b82f6" },
  { id: "sleep", name: "Sleep by 11", emoji: "😴", color: "#a855f7" },
];

/** Generate ~90 days of plausible seed data so the dashboard looks alive. */
function seed(): AppData {
  const entries: Record<string, DayEntry> = {};
  for (let i = 89; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    // skip a few random days to look realistic
    if (Math.random() < 0.12) continue;
    const wave = Math.sin(i / 9) * 1.2;
    const mood = Math.min(5, Math.max(1, Math.round(3 + wave + (Math.random() - 0.5)))) as MoodLevel;
    const habits: Record<string, boolean> = {};
    for (const h of DEFAULT_HABITS) habits[h.id] = Math.random() < 0.55 + wave * 0.1;
    entries[date] = { date, mood, habits };
  }
  return { habits: DEFAULT_HABITS, entries };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    /* ignore */
  }
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function useTracker() {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  const today = format(new Date(), "yyyy-MM-dd");

  const setMood = useCallback((date: string, mood: MoodLevel) => {
    setData((d) => {
      const prev = d.entries[date] ?? { date, habits: {} };
      return { ...d, entries: { ...d.entries, [date]: { ...prev, mood } } };
    });
  }, []);

  const toggleHabit = useCallback((date: string, habitId: string) => {
    setData((d) => {
      const prev = d.entries[date] ?? { date, habits: {} };
      const habits = { ...prev.habits, [habitId]: !prev.habits[habitId] };
      return { ...d, entries: { ...d.entries, [date]: { ...prev, habits } } };
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setData(seed());
  }, []);

  return { data, today, setMood, toggleHabit, reset };
}

/** Longest current streak where at least one habit was completed. */
export function currentStreak(entries: Record<string, DayEntry>): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const e = entries[date];
    const done = e && Object.values(e.habits).some(Boolean);
    if (done) streak++;
    else if (i === 0) continue; // today not logged yet — keep counting from yesterday
    else break;
  }
  return streak;
}
