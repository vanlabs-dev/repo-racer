/** Reusable track segment library. Building blocks for composing tracks in circuits.ts. */

import type { TrackSegment } from "./trackBuilder";

function straight(name: string, length: number, samples: number): TrackSegment {
  return { name, steps: [{ kind: "straight", length, samples }] };
}

function turn(
  name: string,
  radius: number,
  angle: number,
  direction: "left" | "right",
  samples: number
): TrackSegment {
  return { name, steps: [{ kind: "turn", radius, angle, direction, samples }] };
}

function chicane(
  name: string,
  radius: number,
  angle: number,
  firstDir: "left" | "right",
  linkLength: number,
  samplesPerTurn: number
): TrackSegment {
  const secondDir = firstDir === "left" ? "right" : "left";
  return {
    name,
    steps: [
      { kind: "turn", radius, angle, direction: firstDir, samples: samplesPerTurn },
      { kind: "straight", length: linkLength, samples: 3 },
      { kind: "turn", radius, angle, direction: secondDir, samples: samplesPerTurn },
    ],
  };
}

function sSection(
  name: string,
  radius: number,
  angle: number,
  firstDir: "left" | "right",
  linkLength: number,
  samplesPerTurn: number
): TrackSegment {
  const secondDir = firstDir === "left" ? "right" : "left";
  return {
    name,
    steps: [
      { kind: "turn", radius, angle, direction: firstDir, samples: samplesPerTurn },
      { kind: "straight", length: linkLength, samples: 4 },
      { kind: "turn", radius, angle, direction: secondDir, samples: samplesPerTurn },
    ],
  };
}

// --- Segment library ---

export const S = {
  // Straights
  straight_short:   straight("straight_short", 12, 5),
  straight_medium:  straight("straight_medium", 25, 10),
  straight_long:    straight("straight_long", 50, 18),
  connector_short:  straight("connector_short", 6, 3),
  connector_medium: straight("connector_medium", 12, 5),

  // Kinks
  kink_left_small:  turn("kink_left_small", 25, 8, "left", 4),
  kink_right_small: turn("kink_right_small", 25, 8, "right", 4),

  // Bends (45°)
  bend_left_45:  turn("bend_left_45", 14, 45, "left", 8),
  bend_right_45: turn("bend_right_45", 14, 45, "right", 8),

  // Corners (90°)
  corner_left_90:  turn("corner_left_90", 8, 90, "left", 10),
  corner_right_90: turn("corner_right_90", 8, 90, "right", 10),

  // Sweepers (45°, large radius)
  sweeper_left:  turn("sweeper_left", 22, 45, "left", 10),
  sweeper_right: turn("sweeper_right", 22, 45, "right", 10),

  // Hairpins (170°)
  hairpin_left:  turn("hairpin_left", 5, 170, "left", 14),
  hairpin_right: turn("hairpin_right", 5, 170, "right", 14),

  // Chicanes (net 0°)
  chicane_LR: chicane("chicane_LR", 8, 22, "left", 5, 5),
  chicane_RL: chicane("chicane_RL", 8, 22, "right", 5, 5),

  // S-Sections (net 0°)
  s_section_LR: sSection("s_section_LR", 10, 35, "left", 8, 6),
  s_section_RL: sSection("s_section_RL", 10, 35, "right", 8, 6),
} as const;

/** Create a custom straight segment. */
export function customStraight(length: number, samples?: number): TrackSegment {
  const s = samples ?? Math.max(3, Math.round(length / 3));
  return straight(`straight_${length}`, length, s);
}

/** Create a custom turn segment. */
export function customTurn(
  radius: number,
  angle: number,
  direction: "left" | "right",
  samples?: number
): TrackSegment {
  const s = samples ?? Math.max(4, Math.round(angle / 8));
  return turn(`turn_${direction}_${angle}`, radius, angle, direction, s);
}

/** Create a custom chicane. */
export function customChicane(
  radius: number,
  angle: number,
  firstDir: "left" | "right",
  linkLength?: number,
  samplesPerTurn?: number
): TrackSegment {
  return chicane(
    `chicane_${firstDir}_${angle}`,
    radius,
    angle,
    firstDir,
    linkLength ?? 5,
    samplesPerTurn ?? 5
  );
}
