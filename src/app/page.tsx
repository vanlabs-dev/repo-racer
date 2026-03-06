"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { useRaceStore } from "@/stores/raceStore";
import LoadingScreen from "@/components/ui/LoadingScreen";
import SubnetSelector from "@/components/ui/SubnetSelector";
import StartSequence from "@/components/ui/StartSequence";
import RaceHUD from "@/components/ui/RaceHUD";
import TelemetryOverlay from "@/components/ui/TelemetryOverlay";
import { useTrackEditorStore } from "@/stores/trackEditorStore";

// Dynamic import for 3D scene (no SSR)
const RaceScene = dynamic(
  () => import("@/components/canvas/RaceScene"),
  { ssr: false }
);

export default function Home() {
  const phase = useUIStore((s) => s.phase);
  const setPhase = useUIStore((s) => s.setPhase);
  const setSubnets = useUIStore((s) => s.setSubnets);
  const selectedSubnets = useUIStore((s) => s.selectedSubnets);
  const initRace = useRaceStore((s) => s.initRace);
  const startRace = useRaceStore((s) => s.startRace);
  const isFinished = useRaceStore((s) => s.isFinished);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch subnet data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/subnets");
        if (!res.ok) throw new Error("Failed to fetch subnets");
        const data = await res.json();
        setSubnets(data);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Failed to load subnet data:", err);
        setIsDataLoaded(true);
      }
    }
    fetchData();
  }, [setSubnets]);

  // Silently refresh subnet data (bypasses browser cache, still hits ISR)
  const refreshSubnetData = useCallback(async () => {
    try {
      const res = await fetch("/api/subnets", { cache: "no-cache" });
      if (!res.ok) return;
      const data = await res.json();
      setSubnets(data);
    } catch {
      // Silent failure — stale data persists
    }
  }, [setSubnets]);

  // Refresh data when returning to selection after a race
  useEffect(() => {
    if (phase === "finished") {
      refreshSubnetData();
    }
  }, [phase, refreshSubnetData]);

  // Transition to "finished" phase when race ends
  useEffect(() => {
    if (isFinished && phase === "racing") {
      setPhase("finished");
    }
  }, [isFinished, phase, setPhase]);

  const editorPoints = useTrackEditorStore((s) => s.points);

  const handleLoadingComplete = useCallback(() => {
    setPhase("selection");
  }, [setPhase]);

  const handleSelectionStart = useCallback(() => {
    initRace(selectedSubnets, editorPoints);
    setPhase("countdown");
  }, [initRace, selectedSubnets, editorPoints, setPhase]);

  const handleCountdownComplete = useCallback(() => {
    startRace();
    setPhase("racing");
  }, [startRace, setPhase]);

  const showRaceUI = phase === "racing" || phase === "finished";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1a1a1f]">
      {/* 3D Scene */}
      {phase !== "loading" && <RaceScene />}

      {/* UI Overlays */}
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <LoadingScreen
            key="loading"
            isDataLoaded={isDataLoaded}
            onComplete={handleLoadingComplete}
          />
        )}

        {phase === "selection" && (
          <SubnetSelector
            key="selection"
            onStart={handleSelectionStart}
          />
        )}

        {phase === "countdown" && (
          <StartSequence
            key="countdown"
            onComplete={handleCountdownComplete}
          />
        )}
      </AnimatePresence>

      {/* Racing UI */}
      {showRaceUI && (
        <>
          <RaceHUD />
          <TelemetryOverlay />
        </>
      )}
    </main>
  );
}
