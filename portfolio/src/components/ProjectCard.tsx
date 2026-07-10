import { motion } from "framer-motion";
import type { Project } from "../content";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const gradient = `linear-gradient(135deg, ${project.accent}, ${project.accent2})`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 2) * 0.08, type: "spring", stiffness: 70, damping: 18 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur transition-colors hover:border-white/20"
    >
      {/* top accent bar */}
      <div className="h-1 w-full" style={{ background: gradient }} />

      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${project.accent}1e` }}
            >
              {project.emoji}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white/95">{project.name}</h3>
              <p className="text-xs text-white/50">{project.tagline}</p>
            </div>
          </div>
          {project.kind === "ios" && (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-white/50">
              Native iOS
            </span>
          )}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/60">{project.description}</p>

        <ul className="mt-4 space-y-1.5">
          {project.highlights.map((h) => (
            <li key={h} className="flex gap-2 text-xs leading-relaxed text-white/55">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: project.accent }} />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <span key={t} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/50">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-black transition-transform hover:scale-[1.02]"
              style={{ background: gradient }}
            >
              Live demo ↗
            </a>
          )}
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            className={`rounded-lg border border-white/15 py-2 text-center text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white ${
              project.live ? "flex-1" : "w-full"
            }`}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </motion.article>
  );
}
