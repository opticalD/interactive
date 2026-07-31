import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Each project's form says what the project is. A sphere and an octahedron
 * carry no meaning; a flower, a phone, an equaliser, a book, a staircase and a
 * broadcast do. They're built from primitives sharing one material, so the
 * frosted-to-colour reveal still animates them as a single object.
 *
 * Several of these are essentially flat — a flower, an open book, a set of
 * signal arcs. They're all authored facing +Z, and whatever mounts them is
 * responsible for keeping that face toward the viewer. Spin one on its Y axis
 * and for half the turn a flower is three blobs seen edge-on.
 */
export function ProjectShape({
  slug,
  material,
  animate,
}: {
  slug: string;
  material: THREE.Material;
  animate: boolean;
}) {
  switch (slug) {
    case "bloom":
      return <Flower material={material} />;
    case "bloom-ios":
      return <Phone material={material} />;
    case "pulse":
      return <Equaliser material={material} animate={animate} />;
    case "my-story":
      return <Book material={material} />;
    case "ascend":
      return <Staircase material={material} />;
    case "signal":
      return <Broadcast material={material} animate={animate} />;
    default:
      return (
        <mesh material={material}>
          <icosahedronGeometry args={[0.6, 0]} />
        </mesh>
      );
  }
}

/** Bloom — a flower opening. Eight petals around a seed, facing the viewer. */
function Flower({ material }: { material: THREE.Material }) {
  const petals = useMemo(
    () => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2),
    []
  );
  return (
    <group rotation={[-0.22, 0, 0]}>
      {petals.map((angle, i) => (
        <group key={i} rotation={[0, 0, angle]}>
          {/* Long axis pointing outward, squashed front-to-back so it reads as
              a petal rather than a bean. */}
          <mesh material={material} position={[0, 0.4, 0]} scale={[0.15, 0.33, 0.07]}>
            <sphereGeometry args={[1, 18, 14]} />
          </mesh>
        </group>
      ))}
      <mesh material={material} position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.17, 20, 16]} />
      </mesh>
    </group>
  );
}

/** Bloom for iOS — the device itself, screen toward you. */
function Phone({ material }: { material: THREE.Material }) {
  return (
    <group rotation={[0, 0, 0.07]}>
      <RoundedBox args={[0.66, 1.3, 0.11]} radius={0.1} smoothness={5} material={material} />
      {/* The notch: small, but it's what makes the slab read as a phone. */}
      <mesh material={material} position={[0, 0.56, 0.07]}>
        <boxGeometry args={[0.22, 0.055, 0.035]} />
      </mesh>
      {/* Home indicator. */}
      <mesh material={material} position={[0, -0.56, 0.07]}>
        <boxGeometry args={[0.26, 0.03, 0.03]} />
      </mesh>
    </group>
  );
}

/**
 * Pulse — the radial spectrum the app actually draws. Radially symmetric, so
 * unlike the flat shapes this one reads from any angle.
 */
function Equaliser({ material, animate }: { material: THREE.Material; animate: boolean }) {
  const bars = useRef<THREE.Group>(null);
  const count = 16;
  const seeds = useMemo(
    () => Array.from({ length: count }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7))),
    []
  );

  useFrame((state) => {
    if (!animate || !bars.current) return;
    const t = state.clock.elapsedTime;
    bars.current.children.forEach((bar, i) => {
      // A slow travelling wave — it reads as sound, not as a loading spinner.
      const h = 0.3 + 0.55 * Math.abs(Math.sin(t * 1.5 + i * 0.5)) * seeds[i];
      bar.scale.y = h / 0.6;
      bar.position.y = h / 2;
    });
  });

  return (
    <group position={[0, -0.25, 0]}>
      <group ref={bars}>
        {seeds.map((s, i) => {
          const angle = (i / count) * Math.PI * 2;
          const h = 0.6 * s;
          return (
            <mesh
              key={i}
              material={material}
              position={[Math.cos(angle) * 0.46, h / 2, Math.sin(angle) * 0.46]}
              scale={[1, h / 0.6, 1]}
            >
              <boxGeometry args={[0.11, 0.6, 0.11]} />
            </mesh>
          );
        })}
      </group>
      <mesh material={material} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.055, 12, 30]} />
      </mesh>
    </group>
  );
}

/**
 * My Story — an open book, propped up to face you. Laid flat it opens toward
 * the sky, and from a near-level camera you only ever see its underside, which
 * reads as folded paper rather than a book.
 */
function Book({ material }: { material: THREE.Material }) {
  return (
    <group rotation={[-1.22, 0, 0]}>
      {[-1, 1].map((side) => (
        // A wide opening angle: at a shallow one the two covers read as a
        // single flat plane from almost every direction.
        <group key={side} rotation={[0, 0, side * 0.55]}>
          <mesh material={material} position={[side * 0.42, 0.02, 0]}>
            <boxGeometry args={[0.8, 0.07, 1.0]} />
          </mesh>
          <mesh material={material} position={[side * 0.4, 0.08, 0]}>
            <boxGeometry args={[0.7, 0.035, 0.9]} />
          </mesh>
          <mesh material={material} position={[side * 0.38, 0.125, 0]}>
            <boxGeometry args={[0.6, 0.03, 0.82]} />
          </mesh>
        </group>
      ))}
      <mesh material={material} position={[0, -0.06, 0]}>
        <boxGeometry args={[0.1, 0.12, 1.02]} />
      </mesh>
    </group>
  );
}

/** Ascend — steps climbing left to right, so the rise reads from the front. */
function Staircase({ material }: { material: THREE.Material }) {
  const steps = 5;
  return (
    <group position={[0, -0.42, 0]}>
      {Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        const h = 0.19 * (i + 1);
        return (
          <mesh
            key={i}
            material={material}
            // Each step is a column up from the floor, so it reads as a solid
            // staircase rather than a row of floating cubes.
            position={[-0.44 + t * 0.88, h / 2, 0]}
            scale={[1, h / 0.19, 1]}
          >
            <boxGeometry args={[0.22, 0.19, 0.42]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Signal — arcs leaving a source, facing the viewer. */
function Broadcast({ material, animate }: { material: THREE.Material; animate: boolean }) {
  const arcs = useRef<THREE.Group>(null);
  const rings = [0.34, 0.55, 0.78];

  useFrame((state) => {
    if (!animate || !arcs.current) return;
    const t = state.clock.elapsedTime;
    arcs.current.children.forEach((arc, i) => {
      // Each arc breathes a beat after the one inside it — a signal leaving,
      // rather than three static hoops.
      const m = arc as THREE.Mesh;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 - i * 0.9);
      (m.material as THREE.Material).opacity = 1;
      m.scale.setScalar(0.94 + pulse * 0.1);
    });
  });

  return (
    <group rotation={[0, 0, 0]}>
      <mesh material={material} position={[0, -0.34, 0]}>
        <sphereGeometry args={[0.16, 18, 14]} />
      </mesh>
      <group ref={arcs} position={[0, -0.34, 0]}>
        {rings.map((r, i) => (
          <mesh
            key={i}
            material={material}
            // Half-arcs opening upward: a broadcast, not a set of rings.
            rotation={[0, 0, Math.PI * 0.02]}
          >
            <torusGeometry args={[r, 0.05 - i * 0.008, 10, 28, Math.PI * 0.92]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
