import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { projects, type Project } from "../content";
import { type Resolved } from "../theme";
import {
  CELL,
  COLS,
  E,
  MAZE,
  N,
  ROWS,
  S,
  W,
  WALL_H,
  WALL_T,
  cellCentre,
} from "./generate";
import { EYE, SPEED, SPRINT, TURN, clamp, resolve, type Look, type PlayerInput } from "./usePlayer";
import { ProjectShape } from "../scene/shapes";

/** How close you must get before a project reveals itself. */
export const REVEAL = 2.1;

/**
 * The maze needs its own palette. The constellation's values are tuned for
 * objects floating in open space; reused inside corridors they collapse to
 * near-black in dark mode, because enclosed surfaces catch far less of the
 * ambient than a lone object against a bright background does.
 */
const MAZE_PALETTE = {
  light: {
    wall: "#fbf8f3",
    floor: "#cfc7b9",
    fog: "#ece8e1",
    ambient: 1.0,
    hemi: 0.85,
    key: 1.0,
    exposure: 1.0,
  },
  dark: {
    wall: "#414a63",
    floor: "#1b2029",
    fog: "#151a24",
    ambient: 1.35,
    hemi: 0.7,
    key: 1.35,
    // ACES tone mapping crushes an enclosed dark scene to near-black no matter
    // how the surfaces are coloured. Lifting exposure is the honest fix;
    // brightening the paint just greys everything out.
    exposure: 2.3,
  },
} as const;

type Props = {
  resolved: Resolved;
  reducedMotion: boolean;
  found: Set<string>;
  look: React.MutableRefObject<Look>;
  readInput: () => PlayerInput;
  onReach: (slug: string | null) => void;
  onMove: (x: number, z: number) => void;
};

export function MazeScene({
  resolved,
  reducedMotion,
  found,
  look,
  readInput,
  onReach,
  onMove,
}: Props) {
  const palette = MAZE_PALETTE[resolved];
  const { scene, camera, gl } = useThree();

  const { width, height } = useThree((s) => s.size);

  useEffect(() => {
    gl.toneMappingExposure = palette.exposure;
  }, [gl, palette.exposure]);

  /**
   * Field of view is vertical, so a portrait phone turns 72° into roughly 38°
   * across — tunnel vision, in a game that's entirely about looking down
   * corridors. Widen it as the viewport narrows, but stop well before the
   * fish-eye distortion that a truly matching angle would need.
   */
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = width / Math.max(1, height);
    cam.fov = Math.min(96, Math.max(72, 72 / Math.min(1, Math.max(0.4, aspect))));
    cam.updateProjectionMatrix();
  }, [camera, width, height]);

  useEffect(() => {
    // Tighter fog than the constellation: not seeing the whole maze at once is
    // the point, and it hides the outer wall without needing a ceiling. Far
    // enough, though, that a corridor still recedes instead of ending in soup.
    scene.fog = new THREE.Fog(palette.fog, 5, 26);
    scene.background = new THREE.Color(palette.fog);
  }, [scene, palette.fog]);

  useEffect(() => {
    const [sx, sz] = cellCentre(MAZE.start.cx, MAZE.start.cz);
    camera.position.set(sx, EYE, sz);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={palette.ambient} />
      <hemisphereLight
        intensity={palette.hemi}
        color={resolved === "light" ? "#ffffff" : "#9db1d8"}
        groundColor={resolved === "light" ? "#d8d2c8" : "#12151d"}
      />
      <directionalLight position={[8, 14, 6]} intensity={palette.key} />

      {/* Without image-based light the corridors crush to near-black under the
          default tone mapping, and the glass has nothing to refract. Same
          procedural trick as the constellation — no HDR download. */}
      <Environment resolution={64} frames={1}>
        <Lightformer
          intensity={resolved === "light" ? 1.5 : 1.1}
          position={[0, 6, 0]}
          scale={[14, 14, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer intensity={0.6} position={[-6, 1, 4]} scale={[8, 8, 1]} color="#ffd9c2" />
        <Lightformer intensity={0.6} position={[6, 1, -4]} scale={[8, 8, 1]} color="#c2d8ff" />
      </Environment>

      <Floor color={palette.floor} />
      <Walls color={palette.wall} />

      {projects.map((p) => (
        <MazePavilion key={p.slug} project={p} found={found.has(p.slug)} reducedMotion={reducedMotion} />
      ))}

      <Walker
        look={look}
        readInput={readInput}
        reducedMotion={reducedMotion}
        onReach={onReach}
        onMove={onMove}
      />
    </>
  );
}

function Floor({ color }: { color: string }) {
  const w = COLS * CELL;
  const d = ROWS * CELL;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
      <planeGeometry args={[w, d]} />
      {/* Deliberately darker than the walls. With both near the fog colour the
          whole space flattens into a single sheet. */}
      <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
    </mesh>
  );
}

/**
 * Every wall segment in one InstancedMesh. A maze this size is ~240 segments;
 * as separate meshes that's 240 draw calls a frame, which a phone feels.
 */
function Walls({ color }: { color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const segments = useMemo(() => {
    const list: { x: number; z: number; horizontal: boolean }[] = [];
    for (let cz = 0; cz < ROWS; cz++) {
      for (let cx = 0; cx < COLS; cx++) {
        const walls = MAZE.cells[cz][cx].walls;
        const [x, z] = cellCentre(cx, cz);
        // Only the north and west walls of each cell, plus the outer edges —
        // otherwise every shared wall is built twice.
        if (walls & N) list.push({ x, z: z - CELL / 2, horizontal: true });
        if (walls & W) list.push({ x: x - CELL / 2, z, horizontal: false });
        if (cz === ROWS - 1 && walls & S) list.push({ x, z: z + CELL / 2, horizontal: true });
        if (cx === COLS - 1 && walls & E) list.push({ x: x + CELL / 2, z, horizontal: false });
      }
    }
    return list;
  }, []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    segments.forEach((s, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.horizontal ? 0 : Math.PI / 2);
      m.compose(new THREE.Vector3(s.x, WALL_H / 2, s.z), q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [segments]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, segments.length]} frustumCulled={false}>
      <boxGeometry args={[CELL + WALL_T, WALL_H, WALL_T]} />
      <meshStandardMaterial color={color} roughness={0.72} metalness={0} />
    </instancedMesh>
  );
}

/** The same glass language as the constellation, standing in an alcove. */
function MazePavilion({
  project,
  found,
  reducedMotion,
}: {
  project: Project;
  found: boolean;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const spot = MAZE.spots[project.slug];
  const [x, z] = cellCentre(spot.cx, spot.cz);

  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);
  const frosted = useMemo(() => new THREE.Color("#b9b9c6"), []);

  // One shared instance, as in the constellation — the shapes are several
  // meshes each, and they all have to change colour together.
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#b9b9c6"),
        emissive: new THREE.Color("#b9b9c6"),
        emissiveIntensity: 0.08,
        transmission: 0.9,
        thickness: 0.9,
        roughness: 0.16,
        metalness: 0,
        ior: 1.42,
        clearcoat: 0.7,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }, delta) => {
    if (!group.current) return;
    const k = Math.min(1, delta * 3.5);
    material.color.lerp(found ? accent : frosted, k);
    material.emissive.lerp(found ? accent : frosted, k);
    const target = found ? 0.5 : 0.08;
    material.emissiveIntensity += (target - material.emissiveIntensity) * k;

    // Turn to face whoever's looking. The shapes carry their meaning on one
    // face, and in a maze you arrive from whichever corridor you happened to
    // take — so the object comes round to you rather than the reverse.
    const want = Math.atan2(camera.position.x - x, camera.position.z - z);
    const current = group.current.rotation.y;
    let diff = want - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y = reducedMotion ? want : current + diff * Math.min(1, delta * 3);
  });

  return (
    <group position={[x, 1.05, z]}>
      {/* Slightly smaller here: the alcoves are tighter than open space. */}
      <group ref={group} scale={0.78}>
        <ProjectShape slug={project.slug} material={material} animate={!reducedMotion} />
      </group>

      {/* A pool of its own colour on the floor — the glow you catch down a
          corridor before you can see what's making it. */}
      <pointLight
        color={project.accent}
        intensity={found ? 3.2 : 0.9}
        distance={5.5}
        position={[0, 0.2, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color={project.accent} transparent opacity={found ? 0.3 : 0.12} />
      </mesh>
    </group>
  );
}

/** Moves the camera, resolves it against the walls, and reports what's near. */
function Walker({
  look,
  readInput,
  reducedMotion,
  onReach,
  onMove,
}: {
  look: React.MutableRefObject<Look>;
  readInput: () => PlayerInput;
  reducedMotion: boolean;
  onReach: (slug: string | null) => void;
  onMove: (x: number, z: number) => void;
}) {
  const near = useRef<string | null>(null);
  const bob = useRef(0);
  const reported = useRef(0);

  useFrame(({ camera }, delta) => {
    const input = readInput();
    const step = Math.min(delta, 0.05); // a backgrounded tab shouldn't teleport you

    look.current.yaw += input.turn * TURN * step;

    const sin = Math.sin(look.current.yaw);
    const cos = Math.cos(look.current.yaw);
    const speed = SPEED * (input.sprint ? SPRINT : 1);
    // -Z is forward in three.js, so forward maps to (-sin, -cos).
    const dx = (-sin * input.forward + cos * input.strafe) * speed * step;
    const dz = (-cos * input.forward - sin * input.strafe) * speed * step;

    const [nx, nz] = resolve(camera.position.x + dx, camera.position.z + dz);
    camera.position.x = nx;
    camera.position.z = nz;

    const moving = Math.abs(input.forward) + Math.abs(input.strafe) > 0.01;
    if (!reducedMotion && moving) {
      // Bob keeps pace with the legs, otherwise a sprint reads as gliding.
      bob.current += step * (input.sprint ? 14 : 9);
      camera.position.y = EYE + Math.sin(bob.current) * (input.sprint ? 0.055 : 0.035);
    } else {
      camera.position.y += (EYE - camera.position.y) * Math.min(1, step * 8);
    }

    camera.rotation.order = "YXZ";
    camera.rotation.y = look.current.yaw;
    camera.rotation.x = clamp(look.current.pitch, -0.9, 0.9);

    // Nearest project within reach, reported only on change.
    let closest: string | null = null;
    let best = REVEAL;
    for (const [slug, spot] of Object.entries(MAZE.spots)) {
      const [px, pz] = cellCentre(spot.cx, spot.cz);
      const d = Math.hypot(px - camera.position.x, pz - camera.position.z);
      if (d < best) {
        best = d;
        closest = slug;
      }
    }
    if (closest !== near.current) {
      near.current = closest;
      onReach(closest);
    }

    // Throttle position updates: the minimap doesn't need 60 a second.
    reported.current += step;
    if (reported.current > 0.1) {
      reported.current = 0;
      onMove(camera.position.x, camera.position.z);
    }
  });

  return null;
}
