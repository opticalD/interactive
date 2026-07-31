import { motion } from "framer-motion";

type Props = {
  active: boolean;
  remaining: number;
  total: number;
  queued: number;
  readThisSession: number;
  onStop: () => void;
};

/**
 * The ten-minute skim, made literal. A timer turns "keep up with tech" from an
 * open-ended obligation into a box with edges, which is the only version of it
 * that survives a working week.
 */
export function SkimBar({ active, remaining, total, queued, readThisSession, onStop }: Props) {
  const pct = total > 0 ? Math.max(0, remaining / total) : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const done = remaining <= 0;

  if (!active) return null;

  return (
    <motion.div
      // Mount animation only. An exit animation here has to be driven by
      // AnimatePresence, which leaves the faded-out bar in the DOM holding
      // layout space — an empty gap above the feed.
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 mb-4 overflow-hidden rounded-xl border border-sky-400/25 bg-[#0a1422]/95 backdrop-blur"
    >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="font-display text-2xl tabular-nums text-white/95">
          {done ? "Time" : `${minutes}:${String(seconds).padStart(2, "0")}`}
        </div>
        <div className="text-[12px] leading-snug text-white/55">
          {done ? (
            <>
              That's the ten minutes. You opened{" "}
              <strong className="text-white/85">{readThisSession}</strong>{" "}
              {readThisSession === 1 ? "item" : "items"} — the rest can wait.
            </>
          ) : (
            <>
              Skimming {queued} unread {queued === 1 ? "item" : "items"}. Open what
              catches your eye, skip the rest.
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onStop}
          className="ml-auto rounded-md border border-white/12 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/10"
        >
          {done ? "Close" : "End skim"}
        </button>
      </div>
      <div className="h-0.5 w-full bg-white/8">
        <motion.div
          className="h-full bg-sky-400/70"
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
