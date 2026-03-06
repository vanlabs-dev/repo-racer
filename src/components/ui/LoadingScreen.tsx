"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_LINES = [
  { text: "SYS    INITIALIZING RACE SIMULATOR", delay: 0, status: "run" },
  { text: "NET    CONNECTING TO TAO CHAIN", delay: 350, status: "run" },
  { text: "DAT    LOADING SUBNET TELEMETRY", delay: 700, status: "run" },
  { text: "DAT    LOADING POOL METRICS", delay: 1050, status: "run" },
  { text: "GFX    COMPILING RENDER PIPELINE", delay: 1400, status: "run" },
  { text: "CAM    CALIBRATING BROADCAST FEED", delay: 1750, status: "run" },
  { text: "SIM    ALL SYSTEMS NOMINAL", delay: 2100, status: "ok" },
  { text: "", delay: 2400, status: "blank" },
  { text: "REPO RACER v0.1", delay: 2600, status: "title" },
  { text: "BITTENSOR SUBNET RACE SIMULATOR", delay: 2800, status: "sub" },
  { text: "", delay: 3000, status: "blank" },
  { text: "READY", delay: 3200, status: "ready" },
];

interface LoadingScreenProps {
  isDataLoaded: boolean;
  onComplete: () => void;
}

export default function LoadingScreen({
  isDataLoaded,
  onComplete,
}: LoadingScreenProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, BOOT_LINES[i].delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const isReady = visibleLines >= BOOT_LINES.length && isDataLoaded;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#1a1a1f" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-lg px-6">
        {/* Terminal panel */}
        <div
          className="border p-6"
          style={{
            borderColor: "#2a2a35",
            background: "#141418",
          }}
        >
          {/* Terminal header bar */}
          <div
            className="mb-4 flex items-center justify-between border-b pb-2"
            style={{ borderColor: "#2a2a35" }}
          >
            <span
              className="text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{
                color: "#8a8a96",
                fontFamily: "var(--font-display)",
              }}
            >
              System Boot
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "#555564" }}
            >
              {visibleLines}/{BOOT_LINES.length}
            </span>
          </div>

          {/* Boot lines */}
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
            if (line.status === "blank") {
              return <div key={i} className="h-3" />;
            }

            let textColor = "#555564";
            let prefix = "";

            if (line.status === "run") {
              textColor = "#8a8a96";
              prefix = "... ";
            } else if (line.status === "ok") {
              textColor = "#7ec85a";
              prefix = "[+] ";
            } else if (line.status === "title") {
              textColor = "#e8a430";
            } else if (line.status === "sub") {
              textColor = "#8a8a96";
            } else if (line.status === "ready") {
              textColor = "#7ec85a";
              prefix = ">>> ";
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className={`whitespace-pre text-xs leading-6 ${
                  line.status === "title"
                    ? "text-base font-semibold tracking-[0.15em]"
                    : line.status === "sub"
                      ? "text-[11px] tracking-[0.1em]"
                      : ""
                }`}
                style={{
                  color: textColor,
                  fontFamily:
                    line.status === "title"
                      ? "var(--font-display)"
                      : undefined,
                }}
              >
                {prefix}
                {line.text}
              </motion.div>
            );
          })}

          {/* Cursor */}
          <div className="mt-1 h-4">
            <span
              className="inline-block h-3.5 w-[7px]"
              style={{
                background: "#e8a430",
                opacity: showCursor ? 0.8 : 0,
              }}
            />
          </div>
        </div>

        {/* Continue button */}
        <AnimatePresence>
          {isReady && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={onComplete}
              className="mt-4 w-full border px-5 py-2.5 text-xs uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "#e8a43044",
                background: "#e8a43010",
                color: "#e8a430",
                fontFamily: "var(--font-display)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8a43020";
                e.currentTarget.style.borderColor = "#e8a43066";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e8a43010";
                e.currentTarget.style.borderColor = "#e8a43044";
              }}
            >
              Enter Simulator
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
