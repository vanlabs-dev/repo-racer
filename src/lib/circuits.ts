/**
 * Track layout definition. Compose by listing segments from the library (S).
 *
 * Closure rule: for a clockwise track, right turns - left turns = 360°.
 * Chicanes/S-sections are net 0°. CatmullRom (closed=true) bridges small gaps.
 */

import { buildTrackPoints, type TrackSegment } from "./trackBuilder";
import { S, customTurn, customStraight } from "./trackSegments";

// --- Track layout ---

const TRACK_LAYOUT: TrackSegment[] = [
  S.straight_long,
  customTurn(6, 95, "right"),
  customStraight(20),
  customTurn(12, 60, "right"),
  customStraight(35),
  S.bend_right_45,
  S.chicane_LR,
  S.connector_short,
  customTurn(10, 75, "right"),
  customStraight(20),
  S.bend_right_45,
  S.connector_short,
  customTurn(10, 40, "right"),
];

// --- Build & export ---

const { points } = buildTrackPoints(TRACK_LAYOUT, 0, 0, 0);

export const TRACK_POINTS: [number, number][] = points;
