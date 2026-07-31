import { projects } from "../content";

export const CELL = 3.4;
export const WALL_H = 2.6;
export const WALL_T = 0.26;
export const COLS = 7;
export const ROWS = 7;

/** Wall bits per cell. Shared walls are stored on both neighbours. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export type Cell = { walls: number };
export type Maze = {
  cols: number;
  rows: number;
  cells: Cell[][];
  /** Where each project sits, keyed by slug. */
  spots: Record<string, { cx: number; cz: number }>;
  start: { cx: number; cz: number };
};

/**
 * Deterministic PRNG. The maze is the same for every visitor and every run,
 * which makes it a designed space rather than a lottery — and means a layout
 * problem is reproducible instead of a one-off ghost.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260731;

export function buildMaze(): Maze {
  const rand = mulberry32(SEED);
  const cells: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ walls: N | E | S | W }))
  );

  // Depth-first carve — produces long corridors and proper dead ends, which is
  // what makes a maze feel like somewhere rather than a grid of rooms.
  const seen = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;

  while (stack.length) {
    const [cz, cx] = stack[stack.length - 1];
    const options: [number, number, number, number][] = [];
    if (cz > 0 && !seen[cz - 1][cx]) options.push([cz - 1, cx, N, S]);
    if (cx < COLS - 1 && !seen[cz][cx + 1]) options.push([cz, cx + 1, E, W]);
    if (cz < ROWS - 1 && !seen[cz + 1][cx]) options.push([cz + 1, cx, S, N]);
    if (cx > 0 && !seen[cz][cx - 1]) options.push([cz, cx - 1, W, E]);

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const [nz, nx, wall, opposite] = options[Math.floor(rand() * options.length)];
    cells[cz][cx].walls &= ~wall;
    cells[nz][nx].walls &= ~opposite;
    seen[nz][nx] = true;
    stack.push([nz, nx]);
  }

  const start = { cx: 0, cz: 0 };
  return { cols: COLS, rows: ROWS, cells, spots: placeProjects(cells, start), start };
}

/**
 * Projects go in dead ends — a cell with exactly one opening reads as a room
 * you arrive at, not a corridor you pass through.
 *
 * They are deliberately spread across the whole walk rather than all buried at
 * the far end: the first is a short stroll, the last is a proper expedition.
 * Hiding every one in the deepest corner turns a landing page into a chore.
 */
const DEPTHS = [0.12, 0.28, 0.44, 0.6, 0.78, 0.96];

function placeProjects(cells: Cell[][], start: { cx: number; cz: number }) {
  const distance = walkDistances(cells, start);
  const deadEnds: { cx: number; cz: number; d: number }[] = [];

  for (let cz = 0; cz < ROWS; cz++) {
    for (let cx = 0; cx < COLS; cx++) {
      const openings = [N, E, S, W].filter((w) => !(cells[cz][cx].walls & w)).length;
      if (openings === 1 && !(cx === start.cx && cz === start.cz)) {
        deadEnds.push({ cx, cz, d: distance[cz][cx] });
      }
    }
  }

  const maxDepth = deadEnds.reduce((m, c) => Math.max(m, c.d), 1);
  const taken = new Set<string>();
  const chosen: { cx: number; cz: number }[] = [];

  for (const fraction of DEPTHS) {
    const wanted = fraction * maxDepth;
    const candidate = deadEnds
      .filter((c) => !taken.has(`${c.cz}:${c.cx}`))
      .sort((a, b) => Math.abs(a.d - wanted) - Math.abs(b.d - wanted))[0];
    if (!candidate) break;
    taken.add(`${candidate.cz}:${candidate.cx}`);
    chosen.push({ cx: candidate.cx, cz: candidate.cz });
  }

  // Should the maze ever yield too few dead ends, fall back to any free cell
  // rather than dropping a project off the map.
  for (let cz = 0; cz < ROWS && chosen.length < projects.length; cz++) {
    for (let cx = 0; cx < COLS && chosen.length < projects.length; cx++) {
      if (taken.has(`${cz}:${cx}`) || (cx === start.cx && cz === start.cz)) continue;
      taken.add(`${cz}:${cx}`);
      chosen.push({ cx, cz });
    }
  }

  const spots: Record<string, { cx: number; cz: number }> = {};
  projects.forEach((p, i) => {
    spots[p.slug] = chosen[i];
  });
  return spots;
}

/** Breadth-first step count from the entrance, respecting walls. */
function walkDistances(cells: Cell[][], start: { cx: number; cz: number }) {
  const dist = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  const queue: [number, number][] = [[start.cz, start.cx]];
  dist[start.cz][start.cx] = 0;

  while (queue.length) {
    const [cz, cx] = queue.shift()!;
    const moves: [number, number, number][] = [
      [cz - 1, cx, N],
      [cz, cx + 1, E],
      [cz + 1, cx, S],
      [cz, cx - 1, W],
    ];
    for (const [nz, nx, wall] of moves) {
      if (nz < 0 || nz >= ROWS || nx < 0 || nx >= COLS) continue;
      if (cells[cz][cx].walls & wall) continue;
      if (dist[nz][nx] !== -1) continue;
      dist[nz][nx] = dist[cz][cx] + 1;
      queue.push([nz, nx]);
    }
  }
  return dist;
}

/** Centre of a cell in world space. */
export function cellCentre(cx: number, cz: number): [number, number] {
  return [(cx + 0.5) * CELL, (cz + 0.5) * CELL];
}

/**
 * Face down the corridor you can actually walk into. The entrance is a corner
 * cell, so an arbitrary starting angle points you straight at the join of two
 * walls — which reads as "broken" before you've touched a key.
 *
 * Forward is (-sin yaw, -cos yaw), so north is 0 and it runs anticlockwise.
 */
export function openingYaw(cx: number, cz: number): number {
  const walls = MAZE.cells[cz][cx].walls;
  if (!(walls & S)) return Math.PI;
  if (!(walls & E)) return -Math.PI / 2;
  if (!(walls & N)) return 0;
  if (!(walls & W)) return Math.PI / 2;
  return 0;
}

export const MAZE = buildMaze();
