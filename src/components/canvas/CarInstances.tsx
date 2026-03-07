"use client";

import { useRef, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRaceStore } from "@/stores/raceStore";
import { useUIStore } from "@/stores/uiStore";
import { getCurvatureAt } from "@/lib/racingLine";
import { isCarStalled } from "@/lib/physics";
import Car from "./Car";
import type { Group, Mesh } from "three";
import { Vector3 } from "three";

const _up = new Vector3(0, 1, 0);
const _lateral = new Vector3();
const _lookTarget = new Vector3();
const _lateralAhead = new Vector3();

// Offset to place wheels flush on track surface
const GROUNDING_OFFSET = 0.3;

const RACING_LINE_WIDTH = 4.5;
const LATERAL_SMOOTH_RATE = 1.2;
const OVERTAKE_PROXIMITY = 0.015;
const OVERTAKE_OFFSET = 2.2;

export default function CarInstances() {
  const cars = useRaceStore((s) => s.cars);
  const curve = useRaceStore((s) => s.curve);
  const racingLine = useRaceStore((s) => s.racingLine);
  const isRunning = useRaceStore((s) => s.isRunning);
  const tick = useRaceStore((s) => s.tick);
  const focusedCar = useUIStore((s) => s.focusedCar);
  const setFocusedCar = useUIStore((s) => s.setFocusedCar);
  const carRefs = useRef<(Group | null)[]>([]);
  const markerRefs = useRef<(Mesh | null)[]>([]);
  const lateralOffsets = useRef<number[]>([]);

  const setCarRef = useCallback(
    (index: number) => (el: Group | null) => {
      carRefs.current[index] = el;
    },
    []
  );

  // Per-car handling norms (stable across frames)
  const handlingNorms = useMemo(() => {
    if (cars.length === 0) return [];
    const maxHandling = Math.max(
      ...cars.map((c) => Math.abs(c.subnet.handling)),
      1
    );
    return cars.map((c) => {
      const raw = Math.abs(c.subnet.handling);
      return Math.max(0, Math.min(1, raw / maxHandling));
    });
  }, [cars]);

  // Deterministic per-car lateral variation on straights
  const personalityOffsets = useMemo(() => {
    return cars.map((c) => {
      // Hash subnetId to stable offset in [-0.8, 0.8]
      const hash = ((c.subnetId * 7 + 3) % 11) / 11;
      return (hash - 0.5) * 1.6;
    });
  }, [cars]);

  // Starting grid stagger: 2-wide formation
  const gridOffsets = useMemo(() => {
    return cars.map((_, i) => (i % 2 === 0 ? 1.2 : -1.2));
  }, [cars]);

  useFrame((_, delta) => {
    if (!curve || !racingLine) return;

    if (isRunning) {
      tick(delta);
    }

    while (lateralOffsets.current.length < cars.length) {
      const i = lateralOffsets.current.length;
      lateralOffsets.current.push(gridOffsets[i] ?? 0);
    }

    const normalLerp = 1 - Math.exp(-delta * LATERAL_SMOOTH_RATE);
    const pitLerp = 1 - Math.exp(-delta * 0.8);

    cars.forEach((car, i) => {
      const group = carRefs.current[i];
      if (!group) return;

      const t = ((car.progress % 1) + 1) % 1;
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      // Lateral direction perpendicular to tangent
      _lateral.crossVectors(tangent, _up).normalize();

      // Racing line offset
      const curvature = getCurvatureAt(racingLine, t);
      const normalizedCurvature = curvature / racingLine.maxAbsCurvature;

      // Better handling = closer to ideal line (0.5-1.0 adherence)
      const handling = handlingNorms[i] ?? 0.5;
      const lineAdherence = 0.5 + handling * 0.5;

      const LOOK_AHEAD_NEAR = 0.03;
      const LOOK_AHEAD_FAR = 0.07;

      const tNear = ((t + LOOK_AHEAD_NEAR) % 1 + 1) % 1;
      const tFar = ((t + LOOK_AHEAD_FAR) % 1 + 1) % 1;

      const cNear = getCurvatureAt(racingLine, tNear) / racingLine.maxAbsCurvature;
      const cFar = getCurvatureAt(racingLine, tFar) / racingLine.maxAbsCurvature;

      // Far curvature: same sign = outside = correct approach positioning
      // Near curvature: opposite sign = inside = apex clipping
      let targetOffset = (cFar * 0.8 - cNear * 0.9) * RACING_LINE_WIDTH * lineAdherence;

      // Personality offset on straights (fades in corners)
      const lookAheadCurvature = Math.abs(cNear);
      const straightness = 1 - lookAheadCurvature;
      targetOffset +=
        (personalityOffsets[i] ?? 0) * straightness * straightness;

      // Overtaking
      cars.forEach((other, j) => {
        if (j === i) return;

        // Progress difference (wrapping)
        let progressDiff = other.progress - car.progress;
        if (other.currentLap > car.currentLap) progressDiff += 1;
        if (other.currentLap < car.currentLap) progressDiff -= 1;

        // Overtake if car ahead is within range and we're faster
        if (
          progressDiff > 0 &&
          progressDiff < OVERTAKE_PROXIMITY &&
          car.speed > other.speed * 1.02
        ) {
          const otherLateral = lateralOffsets.current[j] ?? 0;
          const passSide = otherLateral > 0 ? -1 : 1;
          targetOffset += passSide * OVERTAKE_OFFSET;
        }

        // Defensive: push apart when alongside
        if (Math.abs(progressDiff) < 0.008) {
          const otherLateral = lateralOffsets.current[j] ?? 0;
          const myLateral = lateralOffsets.current[i] ?? 0;
          const lateralGap = myLateral - otherLateral;

          if (Math.abs(lateralGap) < 1.5) {
            const pushDir = lateralGap >= 0 ? 1 : -1;
            targetOffset += pushDir * 0.8;
          }
        }
      });

      // Pitting cars pull toward pit lane
      if (car.isPitting) {
        targetOffset = -(RACING_LINE_WIDTH + 2.5);
      }

      // Clamp to track bounds
      const maxOffset = RACING_LINE_WIDTH + (car.isPitting ? 3.5 : 1.5);
      targetOffset = Math.max(-maxOffset, Math.min(maxOffset, targetOffset));

      // Smooth lateral movement (gentle lerp when pitting)
      const currentLateral = lateralOffsets.current[i];
      const lateralGapFromTarget = Math.abs(targetOffset - currentLateral);
      const usePitLerp = car.isPitting || lateralGapFromTarget > RACING_LINE_WIDTH;
      lateralOffsets.current[i] +=
        (targetOffset - currentLateral) * (usePitLerp ? pitLerp : normalLerp);

      const offset = lateralOffsets.current[i];

      // Position
      group.position.set(
        pos.x + _lateral.x * offset,
        pos.y + GROUNDING_OFFSET,
        pos.z + _lateral.z * offset
      );

      // Orientation
      const tAhead = ((t + 0.003) % 1 + 1) % 1;
      const posAhead = curve.getPointAt(tAhead);
      _lateralAhead.crossVectors(curve.getTangentAt(tAhead), _up).normalize();

      _lookTarget.set(
        posAhead.x + _lateralAhead.x * offset,
        posAhead.y + GROUNDING_OFFSET,
        posAhead.z + _lateralAhead.z * offset
      );
      group.lookAt(_lookTarget);

      // Body roll in corners
      const rollAngle = -normalizedCurvature * 0.05 * (0.7 + handling * 0.3);
      group.rotateZ(rollAngle);

      // Selection indicator (kept flat)
      const marker = markerRefs.current[i];
      if (marker) {
        marker.position.set(group.position.x, 5, group.position.z);
      }
    });
  });

  if (!curve) return null;

  return (
    <group>
      {cars.map((car, i) => (
        <group key={car.subnetId} ref={setCarRef(i)}>
          <Car
            color={car.subnet.color}
            netuid={car.subnetId}
            isPitting={car.isPitting}
            stalled={isCarStalled(car)}
            onClick={() =>
              setFocusedCar(
                focusedCar === car.subnetId ? null : car.subnetId
              )
            }
          />
        </group>
      ))}

      {/* Selection indicator (outside car groups to stay flat) */}
      {cars.map((car, i) =>
        focusedCar === car.subnetId ? (
          <mesh
            key={`sel-${car.subnetId}`}
            ref={(el) => { markerRefs.current[i] = el; }}
          >
            <octahedronGeometry args={[0.5]} />
            <meshBasicMaterial
              color={car.subnet.color}
              transparent
              opacity={0.7}
            />
          </mesh>
        ) : null
      )}
    </group>
  );
}
