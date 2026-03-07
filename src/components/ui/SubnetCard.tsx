"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SubnetData } from "@/types";

interface SubnetCardProps {
  subnet: SubnetData;
  isSelected: boolean;
  onToggle: () => void;
}

function getBarColor(value: number, maxVal: number): string {
  if (value < 0) return "#c84040";
  if (value < maxVal * 0.33) return "#e8a430";
  if (value < maxVal * 0.66) return "#d4a017";
  return "#7ec85a";
}

export default function SubnetCard({
  subnet,
  isSelected,
  onToggle,
}: SubnetCardProps) {
  const isInactive = subnet.price > 1.0;
  const noRepo = !subnet.hasGithub;
  const isStalled =
    subnet.topSpeed < 0 && subnet.acceleration < 0 && subnet.handling < 0;
  const disabled = (noRepo || isInactive) && !isSelected;
  const [logoFailed, setLogoFailed] = useState(false);
  const hasLogo = !!subnet.logo_url && !logoFailed;

  const formatTao = (val: number): string => {
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(1);
  };

  const formatPrice = (val: number): string => {
    if (val < 0.001) return val.toExponential(2);
    return val.toFixed(4);
  };

  const maxFlow = Math.max(
    Math.abs(subnet.topSpeed),
    Math.abs(subnet.acceleration),
    Math.abs(subnet.handling),
    1
  );

  const title = isStalled
    ? "All TAO flow metrics negative - car will crawl"
    : undefined;

  const hasBadges = isStalled || isInactive || noRepo;

  return (
    <motion.button
      onClick={disabled ? undefined : onToggle}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      title={title}
      className="relative w-full border p-3 text-left transition-colors"
      style={{
        borderColor: isSelected ? subnet.color + "66" : "#2a2a35",
        background: isSelected ? subnet.color + "0a" : "#1e1e24",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: subnet.color }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {hasLogo ? (
              <img
                src={subnet.logo_url!}
                alt={subnet.name}
                width={16}
                height={16}
                className="h-4 w-4 rounded-sm object-contain"
                style={{ background: "#2a2a35" }}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: subnet.color }}
              />
            )}
            <span
              className="text-xs font-medium tabular-nums"
              style={{
                color: "#d4d4d8",
                fontFamily: "var(--font-display)",
              }}
            >
              {String(subnet.netuid).padStart(2, "0")}
            </span>
          </div>
          <div
            className="mt-0.5 max-w-[120px] truncate text-[11px]"
            style={{ color: "#8a8a96" }}
          >
            {subnet.name || "Unknown"}
          </div>
        </div>
        {hasBadges && (
          <div className="flex flex-col items-end gap-0.5">
            {isStalled && (
              <span
                className="text-[8px] uppercase"
                style={{
                  color: "#e8a430",
                  background: "#e8a43015",
                  border: "1px solid #e8a43033",
                  padding: "2px 4px",
                }}
              >
                Stall
              </span>
            )}
            {isInactive && (
              <span
                className="text-[8px] uppercase"
                style={{
                  color: "#8a8a96",
                  background: "#8a8a9615",
                  border: "1px solid #8a8a9633",
                  padding: "2px 4px",
                }}
              >
                Inactive
              </span>
            )}
            {noRepo && (
              <span
                className="text-[8px] uppercase"
                style={{
                  color: "#555564",
                  background: "#55556415",
                  border: "1px solid #55556433",
                  padding: "2px 4px",
                }}
              >
                No Repo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Price row */}
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xs tabular-nums" style={{ color: "#d4d4d8" }}>
          {formatPrice(subnet.price)} τ
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{
            color: subnet.priceChange1d >= 0 ? "#7ec85a" : "#c84040",
          }}
        >
          {subnet.priceChange1d >= 0 ? "+" : ""}
          {subnet.priceChange1d.toFixed(1)}%
        </span>
      </div>

      {/* Stat bars */}
      <div className="mt-2 space-y-1">
        <StatBar label="SPD" value={subnet.topSpeed} maxVal={maxFlow} formatTao={formatTao} />
        <StatBar label="ACC" value={subnet.acceleration} maxVal={maxFlow} formatTao={formatTao} />
        <StatBar label="HND" value={subnet.handling} maxVal={maxFlow} formatTao={formatTao} />
      </div>

      {/* Bottom meta */}
      <div
        className="mt-2 flex gap-3 text-[9px] tabular-nums"
        style={{ color: "#555564" }}
      >
        <span>MC {formatTao(subnet.marketCap)}τ</span>
        <span>V {formatTao(subnet.taoVolume24h)}τ</span>
      </div>
    </motion.button>
  );
}

function StatBar({
  label,
  value,
  maxVal,
  formatTao,
}: {
  label: string;
  value: number;
  maxVal: number;
  formatTao: (val: number) => string;
}) {
  const width = value < 0 ? 4 : Math.min(100, Math.max(4, (value / maxVal) * 100));
  const barColor = getBarColor(value, maxVal);
  const signedValue = `${value >= 0 ? "+" : ""}${formatTao(value)}τ`;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-5 text-[9px] uppercase"
        style={{ color: "#555564" }}
      >
        {label}
      </span>
      <div
        className="h-[3px] flex-1"
        style={{ background: "#2a2a35" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${width}%`,
            background: barColor,
          }}
        />
      </div>
      <span
        className="w-12 text-right text-[9px] tabular-nums"
        style={{ color: barColor }}
      >
        {signedValue}
      </span>
    </div>
  );
}
