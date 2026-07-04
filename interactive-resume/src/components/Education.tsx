import { motion } from "framer-motion";
import { achievements, certifications, education } from "../content";
import { SectionLabel } from "./StoryChapters";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export function Education() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <SectionLabel>Education & credentials</SectionLabel>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <motion.div
          {...fade}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
        >
          <div className="text-2xl">🎓</div>
          <h3 className="mt-3 text-lg font-semibold text-white/90">{education.degree}</h3>
          <p className="mt-1 text-sm text-white/60">{education.school}</p>
          <p className="mt-0.5 text-xs text-white/40">
            {education.period} · {education.location}
          </p>
        </motion.div>

        <motion.div
          {...fade}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
        >
          <div className="text-2xl">📜</div>
          <h3 className="mt-3 text-lg font-semibold text-white/90">Certifications</h3>
          <ul className="mt-3 space-y-2">
            {certifications.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-emerald-400">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...fade}
          transition={{ delay: 0.16 }}
          className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6 backdrop-blur md:col-span-2"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏆</div>
            <div>
              <h3 className="text-lg font-semibold text-white/90">Recognition</h3>
              {achievements.map((a) => (
                <p key={a} className="mt-1.5 text-sm leading-relaxed text-white/65">
                  {a}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
