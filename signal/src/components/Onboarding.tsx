import { motion } from "framer-motion";
import { SOURCES, STARTER_IDS } from "../sources";

export function Onboarding({ onDismiss }: { onDismiss: () => void }) {
  const starters = SOURCES.filter((s) => STARTER_IDS.includes(s.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/8 to-amber-500/5 p-5"
    >
      <h2 className="font-display text-lg text-white/95">Start with three, not twelve.</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-white/55">
        Signal opens with the three sources that cover roughly 80% of what matters in
        infra and platform work. Everything else is in the rail on the left, switched
        off until you want it. Add slowly — a feed you skip is worse than a feed you
        never added.
      </p>

      <ul className="mt-3.5 grid gap-2 sm:grid-cols-3">
        {starters.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-white/8 bg-black/20 px-3 py-2.5"
          >
            <div className="flex items-center gap-2 text-[13px] font-medium text-white/85">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: s.hue }}
              />
              {s.name}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">{s.why}</p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 rounded-md border border-white/12 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/10"
      >
        Got it
      </button>
    </motion.div>
  );
}
