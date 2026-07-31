import { profile, projects } from "../content";

/**
 * The content-first view. This is not a fallback bolted on for screen readers
 * — it's the same information as the scene, laid out to be read, and it's a
 * mode you can choose. The 3D view is the alternative presentation, not the
 * canonical one.
 */
export function ProjectList({
  discovered,
  onOpenInScene,
}: {
  discovered: Set<string>;
  onOpenInScene?: (slug: string) => void;
}) {
  // Top padding clears the fixed bar; the name up there is the way back out.
  return (
    <div className="mx-auto max-w-3xl px-5 pb-14 pt-20 sm:px-6 sm:pt-24">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "var(--ink)" }}>
          {profile.name}
        </h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
          {profile.tagline}
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-faint)" }}>
          {profile.location} · {projects.length} projects
        </p>
      </header>

      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.slug} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span aria-hidden>{p.emoji}</span>
              <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
                {p.name}
              </h2>
              <span className="text-[13px]" style={{ color: "var(--ink-faint)" }}>
                {p.tagline}
              </span>
              {discovered.has(p.slug) && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "var(--accent-wash)", color: "var(--ink-soft)" }}
                >
                  visited
                </span>
              )}
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              {p.description}
            </p>

            <ul className="mt-2.5 space-y-1">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                    style={{ background: p.accent }}
                  />
                  {h}
                </li>
              ))}
            </ul>

            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${p.name} — built with`}>
              {p.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: "var(--accent-wash)", color: "var(--ink-soft)" }}
                >
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:scale-[1.03]"
                  style={{ background: p.accent, color: "#fff" }}
                >
                  Live demo
                </a>
              )}
              <a
                href={p.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-4 py-2 text-[13px] font-medium"
                style={{ border: "1px solid var(--hairline)", color: "var(--ink)" }}
              >
                Source
              </a>
              {onOpenInScene && (
                <button
                  type="button"
                  onClick={() => onOpenInScene(p.slug)}
                  className="rounded-full px-3 py-2 text-[12px] transition-colors hover:bg-[var(--accent-wash)]"
                  style={{ color: "var(--ink-faint)" }}
                >
                  Show in 3D
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <footer className="glass mt-8 rounded-2xl p-6 text-center">
        <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
          Want to build something together?
        </h2>
        <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-soft)" }}>
          Always happy to talk DevOps, side-projects, or anything in between.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full px-4 py-2 text-[13px] font-medium"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            {profile.email}
          </a>
          {profile.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-[13px]"
              style={{ border: "1px solid var(--hairline)", color: "var(--ink-soft)" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
