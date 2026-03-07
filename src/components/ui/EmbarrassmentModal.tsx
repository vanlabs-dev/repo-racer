"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { CarState } from "@/types";

interface Props {
  stalledCars: CarState[];
  onDismiss: () => void;
}

const DISMISS_MS = 5500;

function formatTaoValue(value: number): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "";
  if (abs >= 1000) return `${sign}${Math.round(value).toLocaleString()} T`;
  if (abs >= 1) return `${sign}${value.toFixed(1)} T`;
  return `${sign}${value.toFixed(3)} T`;
}

const FLOW_ROWS: { label: string; key: "acceleration" | "handling" | "topSpeed" }[] = [
  { label: "24h Flow", key: "acceleration" },
  { label: "7d Flow", key: "handling" },
  { label: "30d Flow", key: "topSpeed" },
];

export default function EmbarrassmentModal({ stalledCars, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10, 10, 12, 0.75)" }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.3 }}
        className="relative w-[480px] overflow-hidden"
        style={{
          background: "rgba(26, 26, 31, 0.98)",
          border: "1px solid #2a2a35",
        }}
      >
        {/* Amber top accent */}
        <div
          className="h-[2px] w-full"
          style={{ background: "#e8a430" }}
        />

        <div className="px-8 pb-6 pt-8">
          {/* Title */}
          <h2
            className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]"
            style={{
              color: "#e8a430",
              fontFamily: "var(--font-display)",
            }}
          >
            Negative TAO Flow Detected &#x1F4C9;
          </h2>

          {/* Subheading */}
          <p
            className="mb-4 text-xs uppercase tracking-wide"
            style={{ color: "#8a8a96" }}
          >
            The following subnet(s) stalled due to catastrophic token outflows
          </p>

          {/* Stalled car cards */}
          <div className="mb-4 space-y-2">
            {stalledCars.map((car) => (
              <div
                key={car.subnetId}
                className="px-3 py-2"
                style={{
                  border: "1px solid #c8404033",
                  background: "#c8404008",
                }}
              >
                {/* Card header */}
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="text-sm font-bold"
                    style={{ color: car.subnet.color }}
                  >
                    &#x1F4A8; {car.subnet.name} (SN
                    {String(car.subnetId).padStart(2, "0")})
                  </span>
                  <span
                    className="px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                    style={{
                      background: "#c84040",
                      color: "#fff",
                    }}
                  >
                    DNF
                  </span>
                </div>

                {/* Stat rows */}
                <div className="space-y-1">
                  {FLOW_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span style={{ color: "#555564" }}>{row.label}</span>
                      <span
                        style={{
                          color: "#c84040",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatTaoValue(car.subnet[row.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Body copy */}
          <p
            className="mt-3 text-[11px] italic"
            style={{ color: "#555564" }}
          >
            Removed from podium. Suggestion: check your subnet&apos;s token
            economics before entering next time. &#x1F440;
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] w-full" style={{ background: "#1a1a1f" }}>
          <div
            className="h-full"
            style={{
              background: "#e8a430",
              animation: `embarrassment-drain ${DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>

        <style jsx>{`
          @keyframes embarrassment-drain {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
