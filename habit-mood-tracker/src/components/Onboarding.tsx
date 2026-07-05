import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Step {
  emoji: string;
  title: string;
  body: string;
  target?: string; // data-tour value to spotlight; omit for a centered step
}

const STEPS: Step[] = [
  {
    emoji: "🌸",
    title: "Welcome",
    body: "A science-backed way to track your mood, habits and wellness. This quick tour points out each part and how to use it — replay it anytime from the “Tour” button.",
  },
  {
    emoji: "🧭",
    title: "Log how you feel",
    body: "Tap or drag on the pad — left↔right is pleasant vs unpleasant, up↕down is energized vs calm. Set the factor sliders (sleep, stress…), tag what's driving it, then hit “Log this moment.”",
    target: "checkin",
  },
  {
    emoji: "✅",
    title: "Your habits",
    body: "Tick off your daily habits. Tap “Customize” to add your own or change weekly targets — finishing them all pops a little confetti.",
    target: "habits",
  },
  {
    emoji: "🌿",
    title: "Supplements & skincare",
    body: "Add your routine with one tap, then check items off each day. Open any item to record dose, brand and timing. The rings fill as you go.",
    target: "wellness",
  },
  {
    emoji: "🤒",
    title: "Illness & medicine",
    body: "Feeling unwell? Log the illness, symptoms and the medicines you're taking — then mark yourself recovered later. It's private and encrypted.",
    target: "health",
  },
  {
    emoji: "🩸",
    title: "Cycle tracking (optional)",
    body: "Tap Enable to log your period, see your current phase, predict the next one — and reveal how your cycle affects your mood.",
    target: "cycle",
  },
  {
    emoji: "📈",
    title: "Your insights",
    body: "As you log, this fills with your mood map, trends, and “what lifts and lowers your mood” — plus a phase breakdown once you track your cycle. It sharpens over ~a week.",
    target: "analytics",
  },
  {
    emoji: "🚀",
    title: "You're all set!",
    body: "Log your first check-in now, and come back daily. Even a quick mood + habit tick is enough for patterns to appear.",
  },
];

export function Onboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const spotRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  // Scroll the current target into view when the step changes.
  useEffect(() => {
    if (step.target) {
      document
        .querySelector(`[data-tour="${step.target}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [i, step.target]);

  // Keep the spotlight glued to the target element every frame (tracks scrolling).
  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const spot = spotRef.current;
      if (!spot) return;
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (!el) {
        spot.style.opacity = "0";
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 8;
      spot.style.opacity = "1";
      spot.style.top = `${r.top - pad}px`;
      spot.style.left = `${r.left - pad}px`;
      spot.style.width = `${r.width + pad * 2}px`;
      spot.style.height = `${r.height + pad * 2}px`;
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [i, step.target]);

  const go = (d: number) => setI((v) => Math.max(0, Math.min(STEPS.length - 1, v + d)));

  const anchored = !!step.target;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Click blocker + dim for centered steps */}
      <div className={`absolute inset-0 ${anchored ? "" : "bg-black/75 backdrop-blur-sm"}`} />

      {/* Spotlight cutout (its huge box-shadow dims everything else) */}
      <div
        ref={spotRef}
        className="pointer-events-none absolute rounded-2xl"
        style={{
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          border: "2px solid rgba(255,255,255,0.4)",
          opacity: 0,
        }}
      />

      {/* Instruction card: bottom-center when spotlighting, centered otherwise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`absolute left-1/2 w-[min(440px,92vw)] -translate-x-1/2 rounded-2xl border border-white/12 bg-[#12121c] p-5 shadow-2xl ${
            anchored ? "bottom-8" : "top-1/2 -translate-y-1/2"
          }`}
        >
          <div className="mb-3 flex justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: idx === i ? 22 : 7,
                  background: idx === i ? "#a855f7" : "rgba(255,255,255,0.2)",
                }}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl">{step.emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-white/95">
                {i === 0 ? `Welcome, ${name}!` : step.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">{step.body}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button onClick={onDone} className="text-xs text-white/40 hover:text-white/70">
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <button
                  onClick={() => go(-1)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => (last ? onDone() : go(1))}
                className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                {last ? "Start logging →" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Per-user, per-browser flag so the tour shows once after account creation. */
export function onboardingKey(userId: string) {
  return `bloom.onboarded.v1.${userId}`;
}
