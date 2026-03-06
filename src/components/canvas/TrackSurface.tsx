"use client";

import { GRASS_COLOR } from "@/lib/colors";

export default function TrackSurface() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial
        color={GRASS_COLOR}
        roughness={0.97}
        metalness={0.02}
      />
    </mesh>
  );
}
