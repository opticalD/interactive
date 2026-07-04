import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  DEFAULT_FACTORS,
  DEFAULT_HABITS,
  type Habit,
  type HabitLog,
  type MoodEntry,
  type TrackedFactor,
} from "../lib/types";

export interface TrackerData {
  habits: Habit[];
  logs: HabitLog[];
  factors: TrackedFactor[];
  entries: MoodEntry[];
  loading: boolean;
  reload: () => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  addHabit: (h: Pick<Habit, "name" | "emoji" | "color" | "target_per_week">) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addFactor: (f: Omit<TrackedFactor, "id" | "user_id">) => Promise<void>;
  deleteFactor: (id: string) => Promise<void>;
  addEntry: (e: Omit<MoodEntry, "id" | "user_id" | "logged_at">) => Promise<void>;
}

/** Loads and mutates the signed-in user's tracker data (RLS scopes everything). */
export function useData(userId: string | undefined): TrackerData {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [factors, setFactors] = useState<TrackedFactor[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // Guards against a race (e.g. React StrictMode's double effect invocation)
  // seeding the default habits/factors twice for a brand-new account.
  const seeding = useRef(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [h, l, f, e] = await Promise.all([
      supabase.from("habits").select("*").eq("archived", false).order("sort_order"),
      supabase.from("habit_logs").select("id,habit_id,date"),
      supabase.from("tracked_factors").select("*").order("sort_order"),
      supabase.from("mood_entries").select("*").order("logged_at", { ascending: false }),
    ]);
    let hab = (h.data as Habit[]) ?? [];
    let fac = (f.data as TrackedFactor[]) ?? [];

    // First-run seeding for a brand-new account (guarded against double-run).
    if (hab.length === 0 && fac.length === 0 && !seeding.current) {
      seeding.current = true;
      const { error: he } = await supabase.from("habits").insert(DEFAULT_HABITS);
      const { error: fe } = await supabase.from("tracked_factors").insert(DEFAULT_FACTORS);
      if (he || fe) {
        // Seeding failed (e.g. auth still settling right after signup) — release
        // the guard so the next reload can retry cleanly instead of getting stuck.
        seeding.current = false;
      } else {
        const [h2, f2] = await Promise.all([
          supabase.from("habits").select("*").eq("archived", false).order("sort_order"),
          supabase.from("tracked_factors").select("*").order("sort_order"),
        ]);
        hab = (h2.data as Habit[]) ?? [];
        fac = (f2.data as TrackedFactor[]) ?? [];
      }
    }

    setHabits(hab);
    setFactors(fac);
    setLogs((l.data as HabitLog[]) ?? []);
    setEntries((e.data as MoodEntry[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
    // Safety net: if the very first load raced auth setup, reload once the
    // session is confirmed so seeded factors/habits appear without a refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void reload();
    });
    return () => sub.subscription.unsubscribe();
  }, [reload]);

  const toggleHabit = useCallback(
    async (habitId: string, date: string) => {
      const existing = logs.find((x) => x.habit_id === habitId && x.date === date);
      if (existing) {
        setLogs((p) => p.filter((x) => x.id !== existing.id));
        await supabase.from("habit_logs").delete().eq("id", existing.id);
      } else {
        const tmp: HabitLog = { id: `tmp-${habitId}-${date}`, habit_id: habitId, date };
        setLogs((p) => [...p, tmp]);
        const { data } = await supabase
          .from("habit_logs")
          .insert({ habit_id: habitId, date })
          .select("id,habit_id,date")
          .single();
        if (data) setLogs((p) => p.map((x) => (x.id === tmp.id ? (data as HabitLog) : x)));
      }
    },
    [logs]
  );

  const addHabit = useCallback(
    async (h: Pick<Habit, "name" | "emoji" | "color" | "target_per_week">) => {
      const sort_order = habits.length;
      await supabase.from("habits").insert({ ...h, sort_order });
      await reload();
    },
    [habits.length, reload]
  );

  const updateHabit = useCallback(
    async (id: string, patch: Partial<Habit>) => {
      setHabits((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      await supabase.from("habits").update(patch).eq("id", id);
    },
    []
  );

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((p) => p.filter((x) => x.id !== id));
    await supabase.from("habits").update({ archived: true }).eq("id", id);
  }, []);

  const addFactor = useCallback(
    async (f: Omit<TrackedFactor, "id" | "user_id">) => {
      await supabase.from("tracked_factors").insert(f);
      await reload();
    },
    [reload]
  );

  const deleteFactor = useCallback(async (id: string) => {
    setFactors((p) => p.filter((x) => x.id !== id));
    await supabase.from("tracked_factors").delete().eq("id", id);
  }, []);

  const addEntry = useCallback(
    async (e: Omit<MoodEntry, "id" | "user_id" | "logged_at">) => {
      const { data } = await supabase.from("mood_entries").insert(e).select("*").single();
      if (data) setEntries((p) => [data as MoodEntry, ...p]);
    },
    []
  );

  return {
    habits,
    logs,
    factors,
    entries,
    loading,
    reload,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    addFactor,
    deleteFactor,
    addEntry,
  };
}
