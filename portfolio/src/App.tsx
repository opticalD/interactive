import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile, projects, projectCountWord } from "./content";
import { ProjectPanel } from "./components/ProjectPanel";
import { ProjectList } from "./components/ProjectList";

/**
 * three.js and drei are by far the heaviest thing here. Splitting them out
 * means the reading view — and anyone without WebGL — never downloads a
 * renderer they'll never use.
 */
const Scene = lazy(() => import("./scene/Scene").then((m) => ({ default: m.Scene })));
const MazeMode = lazy(() => import("./maze/MazeMode").then((m) => ({ default: m.MazeMode })));
import {
  applyTheme,
  loadThemeChoice,
  storeThemeChoice,
  useMetaThemeColor,
  useReducedMotion,
  useSystemTheme,
  type Resolved,
  type ThemeChoice,
} from "./theme";

type Mode = "explore" | "maze" | "read";

/** WebGL can be absent or blocked. Detect once, then never offer a broken view. */
function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function App() {
  const [choice, setChoice] = useState<ThemeChoice>(() => loadThemeChoice());
  const system = useSystemTheme();
  const reducedMotion = useReducedMotion();
  const resolved: Resolved = choice === "system" ? system : choice;

  const [supportsWebgl] = useState(webglAvailable);
  const [mode, setMode] = useState<Mode>(() => (webglAvailable() ? "explore" : "read"));
  const [selected, setSelected] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState("");

  const activeIndex = selected ? projects.findIndex((p) => p.slug === selected) : -1;
  const activeProject = activeIndex >= 0 ? projects[activeIndex] : null;
  const accent = activeProject?.accent ?? (resolved === "light" ? "#7c8cff" : "#8fa2ff");

  useMetaThemeColor(resolved);

  useEffect(() => {
    applyTheme(resolved, accent);
  }, [resolved, accent]);

  const select = useCallback((slug: string | null) => {
    setSelected(slug);
    if (!slug) return;
    setDiscovered((prev) => (prev.has(slug) ? prev : new Set(prev).add(slug)));
  }, []);

  // One live region carries every state change the scene expresses visually.
  useEffect(() => {
    if (!activeProject) return;
    const seen = discovered.size;
    setAnnouncement(
      `${activeProject.name}. ${activeProject.tagline}. ${seen} of ${projects.length} projects visited.`
    );
  }, [activeProject, discovered.size]);

  const step = useCallback(
    (delta: number) => {
      const from = activeIndex < 0 ? -1 : activeIndex;
      const next = (from + delta + projects.length) % projects.length;
      select(projects[next].slug);
    },
    [activeIndex, select]
  );

  // Arrow keys walk the constellation; Escape steps back out. The maze binds
  // the same keys to walking, so this only applies to the orbit view.
  useEffect(() => {
    if (mode !== "explore") return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing) return;

      if (e.key === "Escape") {
        setSelected(null);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, step]);

  const allFound = discovered.size === projects.length;

  return (
    <>
      <a href="#content" className="skip-link glass rounded-full px-4 py-2 text-[13px]">
        Skip to project list
      </a>

      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>

      {/* The maze brings its own HUD, including the way out. */}
      {mode !== "maze" && (
      <TopBar
        mode={mode}
        setMode={setMode}
        choice={choice}
        setChoice={(c) => {
          setChoice(c);
          storeThemeChoice(c);
        }}
        supportsWebgl={supportsWebgl}
      />
      )}

      {mode === "maze" ? (
        <main className="fixed inset-0">
          <Suspense fallback={<SceneLoading />}>
            <MazeMode
              resolved={resolved}
              reducedMotion={reducedMotion}
              found={discovered}
              onFind={(slug) =>
                setDiscovered((prev) => (prev.has(slug) ? prev : new Set(prev).add(slug)))
              }
              onAnnounce={setAnnouncement}
              onExit={() => setMode("explore")}
            />
          </Suspense>
        </main>
      ) : mode === "explore" ? (
        <main className="fixed inset-0">
          <Suspense fallback={<SceneLoading />}>
            <Scene
              selected={selected}
              discovered={discovered}
              resolved={resolved}
              reducedMotion={reducedMotion}
              onSelect={select}
            />
          </Suspense>

          <Intro visible={selected === null} reducedMotion={reducedMotion} />

          {/* Detail panel. Sits over the scene on glass so the subject stays
              visible behind it. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-28 sm:justify-end sm:px-6 sm:pb-24">
            <AnimatePresence mode="wait">
              {activeProject && (
                <ProjectPanel
                  key={activeProject.slug}
                  project={activeProject}
                  index={activeIndex}
                  total={projects.length}
                  reducedMotion={reducedMotion}
                  onClose={() => setSelected(null)}
                  onStep={step}
                />
              )}
            </AnimatePresence>
          </div>

          <Dock
            selected={selected}
            discovered={discovered}
            onSelect={select}
            allFound={allFound}
          />
        </main>
      ) : (
        <main id="content">
          <ProjectList
            discovered={discovered}
            onOpenInScene={
              supportsWebgl
                ? (slug) => {
                    setMode("explore");
                    select(slug);
                  }
                : undefined
            }
          />
        </main>
      )}
    </>
  );
}

/** Quiet placeholder while the renderer chunk arrives — no spinner theatre. */
function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <p className="text-[13px]" style={{ color: "var(--ink-faint)" }}>
        Preparing the view…
      </p>
    </div>
  );
}

function TopBar({
  mode,
  setMode,
  choice,
  setChoice,
  supportsWebgl,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  choice: ThemeChoice;
  setChoice: (c: ThemeChoice) => void;
  supportsWebgl: boolean;
}) {
  const cycle: Record<ThemeChoice, ThemeChoice> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  const label: Record<ThemeChoice, string> = {
    system: "Theme: follows your system",
    light: "Theme: light",
    dark: "Theme: dark",
  };
  const glyph: Record<ThemeChoice, string> = { system: "◐", light: "☀", dark: "☾" };

  return (
    <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-3 sm:p-4">
      <a
        href="#content"
        onClick={(e) => {
          if (mode === "explore") {
            e.preventDefault();
            setMode("read");
          }
        }}
        className="glass rounded-full px-3.5 py-2 text-[13px] font-medium"
        style={{ color: "var(--ink)" }}
      >
        {profile.name}
      </a>

      <div className="flex items-center gap-2">
        {supportsWebgl && (
          <div
            className="glass flex rounded-full p-0.5"
            role="group"
            aria-label="View mode"
          >
            {(["explore", "maze", "read"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={{
                  background: mode === m ? "var(--accent-wash)" : "transparent",
                  color: mode === m ? "var(--ink)" : "var(--ink-faint)",
                }}
              >
                {m === "explore" ? "Explore" : m === "maze" ? "Maze" : "Read"}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setChoice(cycle[choice])}
          aria-label={label[choice]}
          title={label[choice]}
          className="glass rounded-full px-3 py-2 text-[13px]"
          style={{ color: "var(--ink)" }}
        >
          <span aria-hidden>{glyph[choice]}</span>
        </button>
      </div>
    </div>
  );
}

function Intro({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 top-20 flex justify-center px-4 sm:top-24"
        >
          <div className="glass max-w-sm rounded-2xl px-5 py-4 text-center">
            <h1 className="font-display text-xl sm:text-2xl" style={{ color: "var(--ink)" }}>
              {projectCountWord} things I built
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              They're floating out there, frosted over. Pick one up to see what it is —
              it takes its colour back when you do.
            </p>
            <p className="mt-2 text-[11px]" style={{ color: "var(--ink-faint)" }}>
              Drag to look around · arrow keys to move between them
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The dock is both the scoreboard and the keyboard interface. Everything you
 * can do by clicking a floating object, you can do by tabbing to a chip.
 */
function Dock({
  selected,
  discovered,
  onSelect,
  allFound,
}: {
  selected: string | null;
  discovered: Set<string>;
  onSelect: (slug: string) => void;
  allFound: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const found = discovered.size;
  const pct = useMemo(() => (found / projects.length) * 100, [found]);

  // Keep the active chip in view when arrow keys move the selection.
  useEffect(() => {
    if (!selected || !ref.current) return;
    ref.current
      .querySelector(`[data-slug="${selected}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
      <div className="glass mx-auto max-w-3xl rounded-2xl px-3 py-2.5">
        <div className="mb-2 flex items-center gap-3 px-1">
          <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
            {found} of {projects.length} visited
          </span>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--hairline)" }}
            role="progressbar"
            aria-valuenow={found}
            aria-valuemin={0}
            aria-valuemax={projects.length}
            aria-label="Projects visited"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {allFound && (
            <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>
              All found
            </span>
          )}
        </div>

        <div
          ref={ref}
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          role="group"
          aria-label="Projects"
        >
          {projects.map((p) => {
            const isOn = selected === p.slug;
            const seen = discovered.has(p.slug);
            return (
              <button
                key={p.slug}
                data-slug={p.slug}
                type="button"
                onClick={() => onSelect(p.slug)}
                aria-pressed={isOn}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={{
                  background: isOn ? "var(--accent-wash)" : "transparent",
                  border: `1px solid ${isOn ? "var(--accent-edge)" : "var(--hairline)"}`,
                  color: isOn || seen ? "var(--ink)" : "var(--ink-faint)",
                }}
              >
                <span aria-hidden>{p.emoji}</span>
                {p.name}
                {seen && !isOn && (
                  <span aria-hidden style={{ color: p.accent }}>
                    ·
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
