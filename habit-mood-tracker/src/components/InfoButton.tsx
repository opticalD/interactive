import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Term {
  term: string;
  emoji: string;
  body: string;
}

interface Group {
  title: string;
  color: string;
  terms: Term[];
}

const GLOSSARY: Group[] = [
  {
    title: "The mood model",
    color: "#06b6d4",
    terms: [
      {
        term: "Circumplex model of affect",
        emoji: "🧭",
        body: "A well-established psychology framework (Russell, 1980) that maps any emotion onto two axes instead of a single good–bad scale. Bloom uses it so your mood is captured with real nuance.",
      },
      {
        term: "Valence",
        emoji: "↔️",
        body: "How pleasant or unpleasant you feel — the horizontal axis. Left is unpleasant, right is pleasant. Ranges from −100 to +100.",
      },
      {
        term: "Arousal",
        emoji: "⚡",
        body: "How energized or calm you feel — the vertical axis. Up is energized/activated, down is calm/low-energy. Ranges from −100 to +100.",
      },
      {
        term: "Quadrants",
        emoji: "🔲",
        body: "The four corners combine the axes: Upbeat (pleasant + energized), Serene/Content (pleasant + calm), Tense/Stressed (unpleasant + energized), and Down/Flat (unpleasant + calm).",
      },
    ],
  },
  {
    title: "Logging your mood",
    color: "#a855f7",
    terms: [
      {
        term: "Check-in",
        emoji: "📍",
        body: "A single mood log — a point on the pad plus your factors, tags and an optional note. Log as often as you like; mood changes through the day, and more check-ins make your analytics sharper.",
      },
      {
        term: "Factors",
        emoji: "📊",
        body: "The things that might influence your mood — sleep, energy, stress, anxiety, social contact, and any you add yourself. You set each on a slider per check-in so Bloom can look for patterns.",
      },
      {
        term: "Tags",
        emoji: "🏷️",
        body: "Quick labels for what's driving a mood (work, family, money…). They help you spot recurring themes over time.",
      },
    ],
  },
  {
    title: "Your analytics",
    color: "#22c55e",
    terms: [
      {
        term: "Mood map",
        emoji: "🗺️",
        body: "A scatter plot of every check-in on the valence × arousal space. Clusters show where your emotional life tends to sit.",
      },
      {
        term: "Correlation (r)",
        emoji: "🔗",
        body: "A number from −1 to +1 measuring how strongly a factor moves with your mood. Positive means they rise together (e.g. more sleep → better mood); negative means one rises as the other falls (e.g. more stress → lower mood). Values near 0 mean little to no link. It shows association, not proof of cause.",
      },
      {
        term: "Valence heatmap",
        emoji: "🟩",
        body: "A calendar grid coloured by each day's average pleasantness — an at-a-glance view of good and rough stretches.",
      },
    ],
  },
  {
    title: "Habits",
    color: "#f59e0b",
    terms: [
      {
        term: "Habit target",
        emoji: "🎯",
        body: "How many days per week you're aiming to do a habit (e.g. 5×/wk). Fully customizable — add, edit or remove habits anytime.",
      },
      {
        term: "Streak",
        emoji: "🔥",
        body: "The number of consecutive days you've checked in. A gentle nudge to keep the habit of self-reflection going.",
      },
      {
        term: "Consistency",
        emoji: "📈",
        body: "How many of the last 30 days you completed each habit — progress over perfection.",
      },
    ],
  },
];

export function InfoButton({ label = "About" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
      >
        ℹ️ {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0d16] p-6 sm:p-8"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-2xl font-bold text-transparent">
                    About Bloom
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    A quick guide to the terms behind your mood & habit tracking.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-sm text-white/50 hover:bg-white/5 hover:text-white/80"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-6">
                {GLOSSARY.map((g) => (
                  <div key={g.title}>
                    <h3
                      className="mb-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: g.color }}
                    >
                      {g.title}
                    </h3>
                    <div className="space-y-2">
                      {g.terms.map((t) => (
                        <div
                          key={t.term}
                          className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
                        >
                          <div className="flex items-center gap-2">
                            <span>{t.emoji}</span>
                            <span className="text-sm font-semibold text-white/90">{t.term}</span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-white/60">{t.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/35">
                Bloom is a personal reflection tool, not a medical or diagnostic device. If you're
                struggling, please reach out to a qualified professional.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
