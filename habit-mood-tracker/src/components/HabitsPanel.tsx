import { useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import type { TrackerData } from "../hooks/useData";
import type { TrackedFactor } from "../lib/types";

const EMOJI_CHOICES = ["🏃", "📖", "🧘", "🌙", "💧", "🥗", "✍️", "🎸", "💪", "🧹", "☎️", "🌱"];
const COLOR_CHOICES = ["#22c55e", "#06b6d4", "#a855f7", "#f59e0b", "#ef4444", "#ec4899"];

export function HabitsPanel({ data, today }: { data: TrackerData; today: string }) {
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [target, setTarget] = useState(7);

  const doneToday = (habitId: string) =>
    data.logs.some((l) => l.habit_id === habitId && l.date === today);
  const doneCount = data.habits.filter((h) => doneToday(h.id)).length;

  const add = async () => {
    if (!newName.trim()) return;
    await data.addHabit({ name: newName.trim(), emoji, color, target_per_week: target });
    setNewName("");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-white/80">Today's habits</h3>
        <button
          onClick={() => setManaging((m) => !m)}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
        >
          {managing ? "Done" : "Customize"}
        </button>
      </div>

      <div className="space-y-2">
        {data.habits.map((h) => {
          const done = doneToday(h.id);
          return (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{
                borderColor: done ? `${h.color}66` : "rgba(255,255,255,0.08)",
                background: done ? `${h.color}18` : "rgba(255,255,255,0.02)",
              }}
            >
              <button
                onClick={() => {
                  data.toggleHabit(h.id, today);
                  if (!done && doneCount + 1 === data.habits.length) {
                    confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 } });
                  }
                }}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="text-xl">{h.emoji}</span>
                <span className="flex-1 text-sm text-white/85">{h.name}</span>
                <span className="text-[10px] text-white/35">{h.target_per_week}×/wk</span>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                  style={{
                    borderColor: done ? h.color : "rgba(255,255,255,0.2)",
                    background: done ? h.color : "transparent",
                  }}
                >
                  {done ? "✓" : ""}
                </span>
              </button>
              {managing && (
                <button
                  onClick={() => data.deleteHabit(h.id)}
                  className="text-xs text-red-400/70 hover:text-red-400"
                  title="Remove habit"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {managing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New habit name…"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`rounded-md px-1.5 py-1 text-lg ${emoji === e ? "bg-white/15" : "hover:bg-white/5"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full"
                  style={{ background: c, outline: color === c ? "2px solid white" : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-white/50">
              target
              <input
                type="number"
                min={1}
                max={7}
                value={target}
                onChange={(e) => setTarget(Math.max(1, Math.min(7, Number(e.target.value))))}
                className="w-12 rounded border border-white/15 bg-black/30 px-2 py-1 text-white"
              />
              ×/wk
            </label>
          </div>
          <button
            onClick={add}
            className="w-full rounded-lg bg-white/90 py-2 text-sm font-medium text-black hover:bg-white"
          >
            Add habit
          </button>

          <FactorManager
            factors={data.factors}
            onAdd={data.addFactor}
            onDelete={data.deleteFactor}
          />
        </motion.div>
      )}

      <p className="mt-4 text-center text-xs text-white/40">
        {doneCount}/{data.habits.length} done today
      </p>
    </div>
  );
}

function FactorManager({
  factors,
  onAdd,
  onDelete,
}: {
  factors: TrackedFactor[];
  onAdd: TrackerData["addFactor"];
  onDelete: TrackerData["deleteFactor"];
}) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("📊");

  const add = async () => {
    const key = label.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key) return;
    await onAdd({
      key,
      label: label.trim(),
      emoji,
      kind: "scale",
      min: 0,
      max: 10,
      sort_order: factors.length,
    });
    setLabel("");
  };

  return (
    <div className="border-t border-white/10 pt-3">
      <div className="mb-2 text-xs font-medium text-white/60">Tracked factors</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {factors.map((f) => (
          <span
            key={f.id}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
          >
            {f.emoji} {f.label}
            <button onClick={() => onDelete(f.id)} className="text-red-400/70 hover:text-red-400">
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
          className="w-12 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-center text-sm text-white outline-none"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New factor (e.g. Caffeine)"
          className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
        />
        <button onClick={add} className="rounded-lg bg-white/90 px-3 text-sm font-medium text-black hover:bg-white">
          +
        </button>
      </div>
    </div>
  );
}
