"use client";

import { FOG_COLOR, SKY_COLOR } from "@/lib/colors";
import { FOG_NEAR, FOG_FAR, AMBIENT_INTENSITY } from "@/lib/constants";

export default function Environment() {
  return (
    <group>
      {/* Fog */}
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      {/* Background */}
      <color attach="background" args={[SKY_COLOR]} />

      {/* Ambient */}
      <ambientLight intensity={0.4} color="#c0c0d0" />

      {/* Primary directional light */}
      <directionalLight
        position={[15, 60, -5]}
        intensity={1.4}
        color="#e8dcc8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {/* Fill light */}
      <directionalLight
        position={[-30, 45, 20]}
        intensity={0.5}
        color="#8090a0"
      />

      {/* Accent light */}
      <pointLight
        position={[30, 2, -20]}
        intensity={0.25}
        color="#e8a430"
        distance={50}
      />

      {/* Track downlight */}
      <pointLight
        position={[0, 35, 0]}
        intensity={0.3}
        color="#d0d0e0"
        distance={100}
      />

      {/* Overhead lighting rigs */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 70;
        return (
          <group key={`rig-${i}`}>
            {/* Support */}
            <mesh
              position={[
                Math.cos(angle) * dist,
                20,
                Math.sin(angle) * dist,
              ]}
            >
              <boxGeometry args={[0.4, 40, 0.4]} />
              <meshStandardMaterial
                color="#222230"
                roughness={0.95}
                metalness={0.1}
              />
            </mesh>
            {/* Truss */}
            <mesh
              position={[
                Math.cos(angle) * (dist - 8),
                39,
                Math.sin(angle) * (dist - 8),
              ]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.3, 0.3, 16]} />
              <meshStandardMaterial
                color="#222230"
                roughness={0.95}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Ceiling plane */}
      <mesh position={[0, 50, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#161620"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
