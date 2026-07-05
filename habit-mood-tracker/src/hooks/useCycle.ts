import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCrypto } from "../auth/CryptoProvider";
import type { Flow, PeriodLog } from "../lib/types";

interface PeriodSecret {
  flow: Flow | null;
  symptoms: string[];
  notes: string | null;
}

type RawRow = { id: string; started_on: string; ended_on: string | null; secret: string | null };

export interface CycleData {
  enabled: boolean;
  periods: PeriodLog[];
  loading: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  startPeriod: (date: string) => Promise<void>;
  updatePeriod: (id: string, patch: Partial<Omit<PeriodLog, "id">>) => Promise<void>;
  deletePeriod: (id: string) => Promise<void>;
}

export function useCycle(userId: string | undefined): CycleData {
  const { encrypt, decrypt } = useCrypto();
  const [enabled, setEnabled] = useState(false);
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [s, p] = await Promise.all([
      supabase.from("user_settings").select("cycle_tracking").eq("user_id", userId).maybeSingle(),
      supabase.from("period_logs").select("id,started_on,ended_on,secret").order("started_on", { ascending: false }),
    ]);
    setEnabled(!!s.data?.cycle_tracking);
    const rows = (p.data as RawRow[]) ?? [];
    const out: PeriodLog[] = [];
    for (const r of rows) {
      let sec: PeriodSecret = { flow: null, symptoms: [], notes: null };
      if (r.secret) {
        try {
          sec = await decrypt<PeriodSecret>(r.secret);
        } catch {
          /* skip */
        }
      }
      out.push({ id: r.id, started_on: r.started_on, ended_on: r.ended_on, ...sec });
    }
    setPeriods(out);
    setLoading(false);
  }, [userId, decrypt]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const enable = useCallback(async () => {
    setEnabled(true);
    await supabase.from("user_settings").upsert({ user_id: userId, cycle_tracking: true });
  }, [userId]);

  const disable = useCallback(async () => {
    setEnabled(false);
    await supabase.from("user_settings").upsert({ user_id: userId, cycle_tracking: false });
  }, [userId]);

  const encSecret = (p: { flow: Flow | null; symptoms: string[]; notes: string | null }) =>
    encrypt({ flow: p.flow, symptoms: p.symptoms, notes: p.notes } satisfies PeriodSecret);

  const startPeriod = useCallback(
    async (date: string) => {
      const secret = await encSecret({ flow: null, symptoms: [], notes: null });
      await supabase.from("period_logs").insert({ started_on: date, secret });
      await reload();
    },
    [reload, encrypt]
  );

  const updatePeriod = useCallback(
    async (id: string, patch: Partial<Omit<PeriodLog, "id">>) => {
      const current = periods.find((x) => x.id === id);
      if (!current) return;
      const merged = { ...current, ...patch };
      setPeriods((prev) => prev.map((x) => (x.id === id ? merged : x)));
      const secret = await encSecret(merged);
      await supabase
        .from("period_logs")
        .update({ ended_on: merged.ended_on, secret })
        .eq("id", id);
    },
    [periods, encrypt]
  );

  const deletePeriod = useCallback(async (id: string) => {
    setPeriods((p) => p.filter((x) => x.id !== id));
    await supabase.from("period_logs").delete().eq("id", id);
  }, []);

  return { enabled, periods, loading, enable, disable, startPeriod, updatePeriod, deletePeriod };
}
