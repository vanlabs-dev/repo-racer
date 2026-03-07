import type {
  SubnetData,
  TaoStatsApiResponse,
  TaoStatsSubnetRaw,
  TaoStatsPoolRaw,
  TaoStatsDevActivityRaw,
  TaoStatsIdentityRaw,
} from "@/types";
import {
  RAO_TO_TAO,
  API_REVALIDATE_SECONDS,
  TAOSTATS_SUBNET_URL,
  TAOSTATS_POOL_URL,
  TAOSTATS_IDENTITY_URL,
  TAOSTATS_DEV_ACTIVITY_URL,
  API_CACHE_TTL_MS,
  API_CACHE_STALE_TTL_MS,
  API_RATE_LIMIT_PER_MINUTE,
  API_RATE_LIMIT_SAFETY_MARGIN,
} from "@/lib/constants";
import { getSubnetColor } from "@/lib/colors";

// --- In-memory cache ---
interface CachedData<T> {
  data: T;
  timestamp: number;
}

let subnetCache: CachedData<SubnetData[]> | null = null;

// --- Rate tracking (sliding window) ---
const requestTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  // Prune old entries
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  return (
    requestTimestamps.length >=
    API_RATE_LIMIT_PER_MINUTE - API_RATE_LIMIT_SAFETY_MARGIN
  );
}

function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

// --- Fetch with graceful degradation ---

async function fetchTaoStats<T>(url: string): Promise<T[] | null> {
  const apiKey = process.env.TAOSTATS_API_KEY;
  if (!apiKey) {
    console.error("TAOSTATS_API_KEY environment variable is not set");
    return null;
  }

  recordRequest();

  try {
    const response = await fetch(`${url}?limit=200`, {
      headers: { Authorization: apiKey },
      next: { revalidate: API_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(
        `TaoStats API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const json: TaoStatsApiResponse<T> = await response.json();
    return json.data;
  } catch (error) {
    console.error("TaoStats fetch failed:", error);
    return null;
  }
}

// --- Merge raw API data into SubnetData ---

function mergeSubnetData(
  subnets: TaoStatsSubnetRaw[],
  pools: TaoStatsPoolRaw[],
  devActivity: TaoStatsDevActivityRaw[],
  identity: TaoStatsIdentityRaw[]
): SubnetData[] {
  const poolMap = new Map<number, TaoStatsPoolRaw>();
  for (const pool of pools) {
    poolMap.set(pool.netuid, pool);
  }

  const activityMap = new Map<number, TaoStatsDevActivityRaw>();
  for (const activity of devActivity) {
    activityMap.set(activity.netuid, activity);
  }

  const identityMap = new Map<number, TaoStatsIdentityRaw>();
  for (const id of identity) {
    identityMap.set(id.netuid, id);
  }

  const merged: SubnetData[] = [];
  let colorIndex = 0;

  for (const subnet of subnets) {
    const pool = poolMap.get(subnet.netuid);
    if (!pool) continue;

    const price = parseFloat(pool.price);
    if (subnet.netuid === 0 || price > 1.0) continue;

    const activity = activityMap.get(subnet.netuid);
    const hasGithub = activity !== undefined;
    const pitstopRate = hasGithub
      ? activity.commits_7d
      : ((subnet.netuid * 2654435761) >>> 0) % 61 + 10;

    const idEntry = identityMap.get(subnet.netuid);
    const name = idEntry?.subnet_name ?? `SN${subnet.netuid}`;

    merged.push({
      netuid: subnet.netuid,
      name,
      topSpeed: parseFloat(subnet.net_flow_30_days) * RAO_TO_TAO,
      acceleration: parseFloat(subnet.net_flow_1_day) * RAO_TO_TAO,
      handling: parseFloat(subnet.net_flow_7_days) * RAO_TO_TAO,
      pitstopRate,
      hasGithub,
      color: getSubnetColor(colorIndex++),
      price,
      marketCap: parseFloat(pool.market_cap) * RAO_TO_TAO,
      emission: parseFloat(subnet.emission),
      fearGreedIndex: pool.fear_and_greed_index,
      taoVolume24h: parseFloat(pool.tao_volume_24_hr) * RAO_TO_TAO,
      priceChange1d: parseFloat(pool.price_change_1_day),
      priceChange1w: parseFloat(pool.price_change_1_week),
      priceChange1m: parseFloat(pool.price_change_1_month),
      buys24h: pool.buys_24_hr,
      sells24h: pool.sells_24_hr,
    });
  }

  return merged;
}

// --- Main entry point with cache-first logic ---

export async function fetchSubnetData(): Promise<SubnetData[]> {
  const now = Date.now();

  // 1. Fresh cache — return immediately, no API call
  if (subnetCache && now - subnetCache.timestamp < API_CACHE_TTL_MS) {
    return subnetCache.data;
  }

  // 2. Rate limited — return stale cache if available
  if (isRateLimited()) {
    if (subnetCache) {
      console.warn("Rate limit approaching — serving stale cache");
      return subnetCache.data;
    }
    throw new Error("Rate limited with no cached data available");
  }

  // 3. Attempt fresh fetch
  const [subnets, pools, devActivity, identity] = await Promise.all([
    fetchTaoStats<TaoStatsSubnetRaw>(TAOSTATS_SUBNET_URL),
    fetchTaoStats<TaoStatsPoolRaw>(TAOSTATS_POOL_URL),
    fetchTaoStats<TaoStatsDevActivityRaw>(TAOSTATS_DEV_ACTIVITY_URL),
    fetchTaoStats<TaoStatsIdentityRaw>(TAOSTATS_IDENTITY_URL),
  ]);

  // 4. Fetch failed — fall back to stale cache within stale TTL (subnets/pools required, devActivity optional)
  if (!subnets || !pools) {
    if (
      subnetCache &&
      now - subnetCache.timestamp < API_CACHE_STALE_TTL_MS
    ) {
      console.warn("API fetch failed — serving stale cache");
      return subnetCache.data;
    }
    throw new Error("TaoStats API unavailable and no valid cache");
  }

  // 5. Success — merge, cache, return
  const merged = mergeSubnetData(subnets, pools, devActivity ?? [], identity ?? []);
  subnetCache = { data: merged, timestamp: now };
  return merged;
}
