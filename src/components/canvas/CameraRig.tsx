"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils, type PerspectiveCamera } from "three";
import type { CatmullRomCurve3 } from "three";
import { useRaceStore } from "@/stores/raceStore";
import { useTrackEditorStore } from "@/stores/trackEditorStore";

const _desired = new Vector3();
const _target = new Vector3();

const DRIFT_SPEED = 0.02;
const DRIFT_AMPLITUDE = 4;
const SMOOTH_TIME = 2.0;
const VIEWPORT_FILL = 0.69;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 200;
const FORWARD_TILT_RATIO = 0.45;
const BBOX_SAMPLES = 200;
const PANEL_OFFSET_X = 15;

function computeTrackBounds(curve: CatmullRomCurve3) {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  const pt = new Vector3();
  for (let i = 0; i <= BBOX_SAMPLES; i++) {
    curve.getPoint(i / BBOX_SAMPLES, pt);
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.z > maxZ) maxZ = pt.z;
  }
  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

export default function CameraRig() {
  const { camera } = useThree();
  const raceCurve = useRaceStore((s) => s.curve);
  const editorCurve = useTrackEditorStore((s) => s.curve);

  // Use editor curve until a race is initialized
  const activeCurve = raceCurve ?? editorCurve;

  const framing = useMemo(() => {
    if (!activeCurve) return null;
    const bounds = computeTrackBounds(activeCurve);
    const cam = camera as PerspectiveCamera;
    const fovRad = MathUtils.degToRad(cam.fov);
    const aspect = cam.aspect || 1;

    // Height to fit track in viewport
    const halfHeight = (bounds.depth / 2) / VIEWPORT_FILL;
    const halfWidth = (bounds.width / 2) / VIEWPORT_FILL;

    // Perspective: vertical governed by fov, horizontal by fov * aspect
    const heightForDepth = halfHeight / Math.tan(fovRad / 2);
    const heightForWidth = halfWidth / Math.tan((fovRad * aspect) / 2);

    const height = MathUtils.clamp(
      Math.max(heightForDepth, heightForWidth),
      MIN_HEIGHT,
      MAX_HEIGHT,
    );

    return {
      centerX: bounds.centerX,
      centerZ: bounds.centerZ,
      height,
      forwardOffset: height * FORWARD_TILT_RATIO,
    };
  }, [activeCurve, camera]);

  const smoothPos = useRef(new Vector3(0, 130, 60));
  const smoothLook = useRef(new Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const lerpFactor = 1 - Math.exp(-delta / SMOOTH_TIME);

    const cx = (framing?.centerX ?? 0) + PANEL_OFFSET_X;
    const cz = framing?.centerZ ?? 0;
    const h = framing?.height ?? 130;
    const fwd = framing?.forwardOffset ?? 60;

    // Subtle drift
    const driftX = Math.sin(t * DRIFT_SPEED) * DRIFT_AMPLITUDE;
    const driftZ = Math.cos(t * DRIFT_SPEED * 0.7) * DRIFT_AMPLITUDE * 0.6;

    _desired.set(cx + driftX, h, cz + fwd + driftZ);
    _target.set(cx + driftX * 0.1, 0, cz + driftZ * 0.1);

    smoothPos.current.lerp(_desired, lerpFactor);
    smoothLook.current.lerp(_target, lerpFactor);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
