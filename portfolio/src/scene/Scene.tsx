import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SPREAD, compressionFor, placementFor, projects, type Project } from "../content";
import { SCENE, type Resolved } from "../theme";
import { Pavilion } from "./Pavilion";

type Props = {
  selected: string | null;
  discovered: Set<string>;
  resolved: Resolved;
  reducedMotion: boolean;
  onSelect: (slug: string | null) => void;
};

// Near eye level: looking down at the constellation pushed it into the lower
// third of the frame and left dead space above.
const HOME = new THREE.Vector3(0, 0.7, 13.5);

/** A two-stop vertical gradient, drawn once into a tiny canvas. */
function gradientTexture(top: string, bottom: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Scene({ selected, discovered, resolved, reducedMotion, onSelect }: Props) {
  return (
    <Canvas
      // Capped DPR: past 2x the glass costs far more than it looks better,
      // and phones are where that bites.
      dpr={[1, 2]}
      camera={{ position: HOME.toArray(), fov: 42 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // The canvas is decorative; everything in it is also in the DOM list.
      aria-hidden="true"
      onPointerMissed={() => onSelect(null)}
    >
      <SceneBody
        selected={selected}
        discovered={discovered}
        resolved={resolved}
        reducedMotion={reducedMotion}
        onSelect={onSelect}
      />
    </Canvas>
  );
}

function SceneBody({ selected, discovered, resolved, reducedMotion, onSelect }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const palette = SCENE[resolved];
  const { scene, size } = useThree();
  const compression = compressionFor(size.width / Math.max(1, size.height));

  // A flat background gives transmission nothing to bend, so the glass reads as
  // plastic. A soft vertical gradient costs one 2×256 canvas and gives every
  // piece something to refract.
  useEffect(() => {
    const texture = gradientTexture(palette.top, palette.bottom);
    scene.background = texture;
    scene.fog = new THREE.Fog(palette.fog, 16, 34);
    return () => texture.dispose();
  }, [scene, palette.top, palette.bottom, palette.fog]);

  return (
    <>
      <ambientLight intensity={palette.ambient} />
      <directionalLight position={[5, 8, 6]} intensity={palette.key} />
      <directionalLight position={[-6, 3, -4]} intensity={palette.key * 0.4} color="#c8d4ff" />

      {/* A procedural environment. Transmission needs something to refract,
          and building it from lightformers keeps it local — no HDR download. */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={resolved === "light" ? 1.6 : 0.9} position={[0, 5, -6]} scale={[12, 6, 1]} />
        <Lightformer intensity={0.8} position={[-6, 2, 2]} scale={[6, 6, 1]} color="#ffd9c2" />
        <Lightformer intensity={0.7} position={[6, -1, 3]} scale={[6, 6, 1]} color="#c2d8ff" />
      </Environment>

      {projects.map((p: Project) => (
        <Pavilion
          key={p.slug}
          project={p}
          discovered={discovered.has(p.slug)}
          selected={selected === p.slug}
          dimmed={selected !== null && selected !== p.slug}
          reducedMotion={reducedMotion}
          compression={compression}
          onSelect={onSelect}
        />
      ))}

      <CameraRig
        selected={selected}
        controls={controls}
        reducedMotion={reducedMotion}
        compression={compression}
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={4}
        maxDistance={18}
        // Stop short of the poles so the scene never flips upside down.
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.62}
        autoRotate={!reducedMotion && selected === null}
        autoRotateSpeed={0.28}
      />
    </>
  );
}

/**
 * Eases the camera to whichever pavilion is selected, then hands control back
 * so you can look around. It stops steering the moment you touch the scene —
 * the camera should never fight the person driving it.
 */
function CameraRig({
  selected,
  controls,
  reducedMotion,
  compression,
}: {
  selected: string | null;
  controls: React.RefObject<OrbitControlsImpl>;
  reducedMotion: boolean;
  compression: number;
}) {
  const steering = useRef(false);
  const desiredPos = useRef(new THREE.Vector3().copy(HOME));
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));
  const { camera, size } = useThree();

  /**
   * How far back the overview has to sit to hold the whole constellation.
   * A fixed distance frames well on a wide monitor and clips the outer pieces
   * on a phone or a narrow pane, so derive it from the actual aspect ratio.
   */
  const homeDistance = useMemo(() => {
    const halfWidth = SPREAD * compression + 1.1; // widest centre, plus its radius
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const aspect = Math.max(0.35, size.width / Math.max(1, size.height));
    const forWidth = halfWidth / (Math.tan(vFov / 2) * aspect);
    const forDepth = 4.2; // deepest pavilion, so nothing sits behind the camera
    return Math.min(24, Math.max(10, forWidth + forDepth));
  }, [camera, size.width, size.height, compression]);

  useEffect(() => {
    if (selected) {
      const [x, y, z] = placementFor(selected, compression);
      // The panel sits bottom-right on a desktop and bottom-sheet on a phone,
      // so aim below the piece to push it up out of the panel's way — further
      // on narrow screens, where the sheet takes more of the view.
      const narrow = compression < 1;
      desiredTarget.current.set(x, y - (narrow ? 1.5 : 0.55), z);
      // Off to one side and well back, so the piece is framed, not filling it.
      desiredPos.current.set(x + (narrow ? 0 : 2.2), y + 1.0, z + 6.8);
    } else {
      desiredTarget.current.set(0, 0, 0);
      desiredPos.current.set(0, HOME.y, homeDistance);
    }
    steering.current = true;
  }, [selected, homeDistance, compression]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const release = () => (steering.current = false);
    c.addEventListener("start", release);
    return () => c.removeEventListener("start", release);
  }, [controls]);

  useFrame(({ camera }, delta) => {
    const c = controls.current;
    if (!c || !steering.current) return;

    if (reducedMotion) {
      camera.position.copy(desiredPos.current);
      c.target.copy(desiredTarget.current);
      steering.current = false;
    } else {
      const k = Math.min(1, delta * 2.4);
      camera.position.lerp(desiredPos.current, k);
      c.target.lerp(desiredTarget.current, k);
      if (camera.position.distanceTo(desiredPos.current) < 0.04) steering.current = false;
    }
    c.update();
  });

  return null;
}
