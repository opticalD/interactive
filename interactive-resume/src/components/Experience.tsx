import { motion } from "framer-motion";
import { experience } from "../content";
import { SectionLabel } from "./StoryChapters";

export function Experience() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <SectionLabel>Experience</SectionLabel>
      <div className="mt-12 space-y-10">
        {experience.map((job) => (
          <motion.div
            key={job.company + job.period}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8"
            style={{ boxShadow: `0 24px 70px -40px ${job.accent}` }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold text-white/90">{job.company}</h3>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: `${job.accent}22`, color: job.accent }}
              >
                {job.period}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/60">
              {job.title} · {job.location}
            </p>

            <ul className="mt-5 space-y-3">
              {job.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="flex gap-3 text-sm leading-relaxed text-white/70"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: job.accent }}
                  />
                  <span>{b}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
