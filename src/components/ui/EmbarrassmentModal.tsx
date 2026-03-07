"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { CarState } from "@/types";

interface Props {
  stalledCars: CarState[];
  onDismiss: () => void;
}

const DISMISS_MS = 3500;

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
          <div className="mb-6 flex items-center gap-3">
            <span className="text-lg">&#x1F4A8;</span>
            <h2
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{
                color: "#e8a430",
                fontFamily: "var(--font-display)",
              }}
            >
              Well that&apos;s embarrassing...
            </h2>
          </div>

          {/* Stalled cars */}
          <div className="mb-4 space-y-2">
            {stalledCars.map((car) => (
              <p
                key={car.subnetId}
                className="text-sm"
                style={{
                  color: car.subnet.color,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {car.subnet.name} (SN{String(car.subnetId).padStart(2, "0")})
                did not finish.
              </p>
            ))}
          </div>

          {/* Subtext */}
          <p
            className="text-[11px]"
            style={{ color: "#555564" }}
          >
            Removing from race results.
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
