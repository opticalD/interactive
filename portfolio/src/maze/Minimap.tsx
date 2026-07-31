import { useEffect, useRef } from "react";
import { projects } from "../content";
import { BASE, type Resolved } from "../theme";
import { CELL, COLS, E, MAZE, N, ROWS, S, W } from "./generate";

type Props = {
  seen: Set<number>;
  found: Set<string>;
  x: number;
  z: number;
  yaw: number;
  resolved: Resolved;
};

const SIZE = 128;

/**
 * A map that fills in as you walk it. Without one a maze is just repetition;
 * with one, backtracking becomes a decision instead of a chore. It only ever
 * draws corridors you've actually stood in, so it guides without spoiling.
 */
export function Minimap({ seen, found, x, z, yaw, resolved }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const s = SIZE / Math.max(COLS, ROWS);
    const ink = resolved === "light" ? "26,26,31" : "242,243,247";

    for (let cz = 0; cz < ROWS; cz++) {
      for (let cx = 0; cx < COLS; cx++) {
        if (!seen.has(cz * COLS + cx)) continue;
        const px = cx * s;
        const pz = cz * s;

        ctx.fillStyle = `rgba(${ink},0.09)`;
        ctx.fillRect(px, pz, s, s);

        ctx.strokeStyle = `rgba(${ink},0.42)`;
        ctx.lineWidth = 1.25;
        const walls = MAZE.cells[cz][cx].walls;
        ctx.beginPath();
        if (walls & N) {
          ctx.moveTo(px, pz);
          ctx.lineTo(px + s, pz);
        }
        if (walls & S) {
          ctx.moveTo(px, pz + s);
          ctx.lineTo(px + s, pz + s);
        }
        if (walls & W) {
          ctx.moveTo(px, pz);
          ctx.lineTo(px, pz + s);
        }
        if (walls & E) {
          ctx.moveTo(px + s, pz);
          ctx.lineTo(px + s, pz + s);
        }
        ctx.stroke();
      }
    }

    // Found projects stay pinned in their own colour.
    for (const p of projects) {
      if (!found.has(p.slug)) continue;
      const spot = MAZE.spots[p.slug];
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc((spot.cx + 0.5) * s, (spot.cz + 0.5) * s, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // The player, as a wedge pointing where they're facing.
    const px = (x / CELL) * s;
    const pz = (z / CELL) * s;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-yaw);
    ctx.fillStyle = resolved === "light" ? "#1a1a1f" : "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(s * 0.2, s * 0.22);
    ctx.lineTo(-s * 0.2, s * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [seen, found, x, z, yaw, resolved]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      aria-hidden="true"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: 14,
        background: BASE[resolved].glass,
        border: `1px solid ${BASE[resolved].hairline}`,
      }}
    />
  );
}
