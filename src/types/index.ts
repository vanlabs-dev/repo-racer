import type { Vector3, Quaternion } from "three";

// ── App Phases ──
export type AppPhase = "loading" | "selection" | "countdown" | "racing" | "finished";

// ── Subnet Data (merged from TaoStats API) ──
export interface SubnetData {
  netuid: number;
  name: string;
  topSpeed: number; // net_flow_30_days in TAO
  acceleration: number; // net_flow_1_day in TAO
  handling: number; // net_flow_7_days in TAO
  pitstopRate: number; // mock commits/week
  color: string; // assigned neon color
  price: number;
  marketCap: number; // in TAO
  emission: number;
  fearGreedIndex: number;
  taoVolume24h: number;
  priceChange1d: number;
  priceChange1w: number;
  priceChange1m: number;
  buys24h: number;
  sells24h: number;
}

// ── Car State ──
export interface CarState {
  subnetId: number;
  progress: number; // 0-1 along curve
  speed: number;
  currentLap: number;
  isPitting: boolean;
  needsPit: boolean;
  pittingTimer: number;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion xyzw
  subnet: SubnetData;
}

// ── Race State ──
export interface RaceState {
  cars: CarState[];
  raceTime: number;
  isRunning: boolean;
  leaderboard: number[]; // subnetIds in order
}

// ── TaoStats Raw API Types ──
export interface TaoStatsSubnetRaw {
  netuid: number;
  name: string;
  emission: string;
  net_flow_1_day: string;
  net_flow_7_days: string;
  net_flow_30_days: string;
  [key: string]: unknown;
}

export interface TaoStatsPoolRaw {
  netuid: number;
  name: string;
  price: string;
  market_cap: string;
  tao_volume_24_hr: string;
  price_change_1_day: string;
  price_change_1_week: string;
  price_change_1_month: string;
  buys_24_hr: number;
  sells_24_hr: number;
  fear_and_greed_index: number;
  sentiment: string;
  [key: string]: unknown;
}

export interface TaoStatsApiResponse<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    next_page: number | null;
    prev_page: number | null;
  };
  data: T[];
}
