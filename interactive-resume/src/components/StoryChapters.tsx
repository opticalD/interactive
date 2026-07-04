import { motion } from "framer-motion";
import { chapters } from "../content";

export function StoryChapters() {
  return (
    <section className="relative mx-auto max-w-4xl px-6 py-24">
      <SectionLabel>The journey</SectionLabel>

      {/* vertical spine */}
      <div className="absolute left-6 top-40 bottom-24 hidden w-px bg-gradient-to-b from-white/5 via-white/20 to-white/5 sm:left-1/2 sm:block" />

      <div className="mt-16 space-y-24">
        {chapters.map((c, i) => {
          const left = i % 2 === 0;
          return (
            <motion.div
              key={c.year}
              initial={{ opacity: 0, x: left ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 60, damping: 16 }}
              className={`relative sm:w-1/2 ${left ? "sm:pr-12" : "sm:ml-auto sm:pl-12"}`}
            >
              {/* node on the spine */}
              <span
                className={`absolute top-6 hidden h-4 w-4 -translate-y-1/2 rounded-full ring-4 ring-[#07070d] sm:block ${
                  left ? "sm:-right-2" : "sm:-left-2"
                }`}
                style={{ background: c.accent }}
              />
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
                style={{ boxShadow: `0 20px 60px -30px ${c.accent}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: `${c.accent}22`, color: c.accent }}
                  >
                    {c.year}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white/90">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-white/55">{c.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/40"
    >
      {children}
    </motion.h2>
  );
}
