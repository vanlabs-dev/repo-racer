import { CatmullRomCurve3 } from "three";

const SAMPLES = 512;
const SMOOTHING_WINDOW = 12;

export interface RacingLineData {
  curvatures: Float32Array;
  maxAbsCurvature: number;
}

/**
 * Pre-compute signed curvature at evenly spaced points around the track.
 * Curvature sign: positive = left turn, negative = right turn.
 */
export function computeRacingLine(curve: CatmullRomCurve3): RacingLineData {
  // Sample heading angles
  const headings = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / SAMPLES;
    const tangent = curve.getTangentAt(t);
    headings[i] = Math.atan2(tangent.x, tangent.z);
  }

  // Raw curvature: heading change rate per unit t
  const raw = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    let dh = headings[(i + 1) % SAMPLES] - headings[i];
    // Wrap to [-PI, PI]
    while (dh > Math.PI) dh -= 2 * Math.PI;
    while (dh < -Math.PI) dh += 2 * Math.PI;
    raw[i] = dh * SAMPLES;
  }

  // Smooth curvature to remove noise
  const curvatures = new Float32Array(SAMPLES);
  let maxAbs = 0;
  for (let i = 0; i < SAMPLES; i++) {
    let sum = 0;
    for (let j = -SMOOTHING_WINDOW; j <= SMOOTHING_WINDOW; j++) {
      sum += raw[((i + j) % SAMPLES + SAMPLES) % SAMPLES];
    }
    curvatures[i] = sum / (2 * SMOOTHING_WINDOW + 1);
    maxAbs = Math.max(maxAbs, Math.abs(curvatures[i]));
  }

  return { curvatures, maxAbsCurvature: maxAbs || 1 };
}

/** Interpolated curvature at any progress value (0-1) */
export function getCurvatureAt(data: RacingLineData, t: number): number {
  const n = ((t % 1) + 1) % 1;
  const exact = n * SAMPLES;
  const a = Math.floor(exact) % SAMPLES;
  const b = (a + 1) % SAMPLES;
  const f = exact - Math.floor(exact);
  return data.curvatures[a] * (1 - f) + data.curvatures[b] * f;
}
