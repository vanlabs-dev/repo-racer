"use client";

import { motion } from "framer-motion";
import type { SubnetData } from "@/types";

interface SubnetCardProps {
  subnet: SubnetData;
  isSelected: boolean;
  onToggle: () => void;
}

export default function SubnetCard({
  subnet,
  isSelected,
  onToggle,
}: SubnetCardProps) {
  const formatTao = (val: number): string => {
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(1);
  };

  const formatPrice = (val: number): string => {
    if (val < 0.001) return val.toExponential(2);
    return val.toFixed(4);
  };

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className="relative w-full border p-3 text-left transition-colors"
      style={{
        borderColor: isSelected ? subnet.color + "66" : "#2a2a35",
        background: isSelected ? subnet.color + "0a" : "#1e1e24",
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: subnet.color }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Color swatch */}
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: subnet.color }}
          />
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
        <span className="truncate pl-2 text-[11px]" style={{ color: "#8a8a96" }}>
          {subnet.name}
        </span>
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
        <StatBar label="SPD" value={subnet.topSpeed} color={subnet.color} />
        <StatBar label="ACC" value={subnet.acceleration} color={subnet.color} />
        <StatBar label="HND" value={subnet.handling} color={subnet.color} />
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
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const absVal = Math.abs(value);
  const width = Math.min(100, Math.max(4, (absVal / 500) * 100));

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
            background: color,
          }}
        />
      </div>
    </div>
  );
}
