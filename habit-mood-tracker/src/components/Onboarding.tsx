import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Step {
  emoji: string;
  title: string;
  body: string;
  tint: string;
}

const STEPS: Step[] = [
  {
    emoji: "🌸",
    title: "Welcome to Bloom",
    body: "A science-backed way to track your mood, habits and wellness — and discover what actually shapes how you feel. Here's a 30-second tour. You can replay it anytime from the “Tour” button.",
    tint: "#a855f7",
  },
  {
    emoji: "🧭",
    title: "The mood pad",
    body: "Instead of a simple 1–5, you place your mood on two axes. Left ↔ right is pleasant vs unpleasant (valence). Up ↕ down is energized vs calm (arousal). Tap or drag the dot to where you are right now.",
    tint: "#06b6d4",
  },
  {
    emoji: "📊",
    title: "Factors, tags & note",
    body: "Set sliders for things that might affect your mood — sleep, energy, stress and more (add your own too). Tag what's driving it, jot a note, then hit “Log this moment.” Each log is a check-in.",
    tint: "#22c55e",
  },
  {
    emoji: "✅",
    title: "Habits",
    body: "Tick off your daily habits — and fully customize them (name, emoji, weekly target). Finishing them all pops a little confetti, and your streak keeps you going.",
    tint: "#f59e0b",
  },
  {
    emoji: "🌿",
    title: "Supplements & skincare",
    body: "Track your daily routine with one-tap suggestions or your own items. Add details like dose, brand and when you take them, then check them off — the rings fill as you go.",
    tint: "#ec4899",
  },
  {
    emoji: "📈",
    title: "Your insights",
    body: "As you log, Bloom builds a mood map, trends, and “What lifts and lowers your mood” — plain-language patterns like “more sleep → better days.” They start as an “early hint” and become reliable the more you log.",
    tint: "#3b82f6",
  },
  {
    emoji: "🚀",
    title: "You're all set!",
    body: "Log your very first check-in now. Come back daily — even a quick mood + habit tick is enough. In about a week, your personal patterns start to appear. Tap the ℹ️ About button anytime to revisit any term.",
    tint: "#22d3ee",
  },
];

export function Onboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const go = (d: number) => {
    setDir(d);
    setI((v) => Math.max(0, Math.min(STEPS.length - 1, v + d)));
  };

  const title = i === 0 ? `Welcome, ${name}!` : step.title;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d16] p-8"
      >
        {/* glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${step.tint}55` }}
        />

        {/* progress dots */}
        <div className="relative mb-8 flex justify-center gap-1.5">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDir(idx > i ? 1 : -1);
                setI(idx);
              }}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 24 : 8,
                background: idx === i ? step.tint : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="relative min-h-[220px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={i}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-5xl"
                style={{ background: `${step.tint}1e` }}
              >
                {step.emoji}
              </motion.div>
              <h2 className="text-2xl font-bold text-white/95">{title}</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
                {step.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="relative mt-8 flex items-center justify-between">
          <button
            onClick={onDone}
            className="text-xs text-white/40 transition-colors hover:text-white/70"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                onClick={() => go(-1)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (last ? onDone() : go(1))}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
              style={{ background: step.tint }}
            >
              {last ? "Start logging →" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Per-user, per-browser flag so the tour shows once after account creation. */
export function onboardingKey(userId: string) {
  return `bloom.onboarded.v1.${userId}`;
}
