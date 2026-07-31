import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "../content";
import { placementFor } from "../content";
import { ProjectShape } from "./shapes";

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
  const [hovered, setHovered] = useState(false);

  /**
   * One material instance shared by every mesh in the shape, created
   * imperatively rather than as JSX. A shape is now several meshes, and a
   * single <meshPhysicalMaterial> element can only attach to one of them —
   * so the colour animation would drive just a petal instead of the flower.
   */
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c9c9d4"),
        emissive: new THREE.Color("#c9c9d4"),
        emissiveIntensity: 0.04,
        transmission: 0.94,
        thickness: 1.1,
        roughness: 0.18,
        metalness: 0,
        ior: 1.42,
        clearcoat: 0.7,
        clearcoatRoughness: 0.28,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  const position = useMemo(
    () => placementFor(project.slug, compression),
    [project.slug, compression]
  );
  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);
  const accent2 = useMemo(() => new THREE.Color(project.accent2), [project.accent2]);
  const frosted = useMemo(() => new THREE.Color("#c9c9d4"), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const k = Math.min(1, delta * 4); // frame-rate independent easing

    // Colour blooms in on discovery; hover and selection lift it slightly.
    const target = discovered ? accent : frosted;
    material.color.lerp(target, k);
    material.emissive.lerp(discovered ? accent2 : frosted, k);

    const emissiveTarget = selected ? 0.42 : hovered ? 0.26 : discovered ? 0.14 : 0.04;
    material.emissiveIntensity += (emissiveTarget - material.emissiveIntensity) * k;

    const opacityTarget = dimmed ? 0.32 : 1;
    material.opacity += (opacityTarget - material.opacity) * k;

    const scaleTarget = selected ? 1.18 : hovered ? 1.08 : 1;
    const s = group.current.scale.x + (scaleTarget - group.current.scale.x) * k;
    group.current.scale.setScalar(s);

    // No spin. The shapes now mean something, and most of that meaning is on
    // one face — a flower turned edge-on is three blobs. Life comes from the
    // Float bob and the camera's own slow orbit instead.
    void state;
  });

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
      <ProjectShape slug={project.slug} material={material} animate={!reducedMotion} />
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
