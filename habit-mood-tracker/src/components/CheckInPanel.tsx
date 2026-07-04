import { useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { MoodPad } from "./MoodPad";
import type { MoodEntry, TrackedFactor } from "../lib/types";

interface Props {
  factors: TrackedFactor[];
  onSave: (e: Omit<MoodEntry, "id" | "user_id" | "logged_at">) => Promise<void>;
}

const QUICK_TAGS = ["work", "family", "friends", "health", "money", "sleep", "outdoors", "creative"];

export function CheckInPanel({ factors, onSave }: Props) {
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);
  const [values, setValues] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const factorVal = (f: TrackedFactor) => values[f.key] ?? (f.min + f.max) / 2;

  const save = async () => {
    setSaving(true);
    const factorsPayload: Record<string, number> = {};
    for (const f of factors) factorsPayload[f.key] = factorVal(f);
    await onSave({ valence, arousal, factors: factorsPayload, tags, note: note || null });
    setSaving(false);
    setSaved(true);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#06b6d4", "#a855f7", "#f59e0b"],
    });
    setTimeout(() => setSaved(false), 1800);
    setNote("");
    setTags([]);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-white/80">How do you feel right now?</h3>

      <div className="flex justify-center">
        <MoodPad valence={valence} arousal={arousal} onChange={(v, a) => { setValence(v); setArousal(a); }} />
      </div>

      {factors.length > 0 && (
        <div className="mt-6 space-y-3">
          {factors.map((f) => (
            <div key={f.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {f.emoji} {f.label}
                </span>
                <span className="text-white/45">
                  {factorVal(f)}
                  {f.kind === "hours" ? "h" : ""}
                </span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.kind === "hours" ? 0.5 : 1}
                value={factorVal(f)}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                className="h-1.5 w-full cursor-pointer accent-cyan-400"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 text-xs text-white/50">What's driving it?</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                onClick={() => setTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  on
                    ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                    : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note — what happened today?"
        rows={2}
        className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-cyan-400"
      />

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {saved ? "Logged ✓" : saving ? "Saving…" : "Log this moment"}
      </motion.button>
    </div>
  );
}
