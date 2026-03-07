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

const MEDAL_EMOJIS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"] as const; // P1=gold, P2=silver, P3=bronze
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
  const [shareState, setShareState] = useState<"idle" | "copying" | "copied">("idle");

  const podiumCars = useMemo(() => {
    return finishOrder.slice(0, 3).map((id) => {
      const car = cars.find((c) => c.subnetId === id);
      return car!;
    });
  }, [finishOrder, cars]);

  const highlights = useMemo(() => {
    const lines: { text: string; color: string }[] = [];
    if (finishOrder.length === 0) return lines;

    // P1 winner is always finishOrder[0]
    const winnerCar = cars.find((c) => c.subnetId === finishOrder[0]);
    if (winnerCar) {
      const stat = getTopStat(winnerCar.subnet);
      lines.push({
        text: `SN${String(winnerCar.subnetId).padStart(2, "0")} dominated on ${stat.label} (${formatTaoValue(stat.value)} TAO)`,
        color: winnerCar.subnet.color,
      });
    }

    // P2 drama highlight
    if (finishOrder.length >= 2) {
      const p2Car = cars.find((c) => c.subnetId === finishOrder[1]);
      if (p2Car && p2Car.subnet.acceleration < 0) {
        lines.push({
          text: `SN${String(p2Car.subnetId).padStart(2, "0")} held P2 despite negative 1d flow`,
          color: p2Car.subnet.color,
        });
      }
    }

    return lines;
  }, [finishOrder, cars]);

  const handleShare = useCallback(async () => {
    if (podiumCars.length === 0) return;
    setShareState("copying");

    const W = 800;
    const H = 450;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Preload logo images
    const logoImages = await Promise.all(
      podiumCars.slice(0, 3).map((car) => {
        if (!car.subnet.logo_url) return Promise.resolve(null);
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = car.subnet.logo_url!;
        });
      })
    );

    // Background
    ctx.fillStyle = "#0e0e12";
    ctx.fillRect(0, 0, W, H);

    // Amber top bar
    ctx.fillStyle = "#e8a430";
    ctx.fillRect(0, 0, W, 4);

    // Branding
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#e8a430";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("REPO RACER", 32, 28);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("racer.intotao.app", 32, 56);

    // Race time
    ctx.textAlign = "right";
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#d4d4d8";
    ctx.fillText(formatTime(raceTime), 768, 28);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("RACE TIME", 768, 52);

    // Divider
    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 80);
    ctx.lineTo(768, 80);
    ctx.stroke();

    // Podium columns: P2 (left), P1 (center), P3 (right)
    const podiumBase = 310;

    const displayColumns = [
      { rank: 1, cx: 230, pH: 32, medal: "\u{1F948}" }, // P2 left
      { rank: 0, cx: 400, pH: 48, medal: "\u{1F947}" }, // P1 center
      { rank: 2, cx: 570, pH: 20, medal: "\u{1F949}" }, // P3 right
    ].filter((d) => podiumCars[d.rank] != null);

    displayColumns.forEach(({ rank, cx, pH, medal }) => {
      const car = podiumCars[rank];
      if (!car) return;
      const stat = getTopStat(car.subnet);
      const logo = logoImages[rank];

      let y = 96;

      // Medal
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "28px serif";
      ctx.fillText(medal, cx, y);
      y += 38;

      // Logo or color circle
      const logoR = 24;
      if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, cx - logoR, y, logoR * 2, logoR * 2);
        ctx.restore();
        // Border
        ctx.strokeStyle = car.subnet.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = car.subnet.color;
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.fill();
      }
      y += logoR * 2 + 10;

      // Subnet name
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = rank === 0 ? "#d4d4d8" : "#8a8a96";
      const name = car.subnet.name.length > 14
        ? car.subnet.name.slice(0, 13) + "\u2026"
        : car.subnet.name;
      ctx.fillText(name, cx, y);
      y += 20;

      // SN##
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#8a8a96";
      ctx.fillText(`SN${String(car.subnetId).padStart(2, "0")}`, cx, y);
      y += 18;

      // Top stat
      ctx.font = "13px sans-serif";
      ctx.fillStyle = stat.value >= 0 ? "#7ec85a" : "#c84040";
      ctx.fillText(`${formatTaoValue(stat.value)} T`, cx, y);
      y += 18;

      // Colored underline
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - 30, y, 60, 3);

      // Podium base
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(cx - 60, podiumBase - pH, 120, pH);
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - 60, podiumBase - pH, 120, 2);
    });

    // Highlights
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let hy = 330;
    for (const h of highlights) {
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#8a8a96";
      // Draw SN## prefix in color
      const spaceIdx = h.text.indexOf(" ");
      const prefix = h.text.slice(0, spaceIdx);
      const rest = h.text.slice(spaceIdx);
      ctx.fillStyle = h.color;
      ctx.fillText(prefix, 32, hy);
      const prefixWidth = ctx.measureText(prefix).width;
      ctx.fillStyle = "#8a8a96";
      ctx.fillText(rest, 32 + prefixWidth, hy);
      hy += 20;
    }

    // Bottom strip
    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 410);
    ctx.lineTo(768, 410);
    ctx.stroke();

    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#555564";
    ctx.fillText("#Bittensor #TAO", 32, 424);
    ctx.textAlign = "right";
    ctx.fillStyle = "#e8a430";
    ctx.fillText("racer.intotao.app", 768, 424);

    // Copy to clipboard
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setShareState("idle");
        return;
      }
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 1500);
      } catch {
        setShareState("idle");
      }
    }, "image/png");
  }, [podiumCars, highlights, raceTime]);

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
                <span className="mb-2 text-lg">
                  {MEDAL_EMOJIS[rank]}
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
              color: shareState === "copied" ? "#7ec85a" : "#8a8a96",
              background: "transparent",
              fontFamily: "var(--font-display)",
              minWidth: "72px",
            }}
          >
            {shareState === "copying" ? "Copying..." : shareState === "copied" ? "Copied!" : "Share"}
          </button>
          <a
            href={`https://taostats.io/subnets/${winnerNetuid}`}
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
