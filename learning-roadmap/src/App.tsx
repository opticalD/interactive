import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { ROADMAP, TOTAL_ITEMS } from "./roadmap";
import { STATUS_META, STATUS_ORDER, useProgress, type Status } from "./store";
import { Track } from "./components/Track";

export default function App() {
  const { progress, statusOf, setStatus, setNote, reset, exportJson, importJson } = useProgress();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const completedTracks = useRef<Set<string>>(new Set());

  const counts = useMemo(() => {
    const c: Record<Status, number> = { todo: 0, learning: 0, help: 0, done: 0 };
    for (const t of ROADMAP) for (const it of t.items) c[statusOf(it.id)]++;
    return c;
  }, [statusOf]);

  const overallPct = Math.round((counts.done / TOTAL_ITEMS) * 100);

  // Celebrate when a track first reaches 100%.
  useEffect(() => {
    for (const t of ROADMAP) {
      const done = t.items.every((it) => statusOf(it.id) === "done");
      if (done && !completedTracks.current.has(t.id)) {
        completedTracks.current.add(t.id);
        if (completedTracks.current.size > 0) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: [t.color, "#fff"] });
        }
      }
      if (!done) completedTracks.current.delete(t.id);
    }
  }, [progress, statusOf]);

  return (
    <div className="mx-auto min-h-full max-w-4xl px-5 py-10">
      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Ascend
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Your DevOps / SRE learning roadmap · track what you've learned & flag what you need help with
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
            >
              Import
            </button>
            <button
              onClick={exportJson}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
            >
              Export
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white/80">Overall progress</span>
            <span className="text-white/50">
              {counts.done}/{TOTAL_ITEMS} · {overallPct}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400"
              animate={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setFilter((f) => (f === s ? "all" : s))}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors"
                style={{
                  borderColor: filter === s ? STATUS_META[s].color : "rgba(255,255,255,0.1)",
                  background: filter === s ? `${STATUS_META[s].color}1e` : "transparent",
                  color: filter === s ? STATUS_META[s].color : "rgba(255,255,255,0.6)",
                }}
              >
                <span>{STATUS_META[s].icon}</span>
                {STATUS_META[s].label}
                <span className="opacity-60">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {counts.help > 0 && (
          <p className="mt-3 text-center text-xs text-amber-300/80">
            🚩 You've flagged {counts.help} topic{counts.help > 1 ? "s" : ""} you need help with — tap the
            “Need help” filter to focus on them.
          </p>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics… (e.g. terraform, tracing, go)"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        />
      </motion.header>

      <div className="space-y-4">
        {ROADMAP.map((track, i) => (
          <Track
            key={track.id}
            index={i}
            track={track}
            statusOf={statusOf}
            noteOf={(id) => progress[id]?.note}
            onStatus={setStatus}
            onNote={setNote}
            filter={filter}
            query={query}
          />
        ))}
      </div>

      <footer className="mt-10 text-center text-xs text-white/30">
        Progress saves to this browser · use Export to back up or move it · built with React, Tailwind & Framer Motion
      </footer>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
      />
    </div>
  );
}
