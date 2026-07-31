import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "../content";
import { PLACEMENT, placementFor } from "../content";

type Props = {
  project: Project;
  discovered: boolean;
  selected: boolean;
  dimmed: boolean;
  reducedMotion: boolean;
  compression: number;
  onSelect: (slug: string) => void;
};

/**
 * One project, as a piece of glass. Undiscovered pavilions are frosted and
 * colourless; visiting one lets its colour bloom in. That's the whole game
 * loop — the reward for exploring is the thing becoming itself.
 */
export function Pavilion({
  project,
  discovered,
  selected,
  dimmed,
  reducedMotion,
  compression,
  onSelect,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const place = PLACEMENT[project.slug];
  const position = useMemo(
    () => placementFor(project.slug, compression),
    [project.slug, compression]
  );
  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);
  const accent2 = useMemo(() => new THREE.Color(project.accent2), [project.accent2]);
  const frosted = useMemo(() => new THREE.Color("#c9c9d4"), []);

  useFrame((state, delta) => {
    if (!group.current || !mat.current) return;
    const k = Math.min(1, delta * 4); // frame-rate independent easing

    // Colour blooms in on discovery; hover and selection lift it slightly.
    const target = discovered ? accent : frosted;
    mat.current.color.lerp(target, k);
    mat.current.emissive.lerp(discovered ? accent2 : frosted, k);

    const emissiveTarget = selected ? 0.42 : hovered ? 0.26 : discovered ? 0.14 : 0.04;
    mat.current.emissiveIntensity += (emissiveTarget - mat.current.emissiveIntensity) * k;

    const opacityTarget = dimmed ? 0.32 : 1;
    mat.current.opacity += (opacityTarget - mat.current.opacity) * k;

    const scaleTarget = selected ? 1.18 : hovered ? 1.08 : 1;
    const s = group.current.scale.x + (scaleTarget - group.current.scale.x) * k;
    group.current.scale.setScalar(s);

    if (!reducedMotion) {
      // A slow turn, not a spin. Selected pieces turn a touch faster so the
      // eye can find them without anything jumping.
      group.current.rotation.y += delta * (selected ? 0.22 : 0.07);
    } else {
      group.current.rotation.y = 0.4;
    }

    void state;
  });

  // Soft glass: transmissive, thick, and rough enough to diffuse what's behind
  // it rather than acting as a clear window.
  const material = (
    <meshPhysicalMaterial
      ref={mat}
      color={frosted}
      emissive={frosted}
      emissiveIntensity={0.04}
      transmission={0.94}
      thickness={1.1}
      roughness={0.18}
      metalness={0}
      ior={1.42}
      clearcoat={0.7}
      clearcoatRoughness={0.28}
      transparent
      opacity={1}
    />
  );

  const body = (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <Form shape={place.shape}>{material}</Form>
    </group>
  );

  return (
    <group position={position}>
      {reducedMotion ? (
        body
      ) : (
        <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.5} floatingRange={[-0.12, 0.12]}>
          {body}
        </Float>
      )}

      {/* A pooled shadow under each piece, so they read as objects in a space
          rather than stickers on a background. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial
          color={discovered ? project.accent : "#9a9aa6"}
          transparent
          opacity={dimmed ? 0.04 : 0.12}
        />
      </mesh>
    </group>
  );
}

/**
 * A geometry needs a mesh to live in. RoundedBox already is one, so it takes
 * the material as a child; the primitive geometries get a mesh of their own.
 */
function Form({
  shape,
  children,
}: {
  shape: "prism" | "orb" | "slab" | "tower";
  children: React.ReactNode;
}) {
  switch (shape) {
    case "orb":
      return (
        <mesh>
          <sphereGeometry args={[0.72, 48, 48]} />
          {children}
        </mesh>
      );
    case "slab":
      return (
        <RoundedBox args={[1.5, 0.95, 0.28]} radius={0.1} smoothness={5}>
          {children}
        </RoundedBox>
      );
    case "tower":
      return (
        <RoundedBox args={[0.66, 1.5, 0.66]} radius={0.14} smoothness={5}>
          {children}
        </RoundedBox>
      );
    case "prism":
    default:
      return (
        <mesh>
          <octahedronGeometry args={[0.82, 0]} />
          {children}
        </mesh>
      );
  }
}
