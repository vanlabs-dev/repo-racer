"use client";

import { motion } from "framer-motion";
import { useRaceStore } from "@/stores/raceStore";
import { useUIStore } from "@/stores/uiStore";

export default function RaceHUD() {
  const cars = useRaceStore((s) => s.cars);
  const raceTime = useRaceStore((s) => s.raceTime);
  const leaderboard = useRaceStore((s) => s.leaderboard);
  const isFinished = useRaceStore((s) => s.isFinished);
  const lapCount = useRaceStore((s) => s.lapCount);
  const focusedCar = useUIStore((s) => s.focusedCar);
  const setFocusedCar = useUIStore((s) => s.setFocusedCar);

  const formatTime = (t: number): string => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const leaderCar = cars.find((c) => c.subnetId === leaderboard[0]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      {/* Top bar */}
      <div
        className="flex items-center justify-between border-b px-5 py-2"
        style={{
          borderColor: "#2a2a35",
          background: "rgba(20, 20, 24, 0.88)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{
              color: "#8a8a96",
              fontFamily: "var(--font-display)",
            }}
          >
            Repo Racer
          </span>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: isFinished ? "#e8a430" : "#7ec85a" }}
          />
          <span
            className="text-[9px] uppercase tracking-wider"
            style={{ color: "#555564" }}
          >
            {isFinished ? "Finished" : "Live"}
          </span>
        </div>

        <div
          className="text-base tabular-nums"
          style={{
            color: "#e8a430",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          {formatTime(raceTime)}
        </div>

        <div
          className="text-[10px] tabular-nums"
          style={{ color: "#8a8a96" }}
        >
          LAP{" "}
          <span style={{ color: "#d4d4d8" }}>
            {leaderCar
              ? Math.min(leaderCar.currentLap + 1, lapCount)
              : 1}
          </span>
          <span style={{ color: "#555564" }}> / {lapCount}</span>
        </div>
      </div>

      {/* Finished banner */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-xl font-semibold uppercase tracking-[0.3em]"
          style={{
            color: "#e8a430",
            fontFamily: "var(--font-display)",
          }}
        >
          Race Complete
        </motion.div>
      )}

      {/* Standings — left side, clickable */}
      <div className="pointer-events-auto absolute left-3 top-14 w-56">
        <div
          className="border"
          style={{
            borderColor: "#2a2a35",
            background: "rgba(20, 20, 24, 0.9)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="border-b px-3 py-1.5"
            style={{ borderColor: "#2a2a35" }}
          >
            <span
              className="text-[9px] font-medium uppercase tracking-[0.15em]"
              style={{
                color: "#555564",
                fontFamily: "var(--font-display)",
              }}
            >
              Standings
            </span>
          </div>

          <div className="py-0.5">
            {leaderboard.map((subnetId, rank) => {
              const car = cars.find((c) => c.subnetId === subnetId);
              if (!car) return null;

              const isSelected = focusedCar === subnetId;

              return (
                <motion.button
                  key={subnetId}
                  layout
                  transition={{ duration: 0.25 }}
                  onClick={() =>
                    setFocusedCar(isSelected ? null : subnetId)
                  }
                  className="flex w-full items-center gap-2 px-3 py-[5px] text-left transition-colors"
                  style={{
                    background: isSelected
                      ? car.subnet.color + "15"
                      : "transparent",
                    borderLeft: isSelected
                      ? `2px solid ${car.subnet.color}`
                      : "2px solid transparent",
                  }}
                >
                  {/* Position */}
                  <span
                    className="w-4 text-[10px] tabular-nums"
                    style={{
                      color: rank === 0 ? "#e8a430" : "#555564",
                    }}
                  >
                    {rank + 1}
                  </span>

                  {/* Color swatch */}
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-sm"
                    style={{ background: car.subnet.color }}
                  />

                  {/* Subnet number */}
                  <span
                    className="w-6 text-[11px] tabular-nums"
                    style={{
                      color: isSelected ? "#d4d4d8" : "#8a8a96",
                    }}
                  >
                    {String(subnetId).padStart(2, "0")}
                  </span>

                  {/* Subnet name */}
                  <span
                    className="flex-1 truncate text-[10px]"
                    style={{ color: "#555564" }}
                  >
                    {car.subnet.name}
                  </span>

                  {/* Lap */}
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: "#555564" }}
                  >
                    L{Math.min(car.currentLap + 1, lapCount)}
                  </span>

                  {/* Pit indicator */}
                  {car.isPitting && (
                    <span
                      className="text-[8px] uppercase"
                      style={{ color: "#e8a430" }}
                    >
                      PIT
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
