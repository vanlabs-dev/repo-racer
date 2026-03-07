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
    const DPR = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const logoImages = await Promise.all(
      podiumCars.slice(0, 3).map((car) => {
        if (!car?.subnet?.logo_url) return Promise.resolve(null);
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = car.subnet.logo_url!;
        });
      })
    );

    const p1 = podiumCars[0];
    const p1Color = p1.subnet.color;
    const count = Math.min(podiumCars.length, 3);
    const p1CX = count === 1 ? 600 : count === 2 ? 780 : 600;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // Radial glow
    const glow = ctx.createRadialGradient(p1CX, 300, 0, p1CX, 300, 320);
    glow.addColorStop(0, p1Color + "1a");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Speed lines
    ctx.save();
    ctx.strokeStyle = "#ffffff0a";
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const y0 = i * 38 - 20;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(W, y0 + W * Math.tan(12 * Math.PI / 180));
      ctx.stroke();
    }
    ctx.restore();

    // Header bar
    const hdrGrad = ctx.createLinearGradient(0, 0, W, 0);
    hdrGrad.addColorStop(0, "#1c1508");
    hdrGrad.addColorStop(1, "#0e0e12");
    ctx.fillStyle = hdrGrad;
    ctx.fillRect(0, 0, W, 72);
    ctx.fillStyle = "#e8a430";
    ctx.fillRect(0, 0, W, 4);

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.font = "bold 32px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = "#e8a430";
    ctx.fillText("REPO RACER", 36, 46);
    ctx.font = "13px Arial, sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("racer.intotao.app", 36, 65);

    ctx.textAlign = "right";
    ctx.font = "bold 30px 'Courier New', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(formatTime(raceTime), 1164, 46);
    ctx.font = "12px Arial, sans-serif";
    ctx.fillStyle = "#555564";
    ctx.fillText("RACE TIME", 1164, 65);

    // Column definitions
    type ColDef = {
      carIdx: number; medal: string; cx: number;
      logoR: number; medalSz: number; nameSz: number;
      statSz: number; barW: number; baseH: number;
      baseW: number; nameCol: string;
    };

    const BASE_BOTTOM = 490;
    const FOOTER_TOP = 515;

    const p2def = (cx: number): ColDef => ({
      carIdx: 1, medal: String.fromCodePoint(0x1F948), cx,
      logoR: 30, medalSz: 28, nameSz: 16, statSz: 15,
      barW: 90, baseH: 50, baseW: 140, nameCol: "#c0c0c8",
    });
    const p1def = (cx: number): ColDef => ({
      carIdx: 0, medal: String.fromCodePoint(0x1F947), cx,
      logoR: 44, medalSz: 38, nameSz: 24, statSz: 22,
      barW: 120, baseH: 80, baseW: 180, nameCol: "#ffffff",
    });
    const p3def = (cx: number): ColDef => ({
      carIdx: 2, medal: String.fromCodePoint(0x1F949), cx,
      logoR: 26, medalSz: 24, nameSz: 14, statSz: 14,
      barW: 80, baseH: 36, baseW: 120, nameCol: "#a0a0a8",
    });

    const cols: ColDef[] =
      count === 1 ? [p1def(600)] :
      count === 2 ? [p2def(360), p1def(780)] :
                   [p2def(270), p1def(600), p3def(930)];

    cols.forEach((col) => {
      const car = podiumCars[col.carIdx];
      if (!car) return;
      const logo = logoImages[col.carIdx] ?? null;
      const stat = getTopStat(car.subnet);
      const isP1 = col.carIdx === 0;
      const { cx } = col;

      // All Y positions calculated upward from BASE_BOTTOM
      const baseTop = BASE_BOTTOM - col.baseH;
      const barY    = baseTop - 14;
      const statY   = barY - col.statSz - 6;
      const snY     = statY - 20;
      const nameY   = snY - col.nameSz - 4;
      const logoTop = nameY - col.logoR * 2 - 14;
      const logoCY  = logoTop + col.logoR;
      const medalY  = logoTop - col.medalSz - 8;

      // P1 glow
      if (isP1) {
        const g = ctx.createRadialGradient(cx, logoCY, 0, cx, logoCY, col.logoR + 28);
        g.addColorStop(0, car.subnet.color + "50");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, logoCY, col.logoR + 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, logoCY, col.logoR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (logo) {
        ctx.drawImage(logo, cx - col.logoR, logoTop, col.logoR * 2, col.logoR * 2);
      } else {
        ctx.fillStyle = car.subnet.color;
        ctx.fill();
      }
      ctx.restore();

      // P1 ring
      if (isP1) {
        ctx.strokeStyle = car.subnet.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, logoCY, col.logoR + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Medal
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = `${col.medalSz}px Arial, sans-serif`;
      ctx.fillText(col.medal, cx, medalY);

      // Name
      ctx.textBaseline = "alphabetic";
      ctx.font = `bold ${col.nameSz}px Arial, sans-serif`;
      ctx.fillStyle = col.nameCol;
      const maxLen = isP1 ? 16 : 13;
      const name = car.subnet.name.length > maxLen
        ? car.subnet.name.slice(0, maxLen - 1) + "\u2026"
        : car.subnet.name;
      ctx.fillText(name, cx, nameY);

      // SN##
      ctx.font = "13px Arial, sans-serif";
      ctx.fillStyle = "#555564";
      ctx.fillText(`SN${String(car.subnetId).padStart(2, "0")}`, cx, snY);

      // Stat value
      ctx.font = `${isP1 ? "bold " : ""}${col.statSz}px 'Courier New', monospace`;
      ctx.fillStyle = stat.value >= 0 ? "#7ec85a" : "#c84040";
      ctx.fillText(`${formatTaoValue(stat.value)} T`, cx, statY);

      // Stat bar
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - col.barW / 2, barY, col.barW, 3);

      // Podium base
      const bg = ctx.createLinearGradient(0, baseTop, 0, BASE_BOTTOM);
      bg.addColorStop(0, car.subnet.color + "44");
      bg.addColorStop(1, "#111118");
      ctx.fillStyle = bg;
      ctx.fillRect(cx - col.baseW / 2, baseTop, col.baseW, col.baseH);
      ctx.fillStyle = car.subnet.color;
      ctx.fillRect(cx - col.baseW / 2, baseTop, col.baseW, 2);
    });

    // Footer divider
    ctx.strokeStyle = "#2a2a35";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, FOOTER_TOP);
    ctx.lineTo(W - 36, FOOTER_TOP);
    ctx.stroke();

    // Highlight line
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    let fy = FOOTER_TOP + 16;
    if (highlights.length > 0) {
      const h = highlights[0];
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(44, fy + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "15px Arial, sans-serif";
      const prefix = h.text.slice(0, h.prefixLen);
      const rest = h.text.slice(h.prefixLen);
      ctx.fillStyle = h.color;
      ctx.fillText(prefix, 58, fy);
      ctx.fillStyle = "#8a8a96";
      ctx.fillText(rest, 58 + ctx.measureText(prefix).width, fy);
      fy += 26;
    }

    // Winner stats row
    ctx.font = "13px 'Courier New', monospace";
    const segs: { text: string; color: string }[] = [
      { text: "30d: ", color: "#555564" },
      { text: `${formatTaoValue(p1.subnet.topSpeed)} T`, color: p1.subnet.topSpeed >= 0 ? "#7ec85a" : "#c84040" },
      { text: "   7d: ", color: "#555564" },
      { text: `${formatTaoValue(p1.subnet.handling)} T`, color: p1.subnet.handling >= 0 ? "#7ec85a" : "#c84040" },
      { text: "   1d: ", color: "#555564" },
      { text: `${formatTaoValue(p1.subnet.acceleration)} T`, color: p1.subnet.acceleration >= 0 ? "#7ec85a" : "#c84040" },
    ];
    let sx = 58;
    for (const seg of segs) {
      ctx.fillStyle = seg.color;
      ctx.fillText(seg.text, sx, fy);
      sx += ctx.measureText(seg.text).width;
    }

    // Bottom credits
    ctx.font = "12px Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#333344";
    ctx.fillText("#Bittensor #TAO", 36, H - 26);
    ctx.textAlign = "right";
    ctx.fillStyle = "#e8a430";
    ctx.fillText("racer.intotao.app", W - 36, H - 26);

    // Copy to clipboard
    canvas.toBlob(async (blob) => {
      if (!blob) { setShareState("idle"); return; }
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
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
