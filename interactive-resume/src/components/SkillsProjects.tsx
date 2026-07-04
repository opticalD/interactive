import { motion } from "framer-motion";
import { projects, skills } from "../content";
import { SectionLabel } from "./StoryChapters";

export function Skills() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <SectionLabel>What I work with</SectionLabel>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {skills.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.08, y: -2 }}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75"
          >
            {s}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <SectionLabel>Things I've built</SectionLabel>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {projects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.href}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:border-white/25"
          >
            <h3 className="text-lg font-semibold text-white/90 group-hover:text-white">{p.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{p.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t} className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/50">
                  {t}
                </span>
              ))}
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
