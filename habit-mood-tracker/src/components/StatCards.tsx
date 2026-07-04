import { useMemo } from "react";
import { motion } from "framer-motion";
import { currentStreak } from "../store";
import type { AppData } from "../types";

export function StatCards({ data }: { data: AppData }) {
  const stats = useMemo(() => {
    const entries = Object.values(data.entries);
    const moods = entries.map((e) => e.mood).filter(Boolean) as number[];
    const avg = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
    const totalDone = entries.reduce(
      (acc, e) => acc + Object.values(e.habits).filter(Boolean).length,
      0
    );
    return {
      streak: currentStreak(data.entries),
      avgMood: avg.toFixed(1),
      logged: entries.length,
      totalDone,
    };
  }, [data]);

  const cards = [
    { label: "Current streak", value: `${stats.streak}🔥`, tint: "#f97316" },
    { label: "Avg mood", value: stats.avgMood, tint: "#06b6d4" },
    { label: "Days logged", value: `${stats.logged}`, tint: "#a855f7" },
    { label: "Habits completed", value: `${stats.totalDone}`, tint: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
          style={{ boxShadow: `inset 0 -30px 40px -30px ${c.tint}55` }}
        >
          <div className="text-2xl font-semibold" style={{ color: c.tint }}>
            {c.value}
          </div>
          <div className="mt-1 text-xs text-white/50">{c.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
