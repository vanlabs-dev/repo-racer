import { CatmullRomCurve3, Vector3 } from "three";
import { TRACK_POINTS } from "./circuits";

/** Centerline points -> auto-fit to origin -> CatmullRomCurve3 (centripetal, closed). */

const TRACK_FIT = 50;

export function createTrackCurve(customPoints?: [number, number][]): CatmullRomCurve3 {
  const src = customPoints ?? TRACK_POINTS;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of src) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const maxSpan = Math.max(maxX - minX, maxZ - minZ);
  const scale = maxSpan > 0 ? (TRACK_FIT * 2) / maxSpan : 1;

  const points = src.map(
    ([x, z]) => new Vector3((x - cx) * scale, 0, (z - cz) * scale)
  );

  const curve = new CatmullRomCurve3(points, true, "centripetal", 0.5);
  curve.arcLengthDivisions = 500;
  return curve;
}

export interface StraightSection {
  tCenter: number;
  tStart: number;
  tEnd: number;
  position: Vector3;
  direction: Vector3;
  outsideDir: Vector3;
  length: number;
}

/** Find all straight sections, sorted longest first. */
export function findStraights(curve: CatmullRomCurve3): StraightSection[] {
  const SAMPLES = 300;
  const up = new Vector3(0, 1, 0);

  const headings: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / SAMPLES;
    const tang = curve.getTangentAt(t);
    headings.push(Math.atan2(tang.x, tang.z));
  }

  const curvatures: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    let dh = headings[(i + 1) % SAMPLES] - headings[i];
    while (dh > Math.PI) dh -= 2 * Math.PI;
    while (dh < -Math.PI) dh += 2 * Math.PI;
    curvatures.push(Math.abs(dh * SAMPLES));
  }

  const threshold = 4.0;
  const runs: { start: number; len: number }[] = [];
  let curStart = -1;
  let curLen = 0;

  // Double-scan to catch straights wrapping past t=1
  for (let i = 0; i < SAMPLES * 2; i++) {
    if (curvatures[i % SAMPLES] < threshold) {
      if (curLen === 0) curStart = i;
      curLen++;
    } else {
      if (curLen >= 5) {
        runs.push({ start: curStart % SAMPLES, len: Math.min(curLen, SAMPLES) });
      }
      curLen = 0;
    }
  }
  // Flush final run
  if (curLen >= 5) {
    runs.push({ start: curStart % SAMPLES, len: Math.min(curLen, SAMPLES) });
  }

  // Deduplicate overlapping runs
  const deduped: { start: number; len: number }[] = [];
  for (const run of runs) {
    const mid = (run.start + run.len / 2) % SAMPLES;
    const isDupe = deduped.some((d) => {
      const dMid = (d.start + d.len / 2) % SAMPLES;
      let diff = Math.abs(mid - dMid);
      if (diff > SAMPLES / 2) diff = SAMPLES - diff;
      return diff < run.len / 2;
    });
    if (!isDupe) deduped.push(run);
  }

  // Sort longest first
  deduped.sort((a, b) => b.len - a.len);

  const trackLength = curve.getLength();

  return deduped.map((run) => {
    const tStart = run.start / SAMPLES;
    const tEnd = (run.start + run.len) / SAMPLES;
    const tCenter = ((tStart + tEnd) / 2) % 1;

    const position = curve.getPointAt(tCenter);
    const direction = curve.getTangentAt(tCenter);

    const lateral = new Vector3().crossVectors(direction, up).normalize();
    const testA = position.clone().add(lateral.clone().multiplyScalar(5));
    const testB = position.clone().sub(lateral.clone().multiplyScalar(5));
    const outsideDir =
      testA.length() > testB.length() ? lateral.clone() : lateral.clone().negate();

    const length = (run.len / SAMPLES) * trackLength;

    return { tCenter, tStart, tEnd, position, direction, outsideDir, length };
  });
}

/** Find the longest straight. */
export function findPitStraight(curve: CatmullRomCurve3): StraightSection {
  const straights = findStraights(curve);
  if (straights.length > 0) return straights[0];

  // Fallback: return t=0 section
  const position = curve.getPointAt(0);
  const direction = curve.getTangentAt(0);
  const up = new Vector3(0, 1, 0);
  const outsideDir = new Vector3().crossVectors(direction, up).normalize();
  return { tCenter: 0, tStart: 0, tEnd: 0.1, position, direction, outsideDir, length: 10 };
}

/** Rotate curve so t=0 sits at the midpoint of the longest straight. */
export function reoriginCurve(curve: CatmullRomCurve3): { curve: CatmullRomCurve3; offset: number } {
  const pit = findPitStraight(curve);
  const SAMPLES = curve.points.length;

  // Find nearest control point to tCenter
  let bestIdx = 0;
  let bestDist = Infinity;
  const target = curve.getPointAt(pit.tCenter);
  for (let i = 0; i < SAMPLES; i++) {
    const d = curve.points[i].distanceTo(target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const offset = pit.tCenter;

  // Rotate the points array so bestIdx becomes index 0
  const rotated = [
    ...curve.points.slice(bestIdx),
    ...curve.points.slice(0, bestIdx),
  ];

  const newCurve = new CatmullRomCurve3(rotated, true, "centripetal", 0.5);
  newCurve.arcLengthDivisions = 500;
  return { curve: newCurve, offset };
}

export function getCarTransform(
  curve: CatmullRomCurve3,
  progress: number
): { position: Vector3; tangent: Vector3 } {
  const t = ((progress % 1) + 1) % 1;
  return {
    position: curve.getPointAt(t),
    tangent: curve.getTangentAt(t),
  };
}
