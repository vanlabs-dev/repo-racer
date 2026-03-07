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
    const lines: { text: string; color: string; prefixLen: number }[] = [];
    if (finishOrder.length === 0) return lines;

    // P1 winner is always finishOrder[0]
    const winnerCar = cars.find((c) => c.subnetId === finishOrder[0]);
    if (winnerCar) {
      const stat = getTopStat(winnerCar.subnet);
      const winnerPrefix = `${winnerCar.subnet.name} (SN${winnerCar.subnetId})`;
      lines.push({
        text: `${winnerPrefix} dominated on ${stat.label} (${formatTaoValue(stat.value)} TAO)`,
        color: winnerCar.subnet.color,
        prefixLen: winnerPrefix.length,
      });
    }

    // P2 drama highlight
    if (finishOrder.length >= 2) {
      const p2Car = cars.find((c) => c.subnetId === finishOrder[1]);
      if (p2Car && p2Car.subnet.acceleration < 0) {
        const p2Prefix = `${p2Car.subnet.name} (SN${p2Car.subnetId})`;
        lines.push({
          text: `${p2Prefix} held P2 despite negative 1d flow`,
          color: p2Car.subnet.color,
          prefixLen: p2Prefix.length,
        });
      }
    }

    return lines;
  }, [finishOrder, cars]);

  const handleShare = useCallback(async () => {
    if (podiumCars.length === 0) return;
    setShareState("copying");

    const W = 1200;
    const H = 628;
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

    const p1Color = podiumCars[0].subnet.color;

    // --- Background ---
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // Radial glow behind P1
    const glow = ctx.createRadialGradient(600, 276, 0, 600, 276, 350);
    glow.addColorStop(0, p1Color + "14");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Speed lines
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 1;
    const angle = Math.tan(15 * Math.PI / 180);
    for (let i = 0; i < 14; i++) {
      const x0 = 0;
      const y0 = i * 50 + 25;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(W, y0 + W * angle);
      ctx.stroke();
    }

    // --- Top bar ---
    const topBarGrad = ctx.createLinearGradient(0, 0, W, 0);
    topBarGrad.addColorStop(0, "#1a1408");
    topBarGrad.addColorStop(1, "#0e0e12");
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(0, 0, W, 70);

    // Amber accent line
    ctx.fillStyle = "#e8a430";
    ctx.fillRect(0, 0, W, 4);

    // Branding
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.font = "bold 30px 'Arial Black', sans-serif";
    ctx.fillStyle = "#e8a430";
    ctx.fillText("REPO RACER", 38, 45);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("racer.intotao.app", 38, 63);

    // Race time
    ctx.textAlign = "right";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(formatTime(raceTime), 1162, 43);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("RACE TIME", 1162, 63);

    // --- Podium columns ---
    const podiumBaseY = 515;

    const displayColumns = [
      { rank: 1, cx: 300, pH: 50, logoR: 32, medal: "\u{1F948}", medalSize: 30, nameSize: 17, statSize: 16, barW: 92, baseW: 140, nameColor: "#d4d4d8" },
      { rank: 0, cx: 600, pH: 70, logoR: 42, medal: "\u{1F947}", medalSize: 36, nameSize: 23, statSize: 21, barW: 115, baseW: 168, nameColor: "#ffffff" },
      { rank: 2, cx: 900, pH: 35, logoR: 32, medal: "\u{1F949}", medalSize: 30, nameSize: 17, statSize: 16, barW: 92, baseW: 140, nameColor: "#d4d4d8" },
    ].filter((d) => podiumCars[d.rank] != null);

    // Adjust column positions for fewer than 3 finishers
    if (displayColumns.length === 2) {
      const p2Col = displayColumns.find((d) => d.rank === 1);
      const p1Col = displayColumns.find((d) => d.rank === 0);
      if (p2Col) p2Col.cx = 370;
      if (p1Col) p1Col.cx = 830;
    } else if (displayColumns.length === 1) {
      displayColumns[0].cx = 600;
    }

    displayColumns.forEach(({ rank, cx, pH, logoR, medal, medalSize, nameSize, statSize, barW, baseW, nameColor }) => {
      const car = podiumCars[rank];
      if (!car) return;
      const stat = getTopStat(car.subnet);
      const logo = logoImages[rank];
      const isP1 = rank === 0;

      let y = 90;

      // Medal
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = `${medalSize}px serif`;
      ctx.fillText(medal, cx, y);
      y += medalSize + 12;

      // P1 glow circle behind logo
      if (isP1) {
        const logoGlow = ctx.createRadialGradient(cx, y + logoR, 0, cx, y + logoR, logoR + 20);
        logoGlow.addColorStop(0, car.subnet.color + "59");
        logoGlow.addColorStop(1, "transparent");
        ctx.fillStyle = logoGlow;
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Logo or color circle
      if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, cx - logoR, y, logoR * 2, logoR * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = car.subnet.color;
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.fill();
      }

      // P1 ring stroke
      if (isP1) {
        ctx.strokeStyle = car.subnet.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, y + logoR, logoR, 0, Math.PI * 2);
        ctx.stroke();
      }

      y += logoR * 2 + 14;

      // Subnet name
      ctx.font = `bold ${nameSize}px sans-serif`;
      ctx.fillStyle = nameColor;
      const maxNameLen = isP1 ? 18 : 16;
      const name = car.subnet.name.length > maxNameLen
        ? car.subnet.name.slice(0, maxNameLen - 1) + "\u2026"
        : car.subnet.name;
      ctx.fillText(name, cx, y);
      y += nameSize + 5;

      // SN##
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#555564";
      ctx.fillText(`SN${String(car.subnetId).padStart(2, "0")}`, cx, y);
      y += 22;

      // Top stat
      ctx.font = `${isP1 ? "bold " : ""}${statSize}px 'Courier New', monospace`;
      ctx.fillStyle = stat.value >= 0 ? "#7ec85a" : "#c84040";
      ctx.fillText(`${formatTaoValue(stat.value)} T`, cx, y);
      y += statSize + 8;

      // Stat bar
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - barW / 2, y, barW, 3);

      // Podium base
      const baseGrad = ctx.createLinearGradient(0, podiumBaseY - pH, 0, podiumBaseY);
      baseGrad.addColorStop(0, car.subnet.color + "33");
      baseGrad.addColorStop(1, "#1a1a24");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(cx - baseW / 2, podiumBaseY - pH, baseW, pH);
      // Top border
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - baseW / 2, podiumBaseY - pH, baseW, 2);
    });

    // --- Divider ---
    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(38, 536);
    ctx.lineTo(1162, 536);
    ctx.stroke();

    // --- Stat highlight ---
    let highlightEndY = 555;
    if (highlights.length > 0) {
      const h = highlights[0];
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "15px sans-serif";

      // Colored dot
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(46, 560, 5, 0, Math.PI * 2);
      ctx.fill();

      // Name+SN prefix in color, rest in gray
      const prefix = h.text.slice(0, h.prefixLen);
      const rest = h.text.slice(h.prefixLen);
      ctx.fillStyle = h.color;
      ctx.fillText(prefix, 60, 553);
      const prefixWidth = ctx.measureText(prefix).width;
      ctx.fillStyle = "#8a8a96";
      ctx.fillText(rest, 60 + prefixWidth, 553);
      highlightEndY = 575;
    }

    // --- Winner stats line ---
    const p1Car = podiumCars[0];
    if (p1Car) {
      const statsY = highlightEndY;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "13px 'Courier New', monospace";

      const segments: { text: string; color: string }[] = [
        { text: "30d Flow: ", color: "#555564" },
        { text: `${formatTaoValue(p1Car.subnet.topSpeed)} T`, color: p1Car.subnet.topSpeed >= 0 ? "#7ec85a" : "#c84040" },
        { text: "   |   7d Flow: ", color: "#555564" },
        { text: `${formatTaoValue(p1Car.subnet.handling)} T`, color: p1Car.subnet.handling >= 0 ? "#7ec85a" : "#c84040" },
        { text: "   |   1d Flow: ", color: "#555564" },
        { text: `${formatTaoValue(p1Car.subnet.acceleration)} T`, color: p1Car.subnet.acceleration >= 0 ? "#7ec85a" : "#c84040" },
      ];

      let sx = 60;
      for (const seg of segments) {
        ctx.fillStyle = seg.color;
        ctx.fillText(seg.text, sx, statsY);
        sx += ctx.measureText(seg.text).width;
      }
    }

    // --- Bottom row ---
    ctx.textBaseline = "top";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#333344";
    ctx.fillText("#Bittensor #TAO", 38, 604);
    ctx.textAlign = "right";
    ctx.fillStyle = "#e8a430";
    ctx.fillText("racer.intotao.app", 1162, 604);

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
                  {h.text.slice(0, h.prefixLen)}
                </span>
                {h.text.slice(h.prefixLen)}
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
