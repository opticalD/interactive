import { useMemo } from "react";
import { eachDayOfInterval, format, getDay, startOfWeek, subDays } from "date-fns";
import { motion } from "framer-motion";
import { MOODS } from "../types";
import type { AppData } from "../types";

const WEEKS = 20;

export function MoodHeatmap({ data }: { data: AppData }) {
  const grid = useMemo(() => {
    const end = new Date();
    const start = startOfWeek(subDays(end, WEEKS * 7 - 1), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const cols: { date: string; mood?: number }[][] = [];
    for (const day of days) {
      const iso = format(day, "yyyy-MM-dd");
      const col = getDay(day);
      if (col === 0 || cols.length === 0) cols.push([]);
      cols[cols.length - 1].push({ date: iso, mood: data.entries[iso]?.mood });
    }
    return cols;
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/80">Mood over time</h3>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span>low</span>
          {[1, 2, 3, 4, 5].map((m) => (
            <span
              key={m}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: MOODS[m as 1].color }}
            />
          ))}
          <span>great</span>
        </div>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {grid.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ci * 0.008 }}
                title={`${cell.date}${cell.mood ? ` · ${MOODS[cell.mood as 1].label}` : " · no entry"}`}
                className="h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-125"
                style={{
                  background: cell.mood ? MOODS[cell.mood as 1].color : "rgba(255,255,255,0.05)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
