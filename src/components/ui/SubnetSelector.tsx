"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import SubnetCard from "./SubnetCard";
import { MIN_SUBNETS, MAX_SUBNETS } from "@/lib/constants";

interface SubnetSelectorProps {
  onStart: () => void;
}

export default function SubnetSelector({ onStart }: SubnetSelectorProps) {
  const subnets = useUIStore((s) => s.subnets);
  const selectedSubnets = useUIStore((s) => s.selectedSubnets);
  const toggleSubnet = useUIStore((s) => s.toggleSubnet);
  const [search, setSearch] = useState("");

  const canStart = selectedSubnets.length >= MIN_SUBNETS;
  const selectedIds = new Set(selectedSubnets.map((s) => s.netuid));

  const filtered = useMemo(() => {
    if (!search.trim()) return subnets;
    const q = search.toLowerCase().trim();
    return subnets.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(q) ||
        String(s.netuid).includes(q)
    );
  }, [subnets, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(18, 18, 26, 0.85)" }}
      />

      {/* Main panel */}
      <div
        className="relative z-10 mx-4 flex max-h-[88vh] w-full max-w-6xl flex-col border"
        style={{
          borderColor: "#2a2a35",
          background: "#1a1a1f",
        }}
      >
        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "#2a2a35" }}
        >
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{
                color: "#d4d4d8",
                fontFamily: "var(--font-display)",
              }}
            >
              Race Roster
            </h2>
            <p className="mt-0.5 text-[11px]" style={{ color: "#555564" }}>
              Select {MIN_SUBNETS}–{MAX_SUBNETS} subnets to race
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="text-xs tabular-nums"
              style={{ color: "#8a8a96" }}
            >
              <span style={{ color: "#e8a430" }}>
                {selectedSubnets.length}
              </span>
              <span style={{ color: "#555564" }}> / {MAX_SUBNETS}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="relative z-10 border-b px-5 py-2.5"
          style={{ borderColor: "#2a2a35" }}
        >
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-0 bg-transparent text-xs outline-none placeholder:text-[#555564]"
            style={{ color: "#d4d4d8" }}
          />
        </div>

        {/* Selected preview strip */}
        {selectedSubnets.length > 0 && (
          <div
            className="relative z-10 flex items-center gap-2 border-b px-5 py-2"
            style={{ borderColor: "#2a2a35" }}
          >
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "#555564" }}
            >
              Grid:
            </span>
            {selectedSubnets.map((s, i) => (
              <div
                key={s.netuid}
                className="flex items-center gap-1 border px-2 py-0.5"
                style={{ borderColor: s.color + "44" }}
              >
                <div
                  className="h-1.5 w-1.5"
                  style={{ background: s.color }}
                />
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: "#d4d4d8" }}
                >
                  P{i + 1}
                </span>
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: "#8a8a96" }}
                >
                  #{s.netuid}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((subnet) => (
              <SubnetCard
                key={subnet.netuid}
                subnet={subnet}
                isSelected={selectedIds.has(subnet.netuid)}
                onToggle={() => toggleSubnet(subnet)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div
              className="py-12 text-center text-xs"
              style={{ color: "#555564" }}
            >
              No subnets match &quot;{search}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="relative z-10 flex items-center gap-3 border-t px-5 py-3"
          style={{ borderColor: "#2a2a35" }}
        >
          <button
            onClick={canStart ? onStart : undefined}
            className="flex-1 border px-5 py-2.5 text-xs uppercase tracking-[0.15em] transition-colors"
            style={{
              borderColor: canStart ? "#e8a43055" : "#2a2a35",
              background: canStart ? "#e8a43012" : "transparent",
              color: canStart ? "#e8a430" : "#555564",
              cursor: canStart ? "pointer" : "not-allowed",
              fontFamily: "var(--font-display)",
            }}
          >
            {canStart
              ? `Start Race \u2014 ${selectedSubnets.length} Racers`
              : `Select at least ${MIN_SUBNETS} subnets`}
          </button>
        </div>

        {/* Scanline overlay (must be last) */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
          }}
        />
      </div>
    </motion.div>
  );
}
