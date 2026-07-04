import { motion } from "framer-motion";
import { metrics } from "../content";
import { SectionLabel } from "./StoryChapters";

export function Metrics() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <SectionLabel>Impact by the numbers</SectionLabel>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 70, damping: 16 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur"
            style={{ boxShadow: `inset 0 -40px 60px -40px ${m.accent}66` }}
          >
            <div className="text-4xl font-bold tracking-tight" style={{ color: m.accent }}>
              {m.value}
            </div>
            <div className="mt-2 text-xs leading-relaxed text-white/55">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
