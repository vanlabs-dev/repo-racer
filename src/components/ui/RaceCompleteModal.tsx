"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { CarState } from "@/types";

interface Props {
  finishOrder: number[];
  cars: CarState[];
  raceTime: number;
  onRaceAgain: () => void;
  onChangeGrid: () => void;
}

const MEDAL_COLORS = ["#e8a430", "#8a8a96", "#cd7f32"] as const;
const PODIUM_HEIGHTS = [48, 32, 20] as const;
// Display order: P2 (left), P1 (center), P3 (right)
const PODIUM_ORDER = [1, 0, 2] as const;

const METRIC_LABELS: Record<string, string> = {
  topSpeed: "30d TAO flow",
  handling: "7d TAO flow",
  acceleration: "1d TAO flow",
};

function formatTaoValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString()}`;
  if (abs >= 1) return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatTime(t: number): string {
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

function getTopStat(subnet: CarState["subnet"]): {
  key: string;
  label: string;
  value: number;
} {
  const metrics = [
    { key: "topSpeed", value: subnet.topSpeed },
    { key: "handling", value: subnet.handling },
    { key: "acceleration", value: subnet.acceleration },
  ];
  const best = metrics.reduce((a, b) =>
    Math.abs(b.value) > Math.abs(a.value) ? b : a
  );
  return { key: best.key, label: METRIC_LABELS[best.key], value: best.value };
}

export default function RaceCompleteModal({
  finishOrder,
  cars,
  raceTime,
  onRaceAgain,
  onChangeGrid,
}: Props) {
  const [copied, setCopied] = useState(false);

  const podiumCars = useMemo(() => {
    return finishOrder.slice(0, 3).map((id) => {
      const car = cars.find((c) => c.subnetId === id);
      return car!;
    });
  }, [finishOrder, cars]);

  const highlights = useMemo(() => {
    const lines: { text: string; color: string }[] = [];
    if (podiumCars.length === 0) return lines;

    const winner = podiumCars[0];
    const stat = getTopStat(winner.subnet);
    lines.push({
      text: `SN${String(winner.subnetId).padStart(2, "0")} dominated on ${stat.label} (${formatTaoValue(stat.value)} TAO)`,
      color: winner.subnet.color,
    });

    if (podiumCars.length >= 2) {
      const p2 = podiumCars[1];
      if (p2.subnet.acceleration < 0) {
        lines.push({
          text: `SN${String(p2.subnetId).padStart(2, "0")} held P2 despite negative 1d flow`,
          color: p2.subnet.color,
        });
      }
    }

    return lines;
  }, [podiumCars]);

  const handleShare = useCallback(async () => {
    if (podiumCars.length === 0) return;
    const winner = podiumCars[0];
    const stat = getTopStat(winner.subnet);
    const text = [
      `SN${winner.subnetId} (${winner.subnet.name}) wins the Bittensor dev race!`,
      `${stat.label}: ${formatTaoValue(stat.value)} TAO`,
      "",
      "Race your subnets at racer.intotao.app",
      "#Bittensor #TAO",
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [podiumCars]);

  const winnerNetuid = podiumCars[0]?.subnetId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.4)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[560px] max-w-[94vw] overflow-hidden border"
        style={{
          background: "rgba(14, 14, 18, 0.97)",
          borderColor: "#2a2a35",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Amber top accent */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: "#e8a430" }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "#2a2a35" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{
                color: "#e8a430",
                fontFamily: "var(--font-display)",
              }}
            >
              Race Complete
            </span>
          </div>
          <span
            className="text-sm tabular-nums"
            style={{
              color: "#8a8a96",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
            }}
          >
            {formatTime(raceTime)}
          </span>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-5 px-6 pb-4 pt-6">
          {PODIUM_ORDER.map((rank) => {
            const car = podiumCars[rank];
            if (!car) return null;

            const stat = getTopStat(car.subnet);
            const height = PODIUM_HEIGHTS[rank];
            const medalColor = MEDAL_COLORS[rank];
            const isWinner = rank === 0;

            return (
              <motion.div
                key={car.subnetId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + rank * 0.1, duration: 0.35 }}
                className="flex w-[150px] flex-col items-center"
              >
                {/* Medal position */}
                <span
                  className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: medalColor,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  P{rank + 1}
                </span>

                {/* Logo / color dot */}
                <div className="relative mb-2">
                  {car.subnet.logo_url ? (
                    <img
                      src={car.subnet.logo_url}
                      alt={car.subnet.name}
                      className="h-8 w-8 rounded-full object-cover"
                      style={{
                        border: `2px solid ${car.subnet.color}`,
                      }}
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{
                        background: car.subnet.color,
                        border: `2px solid ${car.subnet.color}55`,
                      }}
                    />
                  )}
                  {isWinner && (
                    <div
                      className="absolute -inset-1 rounded-full"
                      style={{
                        border: `1px solid ${car.subnet.color}40`,
                      }}
                    />
                  )}
                </div>

                {/* Subnet name */}
                <span
                  className="mb-0.5 max-w-[120px] truncate text-center text-sm font-bold"
                  style={{
                    color: isWinner ? "#d4d4d8" : "#8a8a96",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {car.subnet.name}
                </span>

                {/* Subnet ID */}
                <span
                  className="mb-1.5 text-[10px] tabular-nums"
                  style={{ color: "#555564" }}
                >
                  SN{String(car.subnetId).padStart(2, "0")}
                </span>

                {/* Top stat */}
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{
                    color: stat.value >= 0 ? "#7ec85a" : "#c84040",
                  }}
                >
                  {formatTaoValue(stat.value)} T
                </span>

                {/* Podium base */}
                <div
                  className="mt-2 w-full rounded-t-sm"
                  style={{
                    height: `${height}px`,
                    background: `linear-gradient(to top, ${car.subnet.color}18, ${car.subnet.color}08)`,
                    borderTop: `2px solid ${car.subnet.color}`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div
            className="mx-5 mb-4 border px-3 py-2"
            style={{
              borderColor: "#2a2a3588",
              background: "rgba(20, 20, 24, 0.6)",
            }}
          >
            {highlights.map((h, i) => (
              <p
                key={i}
                className="text-[11px] leading-relaxed"
                style={{ color: "#8a8a96" }}
              >
                <span style={{ color: h.color }}>
                  {h.text.slice(0, h.text.indexOf(" "))}
                </span>
                {h.text.slice(h.text.indexOf(" "))}
              </p>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div
          className="flex gap-2 border-t px-4 py-3"
          style={{ borderColor: "#2a2a35" }}
        >
          <button
            onClick={onRaceAgain}
            className="flex-1 cursor-pointer border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors"
            style={{
              borderColor: "#e8a43055",
              background: "#e8a43015",
              color: "#e8a430",
              fontFamily: "var(--font-display)",
            }}
          >
            Race Again
          </button>
          <button
            onClick={onChangeGrid}
            className="flex-1 cursor-pointer border px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors hover:text-[#d4d4d8]"
            style={{
              borderColor: "#2a2a35",
              color: "#8a8a96",
              background: "transparent",
              fontFamily: "var(--font-display)",
            }}
          >
            Change Grid
          </button>
          <button
            onClick={handleShare}
            className="cursor-pointer border px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors hover:text-[#d4d4d8]"
            style={{
              borderColor: "#2a2a35",
              color: copied ? "#7ec85a" : "#8a8a96",
              background: "transparent",
              fontFamily: "var(--font-display)",
              minWidth: "72px",
            }}
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <a
            href={`https://taostats.io/subnet/${winnerNetuid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center border px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors hover:text-[#d4d4d8]"
            style={{
              borderColor: "#2a2a35",
              color: "#8a8a96",
              background: "transparent",
              fontFamily: "var(--font-display)",
              textDecoration: "none",
            }}
          >
            TaoStats
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
