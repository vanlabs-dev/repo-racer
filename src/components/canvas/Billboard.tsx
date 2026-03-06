"use client";

import { Text } from "@react-three/drei";
import { ACCENT_AMBER, TEXT_PRIMARY, TRACK_BARRIER } from "@/lib/colors";
import type { CatmullRomCurve3 } from "three";
import { Vector3 } from "three";

interface BillboardProps {
  curve: CatmullRomCurve3;
}

const SIGN_POSITIONS = [0, 0.25, 0.5, 0.75];
const SIGN_CONTENT = [
  { line1: "REPO RACER", line2: "SUBNET TELEMETRY" },
  { line1: "IntoTAO", line2: "race.intotao.app" },
  { line1: "BITTENSOR", line2: "LIVE METRICS" },
  { line1: "IntoTAO", line2: "POWERED BY TAO" },
];

export default function Billboards({ curve }: BillboardProps) {
  const up = new Vector3(0, 1, 0);

  return (
    <group>
      {SIGN_POSITIONS.map((t, i) => {
        const pos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const lateral = new Vector3()
          .crossVectors(tangent, up)
          .normalize();
        const rotY = Math.atan2(tangent.x, tangent.z);

        // Offset to trackside
        const offset = 14;
        const side = i % 2 === 0 ? 1 : -1;
        const content = SIGN_CONTENT[i];

        return (
          <group
            key={`sign-${i}`}
            position={[
              pos.x + lateral.x * offset * side,
              0,
              pos.z + lateral.z * offset * side,
            ]}
          >
            {/* Sign backing */}
            <mesh
              position={[0, 5, 0]}
              rotation={[0, rotY + (side === 1 ? 0 : Math.PI), 0]}
              castShadow
            >
              <boxGeometry args={[6, 3, 0.15]} />
              <meshStandardMaterial
                color="#1a1a24"
                roughness={0.92}
                metalness={0.08}
              />
            </mesh>

            {/* Sign border */}
            <mesh
              position={[0, 5, 0]}
              rotation={[0, rotY + (side === 1 ? 0 : Math.PI), 0]}
            >
              <boxGeometry args={[6.15, 3.15, 0.02]} />
              <meshStandardMaterial
                color={ACCENT_AMBER}
                emissive={ACCENT_AMBER}
                emissiveIntensity={0.2}
                roughness={0.7}
                transparent
                opacity={0.3}
              />
            </mesh>

            {/* Support post */}
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[0.25, 5, 0.25]} />
              <meshStandardMaterial
                color={TRACK_BARRIER}
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* Main text */}
            <Text
              position={[0, 5.4, side === 1 ? 0.12 : -0.12]}
              rotation={[0, rotY + (side === 1 ? 0 : Math.PI), 0]}
              fontSize={0.55}
              color={ACCENT_AMBER}
              anchorX="center"
              anchorY="middle"
            >
              {content.line1}
            </Text>

            {/* Sub text */}
            <Text
              position={[0, 4.6, side === 1 ? 0.12 : -0.12]}
              rotation={[0, rotY + (side === 1 ? 0 : Math.PI), 0]}
              fontSize={0.28}
              color={TEXT_PRIMARY}
              anchorX="center"
              anchorY="middle"
            >
              {content.line2}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
