import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { MOODS } from "../types";
import type { AppData, MoodLevel } from "../types";

interface Props {
  data: AppData;
  today: string;
  onMood: (date: string, mood: MoodLevel) => void;
  onToggle: (date: string, habitId: string) => void;
}

export function TodayPanel({ data, today, onMood, onToggle }: Props) {
  const entry = data.entries[today] ?? { date: today, habits: {} };
  const doneCount = data.habits.filter((h) => entry.habits[h.id]).length;

  function celebrate() {
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#06b6d4", "#a855f7", "#eab308"],
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-white/80">How was today?</h3>

      <div className="mb-6 flex justify-between gap-2">
        {(Object.keys(MOODS) as unknown as MoodLevel[]).map((level) => {
          const m = MOODS[level];
          const active = entry.mood === level;
          return (
            <motion.button
              key={level}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMood(today, level)}
              className={`flex-1 rounded-xl py-3 text-2xl transition-colors ${
                active ? "ring-2" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                background: active ? `${m.color}22` : "rgba(255,255,255,0.04)",
                boxShadow: active ? `inset 0 0 0 2px ${m.color}` : "none",
              }}
              title={m.label}
            >
              {m.emoji}
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-2">
        {data.habits.map((h) => {
          const done = !!entry.habits[h.id];
          return (
            <motion.button
              key={h.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onToggle(today, h.id);
                if (!done && doneCount + 1 === data.habits.length) celebrate();
              }}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                borderColor: done ? `${h.color}66` : "rgba(255,255,255,0.08)",
                background: done ? `${h.color}18` : "rgba(255,255,255,0.02)",
              }}
            >
              <span className="text-xl">{h.emoji}</span>
              <span className="flex-1 text-sm text-white/85">{h.name}</span>
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                style={{
                  borderColor: done ? h.color : "rgba(255,255,255,0.2)",
                  background: done ? h.color : "transparent",
                }}
              >
                {done ? "✓" : ""}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        {doneCount}/{data.habits.length} habits done today
      </p>
    </div>
  );
}
