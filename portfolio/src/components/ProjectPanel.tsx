import { motion } from "framer-motion";
import type { Project } from "../content";

type Props = {
  project: Project;
  index: number;
  total: number;
  reducedMotion: boolean;
  onClose: () => void;
  onStep: (delta: number) => void;
  /** In the maze you walk between projects, so prev/next would be a lie. */
  hideStepper?: boolean;
};

export function ProjectPanel({
  project,
  index,
  total,
  reducedMotion,
  onClose,
  onStep,
  hideStepper = false,
}: Props) {
  return (
    <motion.aside
      key={project.slug}
      role="dialog"
      aria-label={`${project.name} — project details`}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      // Capped on phones so the pavilion you just selected stays visible above
      // the sheet rather than being buried by it.
      className="glass-strong pointer-events-auto max-h-[56vh] w-full max-w-md overflow-y-auto rounded-2xl p-5 sm:max-h-[74vh] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">
              {project.emoji}
            </span>
            <h2 className="font-display text-2xl" style={{ color: "var(--ink)" }}>
              {project.name}
            </h2>
          </div>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-soft)" }}>
            {project.tagline}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="shrink-0 rounded-full px-2 py-1 text-lg leading-none transition-colors hover:bg-[var(--accent-wash)]"
          style={{ color: "var(--ink-faint)" }}
        >
          ×
        </button>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {project.description}
      </p>

      <ul className="mt-3.5 space-y-1.5">
        {project.highlights.map((h) => (
          <li key={h} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
            {h}
          </li>
        ))}
      </ul>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Built with">
        {project.tags.map((t) => (
          <li
            key={t}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "var(--accent-wash)", color: "var(--ink-soft)" }}
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {project.live ? (
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:scale-[1.03]"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Open live demo
          </a>
        ) : (
          <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
            Native app — no live demo
          </span>
        )}
        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={{ border: "1px solid var(--accent-edge)", color: "var(--ink)" }}
        >
          Source
        </a>
      </div>

      {hideStepper ? null : (
      <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--hairline)" }}>
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="rounded-full px-3 py-1.5 text-[12px] transition-colors hover:bg-[var(--accent-wash)]"
          style={{ color: "var(--ink-soft)" }}
        >
          ← Previous
        </button>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
          {index + 1} of {total}
        </span>
        <button
          type="button"
          onClick={() => onStep(1)}
          className="rounded-full px-3 py-1.5 text-[12px] transition-colors hover:bg-[var(--accent-wash)]"
          style={{ color: "var(--ink-soft)" }}
        >
          Next →
        </button>
      </div>
      )}
    </motion.aside>
  );
}
