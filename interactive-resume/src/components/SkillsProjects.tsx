import { motion } from "framer-motion";
import { projects, skillGroups } from "../content";
import { SectionLabel } from "./StoryChapters";

export function Skills() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <SectionLabel>Toolbox</SectionLabel>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {skillGroups.map((g, i) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">{g.emoji}</span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {g.label}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
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
