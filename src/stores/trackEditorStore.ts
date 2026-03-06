import { create } from "zustand";
import { CatmullRomCurve3 } from "three";
import {
  buildTrackPoints,
  type TrackSegment,
} from "@/lib/trackBuilder";
import { S, customTurn, customStraight } from "@/lib/trackSegments";
import { createTrackCurve, reoriginCurve } from "@/lib/track";

interface SegmentEntry {
  segmentKey: string;
  customRadius?: number;
  customAngle?: number;
  customDirection?: "left" | "right";
  customLength?: number;
}

function resolveSegment(entry: SegmentEntry): TrackSegment {
  if (entry.segmentKey === "custom_straight" && entry.customLength != null) {
    return customStraight(entry.customLength);
  }
  if (
    entry.segmentKey === "custom_turn" &&
    entry.customRadius != null &&
    entry.customAngle != null &&
    entry.customDirection != null
  ) {
    return customTurn(entry.customRadius, entry.customAngle, entry.customDirection);
  }
  const seg = S[entry.segmentKey as keyof typeof S];
  if (seg) return seg;
  return S.connector_short;
}

const TRACK_LAYOUT: SegmentEntry[] = [
  { segmentKey: "straight_long" },
  { segmentKey: "custom_straight", customLength: 20 },
  { segmentKey: "custom_turn", customRadius: 6, customAngle: 95, customDirection: "right" },
  { segmentKey: "custom_straight", customLength: 17 },
  { segmentKey: "custom_turn", customRadius: 12, customAngle: 60, customDirection: "right" },
  { segmentKey: "custom_straight", customLength: 36 },
  { segmentKey: "custom_turn", customRadius: 7, customAngle: 40, customDirection: "right" },
  { segmentKey: "custom_turn", customRadius: 5, customAngle: 55, customDirection: "right" },
  { segmentKey: "bend_right_45" },
  { segmentKey: "corner_right_90" },
  { segmentKey: "corner_left_90" },
  { segmentKey: "corner_left_90" },
  { segmentKey: "custom_turn", customRadius: 16, customAngle: 45, customDirection: "left" },
  { segmentKey: "custom_straight", customLength: 24 },
  { segmentKey: "bend_right_45" },
  { segmentKey: "bend_right_45" },
  { segmentKey: "bend_right_45" },
];

const segments = TRACK_LAYOUT.map(resolveSegment);
const { points } = buildTrackPoints(segments, 0, 0, 0);
const rawCurve = points.length >= 3 ? createTrackCurve(points) : null;
const reorigined = rawCurve ? reoriginCurve(rawCurve) : null;
const curve = reorigined?.curve ?? null;

interface TrackStore {
  points: [number, number][];
  curve: CatmullRomCurve3 | null;
}

export const useTrackEditorStore = create<TrackStore>(() => ({
  points,
  curve,
}));
