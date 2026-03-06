"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Group, PointLight as PointLightType } from "three";

interface CarProps {
  color: string;
  netuid: number;
  isPitting: boolean;
  onClick?: () => void;
}

export default function Car({ color, netuid, isPitting, onClick }: CarProps) {
  const groupRef = useRef<Group>(null);
  const tailLightRef = useRef<PointLightType>(null);

  useFrame((state) => {
    if (tailLightRef.current) {
      // Subtle brake light pulse when pitting
      const intensity = isPitting
        ? 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.15
        : 0.1;
      tailLightRef.current.intensity = intensity;
    }
  });

  const wheelPositions = useMemo(
    () => [
      [-0.65, -0.2, 0.75] as const,
      [0.65, -0.2, 0.75] as const,
      [-0.65, -0.2, -0.65] as const,
      [0.65, -0.2, -0.65] as const,
    ],
    []
  );

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* Chassis */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.3, 0.35, 2.4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.5, -0.15]} castShadow>
        <boxGeometry args={[0.9, 0.3, 1.0]} />
        <meshStandardMaterial
          color="#1a1a22"
          roughness={0.8}
          metalness={0.15}
        />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.5, 0.36]}>
        <boxGeometry args={[0.85, 0.25, 0.05]} />
        <meshStandardMaterial
          color="#2a3a4a"
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Front wing */}
      <mesh position={[0, 0.05, 1.3]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.35]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.15, 1.15]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* Rear wing */}
      <mesh position={[0, 0.65, -1.1]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Rear wing endplates */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={`ep-${i}`} position={[x, 0.55, -1.1]} castShadow>
          <boxGeometry args={[0.08, 0.28, 0.25]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Rear wing pillars */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={`pil-${i}`} position={[x, 0.45, -1.0]} castShadow>
          <boxGeometry args={[0.06, 0.25, 0.06]} />
          <meshStandardMaterial
            color="#2a2a32"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Sidepods */}
      {[-0.72, 0.72].map((x, i) => (
        <mesh key={`pod-${i}`} position={[x, 0.18, -0.2]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.9]} />
          <meshStandardMaterial
            color="#2a2a32"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <group key={`w-${i}`} position={[pos[0], pos[1], pos[2]]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.2, 0.16, 0.35]} />
            <meshStandardMaterial
              color="#1a1a1a"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
          {/* Hub */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.22, 0.06, 0.15]} />
            <meshStandardMaterial
              color={color}
              roughness={0.6}
              metalness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Tail lights */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={`tail-${i}`} position={[x, 0.2, -1.22]}>
          <boxGeometry args={[0.2, 0.1, 0.04]} />
          <meshStandardMaterial
            color="#c84040"
            emissive="#c84040"
            emissiveIntensity={isPitting ? 1.2 : 0.4}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Tail light glow */}
      <pointLight
        ref={tailLightRef}
        position={[0, 0.2, -1.4]}
        color="#c84040"
        intensity={0.1}
        distance={3}
      />

      {/* Number plate — top */}
      <Text
        position={[0, 0.68, -0.15]}
        fontSize={0.22}
        color="#d4d4d8"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {netuid}
      </Text>

      {/* Side number — left */}
      <Text
        position={[-0.66, 0.28, 0.2]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.18}
        color="#d4d4d8"
        anchorX="center"
        anchorY="middle"
      >
        {String(netuid).padStart(2, "0")}
      </Text>

      {/* Side number — right */}
      <Text
        position={[0.66, 0.28, 0.2]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.18}
        color="#d4d4d8"
        anchorX="center"
        anchorY="middle"
      >
        {String(netuid).padStart(2, "0")}
      </Text>

    </group>
  );
}
