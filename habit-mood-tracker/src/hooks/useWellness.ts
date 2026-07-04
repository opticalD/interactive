import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { WellnessItem, WellnessLog } from "../lib/types";

export interface WellnessData {
  items: WellnessItem[];
  logs: WellnessLog[];
  loading: boolean;
  toggleToday: (itemId: string, date: string) => Promise<void>;
  addItem: (
    item: Pick<WellnessItem, "kind" | "name" | "emoji" | "color"> &
      Partial<Pick<WellnessItem, "dose" | "schedule" | "brand" | "notes">>
  ) => Promise<void>;
  updateItem: (id: string, patch: Partial<WellnessItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

/** Loads and mutates the signed-in user's supplements & skincare (RLS-scoped). */
export function useWellness(userId: string | undefined): WellnessData {
  const [items, setItems] = useState<WellnessItem[]>([]);
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [i, l] = await Promise.all([
      supabase.from("wellness_items").select("*").eq("archived", false).order("sort_order"),
      supabase.from("wellness_logs").select("id,item_id,date"),
    ]);
    setItems((i.data as WellnessItem[]) ?? []);
    setLogs((l.data as WellnessLog[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleToday = useCallback(
    async (itemId: string, date: string) => {
      const existing = logs.find((x) => x.item_id === itemId && x.date === date);
      if (existing) {
        setLogs((p) => p.filter((x) => x.id !== existing.id));
        await supabase.from("wellness_logs").delete().eq("id", existing.id);
      } else {
        const tmp: WellnessLog = { id: `tmp-${itemId}-${date}`, item_id: itemId, date };
        setLogs((p) => [...p, tmp]);
        const { data } = await supabase
          .from("wellness_logs")
          .insert({ item_id: itemId, date })
          .select("id,item_id,date")
          .single();
        if (data) setLogs((p) => p.map((x) => (x.id === tmp.id ? (data as WellnessLog) : x)));
      }
    },
    [logs]
  );

  const addItem = useCallback<WellnessData["addItem"]>(
    async (item) => {
      const sort_order = items.filter((x) => x.kind === item.kind).length;
      await supabase.from("wellness_items").insert({ ...item, sort_order });
      await reload();
    },
    [items, reload]
  );

  const updateItem = useCallback(async (id: string, patch: Partial<WellnessItem>) => {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("wellness_items").update(patch).eq("id", id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((p) => p.filter((x) => x.id !== id));
    await supabase.from("wellness_items").update({ archived: true }).eq("id", id);
  }, []);

  return { items, logs, loading, toggleToday, addItem, updateItem, deleteItem };
}
