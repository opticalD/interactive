import { useEffect, useMemo, useRef } from "react";
import { CELL, COLS, E, MAZE, N, ROWS, S, W, openingYaw } from "./generate";

export const EYE = 1.5;
const RADIUS = 0.42;
const SPEED = 4.5;
/** Held Shift, or a fully deflected thumb stick. Enough to make backtracking
 *  cheap without turning the corridors into a blur. */
const SPRINT = 1.85;
const TURN = 2.0; // radians/sec, for keyboard turning

export type Look = { yaw: number; pitch: number };

export type PlayerInput = {
  forward: number; // -1..1
  strafe: number; // -1..1
  turn: number; // -1..1, keyboard only
  sprint: boolean;
};

/**
 * Keyboard, pointer-lock mouse look, and a touch stick, funnelled into one
 * input object. Pointer lock is offered, never required: arrow keys alone can
 * turn and walk, so the maze is playable without a mouse capture the browser
 * may refuse or the visitor may dislike.
 */
export function useControls(enabled: boolean, canvas: HTMLElement | null) {
  const keys = useRef<Record<string, boolean>>({});
  const look = useRef<Look>({
    yaw: openingYaw(MAZE.start.cx, MAZE.start.cz),
    pitch: 0,
  });
  const touch = useRef<PlayerInput>({ forward: 0, strafe: 0, turn: 0, sprint: false });
  const locked = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      keys.current[e.code] = true;
      // The arrows and WASD drive the game, so stop them scrolling the page.
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
        ].includes(e.code)
      ) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    const blur = () => (keys.current = {});

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      keys.current = {};
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !canvas) return;

    const onMove = (e: MouseEvent) => {
      if (!locked.current) return;
      look.current.yaw -= e.movementX * 0.0022;
      look.current.pitch = clamp(look.current.pitch - e.movementY * 0.0022, -0.9, 0.9);
    };
    const onLockChange = () => {
      locked.current = document.pointerLockElement === canvas;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [enabled, canvas]);

  const read = useMemo(
    () => (): PlayerInput => {
      const k = keys.current;
      const forward =
        (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + touch.current.forward;
      const strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + touch.current.strafe;
      // Arrows turn when the mouse isn't captured; with pointer lock the mouse
      // is already looking, so they'd fight each other.
      const turn = locked.current
        ? touch.current.turn
        : (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0) + touch.current.turn;
      // On touch there's no Shift, so pushing the stick to its edge sprints.
      const stickHard = Math.hypot(touch.current.forward, touch.current.strafe) > 0.85;
      return {
        forward: clamp(forward, -1, 1),
        strafe: clamp(strafe, -1, 1),
        turn: clamp(turn, -1, 1),
        sprint: Boolean(k.ShiftLeft || k.ShiftRight) || stickHard,
      };
    },
    []
  );

  return { look, read, touch, locked };
}

/**
 * Slide along walls rather than stopping dead at them. Each axis is resolved
 * against the walls of the cell the player is standing in, so brushing a
 * corner glides instead of catching.
 */
export function resolve(x: number, z: number): [number, number] {
  const cx = clamp(Math.floor(x / CELL), 0, COLS - 1);
  const cz = clamp(Math.floor(z / CELL), 0, ROWS - 1);
  const walls = MAZE.cells[cz][cx].walls;

  const minX = cx * CELL;
  const minZ = cz * CELL;
  let lx = x - minX;
  let lz = z - minZ;

  if (walls & W && lx < RADIUS) lx = RADIUS;
  if (walls & E && lx > CELL - RADIUS) lx = CELL - RADIUS;
  if (walls & N && lz < RADIUS) lz = RADIUS;
  if (walls & S && lz > CELL - RADIUS) lz = CELL - RADIUS;

  // Openings are gaps in a wall, not gaps in the corner posts: keep clear of
  // the corners so you can't clip diagonally between two cells.
  if (lx < RADIUS && lz < RADIUS && (walls & W || walls & N)) {
    if (walls & W) lx = RADIUS;
    if (walls & N) lz = RADIUS;
  }

  return [minX + lx, minZ + lz];
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export { SPEED, SPRINT, TURN, RADIUS };
