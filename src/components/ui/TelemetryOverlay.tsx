"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { useRaceStore } from "@/stores/raceStore";

export default function TelemetryOverlay() {
  const focusedCar = useUIStore((s) => s.focusedCar);
  const setFocusedCar = useUIStore((s) => s.setFocusedCar);
  const cars = useRaceStore((s) => s.cars);
  const leaderboard = useRaceStore((s) => s.leaderboard);
  const lapCount = useRaceStore((s) => s.lapCount);

  const car = cars.find((c) => c.subnetId === focusedCar);
  const racePosition =
    focusedCar !== null ? leaderboard.indexOf(focusedCar) + 1 : 0;

  return (
    <AnimatePresence>
      {car && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="fixed right-3 top-14 z-40 w-72"
        >
          <div
            className="border"
            style={{
              borderColor: "#2a2a35",
              background: "rgba(20, 20, 24, 0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-3 py-2"
              style={{ borderColor: "#2a2a35" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: car.subnet.color }}
                />
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{
                    color: "#d4d4d8",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  #{car.subnetId}
                </span>
                <span
                  className="truncate text-[11px]"
                  style={{ color: "#8a8a96" }}
                >
                  {car.subnet.name}
                </span>
              </div>
              <button
                onClick={() => setFocusedCar(null)}
                className="text-[10px] transition-colors"
                style={{ color: "#555564" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#d4d4d8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#555564")
                }
              >
                ESC
              </button>
            </div>

            {/* Race status row */}
            <div
              className="grid grid-cols-3 border-b"
              style={{ borderColor: "#2a2a35" }}
            >
              <DataCell
                label="POS"
                value={`P${racePosition}`}
                highlight={racePosition === 1}
              />
              <DataCell
                label="LAP"
                value={`${Math.min(car.currentLap + 1, lapCount)}/${lapCount}`}
              />
              <DataCell
                label="STATUS"
                value={car.isPitting ? "PIT" : "RUN"}
                statusColor={car.isPitting ? "#e8a430" : "#7ec85a"}
              />
            </div>

            {/* TAO Flow section */}
            <div
              className="border-b px-3 py-2.5"
              style={{ borderColor: "#2a2a35" }}
            >
              <SectionHeader label="TAO Flow" />
              <div className="mt-1.5 space-y-1">
                <FlowRow
                  label="24h"
                  value={car.subnet.acceleration}
                  sublabel="acceleration"
                />
                <FlowRow
                  label="7d"
                  value={car.subnet.handling}
                  sublabel="handling"
                />
                <FlowRow
                  label="30d"
                  value={car.subnet.topSpeed}
                  sublabel="top speed"
                />
              </div>
            </div>

            {/* Race attributes */}
            <div
              className="border-b px-3 py-2.5"
              style={{ borderColor: "#2a2a35" }}
            >
              <SectionHeader label="Race Attributes" />
              <div className="mt-1.5 space-y-0">
                <TelemetryRow
                  label="TOP SPEED"
                  value={car.subnet.topSpeed}
                  unit="τ"
                  color={car.subnet.color}
                />
                <TelemetryRow
                  label="ACCEL"
                  value={car.subnet.acceleration}
                  unit="τ"
                  color={car.subnet.color}
                />
                <TelemetryRow
                  label="HANDLING"
                  value={car.subnet.handling}
                  unit="τ"
                  color={car.subnet.color}
                />
                <TelemetryRow
                  label="PIT EFF"
                  value={car.subnet.pitstopRate}
                  unit="c/w"
                  color={car.subnet.color}
                />
              </div>
            </div>

            {/* Market data */}
            <div
              className="border-b px-3 py-2.5"
              style={{ borderColor: "#2a2a35" }}
            >
              <SectionHeader label="Market Data" />
              <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
                <MarketRow
                  label="Price"
                  value={`${car.subnet.price.toFixed(4)} τ`}
                />
                <MarketRow
                  label="MCap"
                  value={`${(car.subnet.marketCap / 1000).toFixed(1)}k τ`}
                />
                <MarketRow
                  label="24h Vol"
                  value={`${car.subnet.taoVolume24h.toFixed(1)} τ`}
                />
                <MarketRow
                  label="F&G"
                  value={`${car.subnet.fearGreedIndex}`}
                />
                <MarketRow
                  label="24h Chg"
                  value={`${car.subnet.priceChange1d >= 0 ? "+" : ""}${car.subnet.priceChange1d.toFixed(1)}%`}
                  valueColor={
                    car.subnet.priceChange1d >= 0 ? "#7ec85a" : "#c84040"
                  }
                />
                <MarketRow
                  label="7d Chg"
                  value={`${car.subnet.priceChange1w >= 0 ? "+" : ""}${car.subnet.priceChange1w.toFixed(1)}%`}
                  valueColor={
                    car.subnet.priceChange1w >= 0 ? "#7ec85a" : "#c84040"
                  }
                />
                <MarketRow
                  label="Buys"
                  value={`${car.subnet.buys24h}`}
                  valueColor="#7ec85a"
                />
                <MarketRow
                  label="Sells"
                  value={`${car.subnet.sells24h}`}
                  valueColor="#c84040"
                />
              </div>
            </div>

            {/* Data mapping explanation */}
            <div className="px-3 py-2.5">
              <SectionHeader label="Data → Race Mapping" />
              <div className="mt-1.5 space-y-0.5">
                <MappingRow
                  data="30d τ flow"
                  effect="straight-line speed"
                />
                <MappingRow
                  data="24h τ flow"
                  effect="off-the-line acceleration"
                />
                <MappingRow
                  data="7d τ flow"
                  effect="corner grip & stability"
                />
                <MappingRow
                  data="commit rate"
                  effect="pit stop efficiency"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <span
      className="text-[8px] font-medium uppercase tracking-[0.15em]"
      style={{
        color: "#555564",
        fontFamily: "var(--font-display)",
      }}
    >
      {label}
    </span>
  );
}

function DataCell({
  label,
  value,
  highlight = false,
  statusColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  statusColor?: string;
}) {
  return (
    <div className="px-3 py-1.5 text-center">
      <div
        className="text-[8px] uppercase tracking-wider"
        style={{ color: "#555564" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-semibold tabular-nums"
        style={{
          color: statusColor ?? (highlight ? "#e8a430" : "#d4d4d8"),
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FlowRow({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number;
  sublabel: string;
}) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-baseline justify-between text-[11px] tabular-nums">
      <div className="flex items-baseline gap-1.5">
        <span style={{ color: "#8a8a96" }}>{label}</span>
        <span className="text-[9px]" style={{ color: "#444452" }}>
          {sublabel}
        </span>
      </div>
      <span style={{ color: isPositive ? "#7ec85a" : "#c84040" }}>
        {isPositive ? "+" : ""}
        {value.toFixed(1)} τ
      </span>
    </div>
  );
}

function TelemetryRow({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const absVal = Math.abs(value);
  const width = Math.min(100, Math.max(6, (absVal / 500) * 100));

  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "#8a8a96" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "#d4d4d8" }}
        >
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div
        className="mt-0.5 h-[3px]"
        style={{ background: "#2a2a35" }}
      >
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function MarketRow({
  label,
  value,
  valueColor = "#8a8a96",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between text-[10px] tabular-nums">
      <span style={{ color: "#555564" }}>{label}</span>
      <span style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function MappingRow({
  data,
  effect,
}: {
  data: string;
  effect: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[9px]">
      <span style={{ color: "#8a8a96" }}>{data}</span>
      <span style={{ color: "#444452" }}>→</span>
      <span style={{ color: "#555564" }}>{effect}</span>
    </div>
  );
}
