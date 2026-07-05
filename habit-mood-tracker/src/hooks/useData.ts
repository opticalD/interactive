import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCrypto } from "../auth/CryptoProvider";
import {
  type Habit,
  type HabitLog,
  type MoodEntry,
  type TrackedFactor,
} from "../lib/types";

/** The sensitive mood fields that get encrypted into `secret`. */
interface MoodSecret {
  valence: number;
  arousal: number;
  factors: Record<string, number>;
  tags: string[];
  note: string | null;
}


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
  const { encrypt, decrypt } = useCrypto();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [factors, setFactors] = useState<TrackedFactor[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [h, l, f, e] = await Promise.all([
      supabase.from("habits").select("*").eq("archived", false).order("sort_order"),
      supabase.from("habit_logs").select("id,habit_id,date"),
      supabase.from("tracked_factors").select("*").order("sort_order"),
      supabase.from("mood_entries").select("*").order("logged_at", { ascending: false }),
    ]);
    // Default habits & factors are seeded server-side by a trigger on signup —
    // the client never seeds, which removes the auth-race that caused duplicates.
    const hab = (h.data as Habit[]) ?? [];
    const fac = (f.data as TrackedFactor[]) ?? [];

    // Decrypt mood entries (and migrate any legacy plaintext rows to encrypted).
    type RawEntry = MoodEntry & { secret: string | null };
    const rawEntries = (e.data as RawEntry[]) ?? [];
    const decrypted: MoodEntry[] = [];
    for (const row of rawEntries) {
      if (row.secret) {
        try {
          const s = await decrypt<MoodSecret>(row.secret);
          decrypted.push({
            id: row.id,
            user_id: row.user_id,
            logged_at: row.logged_at,
            valence: s.valence,
            arousal: s.arousal,
            factors: s.factors ?? {},
            tags: s.tags ?? [],
            note: s.note ?? null,
          });
        } catch {
          /* wrong key — skip this row rather than crash */
        }
      } else {
        // Legacy plaintext row: show it, then re-encrypt it in the background.
        decrypted.push({
          id: row.id,
          user_id: row.user_id,
          logged_at: row.logged_at,
          valence: row.valence ?? 0,
          arousal: row.arousal ?? 0,
          factors: row.factors ?? {},
          tags: row.tags ?? [],
          note: row.note ?? null,
        });
        if (row.valence != null) {
          const secret = await encrypt({
            valence: row.valence,
            arousal: row.arousal,
            factors: row.factors ?? {},
            tags: row.tags ?? [],
            note: row.note ?? null,
          } satisfies MoodSecret);
          void supabase
            .from("mood_entries")
            .update({ secret, valence: null, arousal: null, factors: {}, tags: [], note: null })
            .eq("id", row.id);
        }
      }
    }

    setHabits(hab);
    setFactors(fac);
    setLogs((l.data as HabitLog[]) ?? []);
    setEntries(decrypted);
    setLoading(false);
  }, [userId, encrypt, decrypt]);

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
      // Encrypt the sensitive mood payload; store only ciphertext in the DB.
      const secret = await encrypt({
        valence: e.valence,
        arousal: e.arousal,
        factors: e.factors,
        tags: e.tags,
        note: e.note,
      } satisfies MoodSecret);
      const { data } = await supabase
        .from("mood_entries")
        .insert({ secret, factors: {}, tags: [] })
        .select("id,user_id,logged_at")
        .single();
      if (data) {
        setEntries((p) => [
          {
            id: data.id,
            user_id: data.user_id,
            logged_at: data.logged_at,
            valence: e.valence,
            arousal: e.arousal,
            factors: e.factors,
            tags: e.tags,
            note: e.note,
          },
          ...p,
        ]);
      }
    },
    [encrypt]
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
