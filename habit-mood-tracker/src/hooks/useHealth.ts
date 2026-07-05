import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCrypto } from "../auth/CryptoProvider";
import type { HealthEvent, Medicine } from "../lib/types";

interface HealthSecret {
  condition: string;
  severity: number;
  symptoms: string[];
  medicines: Medicine[];
  notes: string | null;
}

type RawRow = { id: string; started_on: string; ended_on: string | null; secret: string | null };

export interface HealthData {
  events: HealthEvent[];
  loading: boolean;
  addEvent: (e: Omit<HealthEvent, "id">) => Promise<void>;
  updateEvent: (id: string, e: Omit<HealthEvent, "id">) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export function useHealth(userId: string | undefined): HealthData {
  const { encrypt, decrypt } = useCrypto();
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("health_events")
      .select("id,started_on,ended_on,secret")
      .order("started_on", { ascending: false });
    const rows = (data as RawRow[]) ?? [];
    const out: HealthEvent[] = [];
    for (const r of rows) {
      let s: HealthSecret = { condition: "Illness", severity: 3, symptoms: [], medicines: [], notes: null };
      if (r.secret) {
        try {
          s = await decrypt<HealthSecret>(r.secret);
        } catch {
          /* skip undecryptable */
        }
      }
      out.push({ id: r.id, started_on: r.started_on, ended_on: r.ended_on, ...s });
    }
    setEvents(out);
    setLoading(false);
  }, [userId, decrypt]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const payload = async (e: Omit<HealthEvent, "id">) => ({
    started_on: e.started_on,
    ended_on: e.ended_on,
    secret: await encrypt({
      condition: e.condition,
      severity: e.severity,
      symptoms: e.symptoms,
      medicines: e.medicines,
      notes: e.notes,
    } satisfies HealthSecret),
  });

  const addEvent = useCallback(
    async (e: Omit<HealthEvent, "id">) => {
      await supabase.from("health_events").insert(await payload(e));
      await reload();
    },
    [reload, encrypt]
  );

  const updateEvent = useCallback(
    async (id: string, e: Omit<HealthEvent, "id">) => {
      await supabase.from("health_events").update(await payload(e)).eq("id", id);
      await reload();
    },
    [reload, encrypt]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      setEvents((p) => p.filter((x) => x.id !== id));
      await supabase.from("health_events").delete().eq("id", id);
    },
    []
  );

  return { events, loading, addEvent, updateEvent, deleteEvent };
}
