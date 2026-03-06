// --- Track ---
export const TRACK_RADIUS = 50;
export const TRACK_POINTS = 10;
export const TRACK_WIDTH = 6;
export const BARRIER_HEIGHT = 1.2;
export const GANTRY_COUNT = 4;

// --- Race pacing ---
export const MIN_SUBNETS = 2;
export const MAX_SUBNETS = 8;
export const BASE_SPEED = 0.08;
export const SPEED_MULTIPLIER = 0.05;
export const PITSTOP_DURATION = 1.0;
export const PITSTOP_LAP_INTERVAL = 2;

/** Lap count scales with racer count. */
export function getLapCount(racerCount: number): number {
  return racerCount + 1;
}

// --- Conversion ---
export const RAO_TO_TAO = 1e-9;

// --- Post-processing ---
export const BLOOM_INTENSITY = 0.35;
export const BLOOM_LUMINANCE_THRESHOLD = 0.8;
export const NOISE_OPACITY = 0.025;
export const VIGNETTE_DARKNESS = 0.35;
export const PIXELATION_GRANULARITY = 2;

// --- Environment ---
export const FOG_NEAR = 200;
export const FOG_FAR = 400;
export const AMBIENT_INTENSITY = 0.4;

// --- API ---
export const API_REVALIDATE_SECONDS = 300;
export const TAOSTATS_SUBNET_URL =
  "https://api.taostats.io/api/subnet/latest/v1";
export const TAOSTATS_POOL_URL =
  "https://api.taostats.io/api/dtao/pool/latest/v1";

// --- API caching & rate limiting ---
export const API_CACHE_TTL_MS = 5 * 60 * 1000;
export const API_CACHE_STALE_TTL_MS = 60 * 60 * 1000;
export const API_RATE_LIMIT_PER_MINUTE = 60;
export const API_RATE_LIMIT_SAFETY_MARGIN = 10;
