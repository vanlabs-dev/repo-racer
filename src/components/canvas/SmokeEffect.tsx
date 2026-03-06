"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial } from "three";

const PUFF_Y_OFFSETS = [0.6, 1.1, 1.7];
const SPEED = 1.8;

export default function SmokeEffect() {
  const puffRefs = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    puffRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = i * 1.1;
      const wave = Math.sin(t * SPEED + phase);
      const opacity = 0.175 + wave * 0.175;
      const scale = 0.9 + wave * 0.3;
      mesh.scale.setScalar(scale);
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = opacity;
    });
  });

  return (
    <group>
      {PUFF_Y_OFFSETS.map((y, i) => (
        <Billboard key={i} position={[0, y, 0]}>
          <mesh ref={(el) => { puffRefs.current[i] = el; }}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial
              color="#aaaaaa"
              transparent
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
