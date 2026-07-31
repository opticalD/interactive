import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "../content";
import { ProjectPanel } from "../components/ProjectPanel";
import type { Resolved } from "../theme";
import { CELL, COLS, MAZE, ROWS, cellCentre } from "./generate";
import { MazeScene } from "./MazeScene";
import { Minimap } from "./Minimap";
import { useControls } from "./usePlayer";

type Props = {
  resolved: Resolved;
  reducedMotion: boolean;
  found: Set<string>;
  onFind: (slug: string) => void;
  onAnnounce: (message: string) => void;
  onExit: () => void;
};

export function MazeMode({
  resolved,
  reducedMotion,
  found,
  onFind,
  onAnnounce,
  onExit,
}: Props) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const { look, read, touch, locked } = useControls(true, host);

  const [near, setNear] = useState<string | null>(null);
  const [pos, setPos] = useState(() => {
    const [x, z] = cellCentre(MAZE.start.cx, MAZE.start.cz);
    return { x, z };
  });
  const [seen, setSeen] = useState<Set<number>>(() => new Set([MAZE.start.cz * COLS + MAZE.start.cx]));
  const [yaw, setYaw] = useState(look.current.yaw);

  const nearProject = useMemo(
    () => projects.find((p) => p.slug === near) ?? null,
    [near]
  );

  const handleReach = useCallback(
    (slug: string | null) => {
      setNear(slug);
      if (!slug) return;
      const project = projects.find((p) => p.slug === slug);
      if (!project) return;
      if (!found.has(slug)) {
        onFind(slug);
        onAnnounce(`Found ${project.name}. ${found.size + 1} of ${projects.length}.`);
      }
    },
    [found, onFind, onAnnounce]
  );

  const handleMove = useCallback((x: number, z: number) => {
    setPos({ x, z });
    setYaw(look.current.yaw);
    const cx = Math.floor(x / CELL);
    const cz = Math.floor(z / CELL);
    if (cx < 0 || cz < 0 || cx >= COLS || cz >= ROWS) return;
    setSeen((prev) => {
      const key = cz * COLS + cx;
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, [look]);

  // Pointer lock is a nicety on top of the keyboard, so failures are silent.
  const requestLock = useCallback(() => {
    if (!host || document.pointerLockElement === host) return;
    void Promise.resolve(host.requestPointerLock()).catch(() => {});
  }, [host]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.pointerLockElement) document.exitPointerLock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const remaining = projects.length - found.size;

  // Drag anywhere the stick isn't to look around. Tracked by touch id so a
  // thumb on the stick and a thumb looking don't interfere.
  const lookTouch = useRef<{ id: number; x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (lookTouch.current) return;
    const t = e.changedTouches[0];
    lookTouch.current = { id: t.identifier, x: t.clientX, y: t.clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const tracked = lookTouch.current;
    if (!tracked) return;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== tracked.id) continue;
      look.current.yaw -= (t.clientX - tracked.x) * 0.006;
      look.current.pitch = Math.max(
        -0.9,
        Math.min(0.9, look.current.pitch - (t.clientY - tracked.y) * 0.006)
      );
      tracked.x = t.clientX;
      tracked.y = t.clientY;
      setYaw(look.current.yaw);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const tracked = lookTouch.current;
    if (!tracked) return;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === tracked.id) lookTouch.current = null;
    }
  };

  return (
    <div
      ref={setHost}
      className="fixed inset-0 touch-none"
      onClick={requestLock}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      role="application"
      aria-label="Maze: walk around to find the projects"
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 72, near: 0.05, far: 60 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        aria-hidden="true"
      >
        <MazeScene
          resolved={resolved}
          reducedMotion={reducedMotion}
          found={found}
          look={look}
          readInput={read}
          onReach={handleReach}
          onMove={handleMove}
        />
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="glass pointer-events-auto rounded-2xl px-3.5 py-2.5">
          <p className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>
            {found.size} of {projects.length} found
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
            {remaining === 0
              ? "You found everything. Nice."
              : `${remaining} still out there`}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="pointer-events-none">
            <Minimap
              seen={seen}
              found={found}
              x={pos.x}
              z={pos.z}
              yaw={yaw}
              resolved={resolved}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (document.pointerLockElement) document.exitPointerLock();
              onExit();
            }}
            className="glass pointer-events-auto rounded-full px-3.5 py-2 text-[12px] font-medium"
            style={{ color: "var(--ink)" }}
          >
            Leave maze
          </button>
        </div>
      </div>

      {/* Controls hint, until you start moving. */}
      <Hint visible={seen.size < 3} locked={locked} />

      {/* What you're standing in front of. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-24 sm:justify-end sm:px-6 sm:pb-8">
        <AnimatePresence mode="wait">
          {nearProject && (
            <ProjectPanel
              key={nearProject.slug}
              project={nearProject}
              index={projects.findIndex((p) => p.slug === nearProject.slug)}
              total={projects.length}
              reducedMotion={reducedMotion}
              onClose={() => setNear(null)}
              onStep={() => {}}
              hideStepper
            />
          )}
        </AnimatePresence>
      </div>

      <TouchSticks touch={touch} />
    </div>
  );
}

function Hint({
  visible,
  locked,
}: {
  visible: boolean;
  locked: React.MutableRefObject<boolean>;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center px-4"
        >
          <div className="glass max-w-xs rounded-2xl px-5 py-4 text-center">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Six things are hidden in here. Go and find them.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
              <strong>W A S D</strong> or arrow keys to walk · click to look with the mouse
              {locked.current ? "" : " · Esc to release it"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Touch controls: a stick on the left to walk, drag anywhere on the right to
 * look. Without these the maze is simply unplayable on a phone.
 */
function TouchSticks({ touch }: { touch: React.MutableRefObject<{ forward: number; strafe: number; turn: number }> }) {
  const padRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = r.width / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob({ x: dx, y: dy });
    touch.current.forward = -dy / max;
    touch.current.strafe = dx / max;
  };

  const release = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    touch.current.forward = 0;
    touch.current.strafe = 0;
  };

  return (
    <div
      ref={padRef}
      className="absolute bottom-6 left-5 h-28 w-28 rounded-full sm:hidden"
      style={{ background: "var(--glass)", border: "1px solid var(--hairline)" }}
      onTouchStart={(e) => {
        // Don't let the stick's thumb also be read as a look-drag.
        e.stopPropagation();
        active.current = e.changedTouches[0].identifier;
        update(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === active.current) update(t.clientX, t.clientY);
        }
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        release();
      }}
      onTouchCancel={release}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 rounded-full"
        style={{
          background: "var(--accent)",
          opacity: 0.65,
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
        }}
      />
    </div>
  );
}
