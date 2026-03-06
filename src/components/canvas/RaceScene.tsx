"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { NoToneMapping, SRGBColorSpace } from "three";
import Track from "./Track";
import TrackSurface from "./TrackSurface";
import Environment from "./Environment";
import CarInstances from "./CarInstances";
import Billboards from "./Billboard";
import CameraRig from "./CameraRig";
import PostProcessingEffects from "./PostProcessing";
import { useRaceStore } from "@/stores/raceStore";
import { useTrackEditorStore } from "@/stores/trackEditorStore";
import { useUIStore } from "@/stores/uiStore";

export default function RaceScene() {
  const raceCurve = useRaceStore((s) => s.curve);
  const editorCurve = useTrackEditorStore((s) => s.curve);
  const phase = useUIStore((s) => s.phase);

  // Show editor track during selection phase
  const activeCurve = phase === "selection" ? (editorCurve ?? raceCurve) : raceCurve;

  return (
    <div className="fixed inset-0">
      <Canvas
        shadows
        flat
        camera={{ position: [0, 130, 60], fov: 65, near: 0.5, far: 800 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = NoToneMapping;
          gl.outputColorSpace = SRGBColorSpace;
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Environment />
          <TrackSurface />
          {activeCurve && (
            <>
              <Track curve={activeCurve} />
              <Billboards curve={activeCurve} />
            </>
          )}
          <CarInstances />
          <CameraRig />
          <PostProcessingEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}
