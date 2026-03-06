import type {
  SubnetData,
  TaoStatsApiResponse,
  TaoStatsSubnetRaw,
  TaoStatsPoolRaw,
} from "@/types";
import {
  RAO_TO_TAO,
  TAOSTATS_SUBNET_URL,
  TAOSTATS_POOL_URL,
} from "@/lib/constants";
import { getSubnetColor } from "@/lib/colors";
import { getCommitsPerWeek } from "@/data/mockGithub";

async function fetchTaoStats<T>(url: string): Promise<T[]> {
  const apiKey = process.env.TAOSTATS_API_KEY;
  if (!apiKey) {
    throw new Error("TAOSTATS_API_KEY environment variable is not set");
  }

  const response = await fetch(`${url}?limit=200`, {
    headers: { Authorization: apiKey },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `TaoStats API error: ${response.status} ${response.statusText}`
    );
  }

  const json: TaoStatsApiResponse<T> = await response.json();
  return json.data;
}

export async function fetchSubnetData(): Promise<SubnetData[]> {
  const [subnets, pools] = await Promise.all([
    fetchTaoStats<TaoStatsSubnetRaw>(TAOSTATS_SUBNET_URL),
    fetchTaoStats<TaoStatsPoolRaw>(TAOSTATS_POOL_URL),
  ]);

  const poolMap = new Map<number, TaoStatsPoolRaw>();
  for (const pool of pools) {
    poolMap.set(pool.netuid, pool);
  }

  const merged: SubnetData[] = [];
  let colorIndex = 0;

  for (const subnet of subnets) {
    const pool = poolMap.get(subnet.netuid);
    if (!pool) continue;

    const price = parseFloat(pool.price);

    // Exclude root subnet and subnets with price > 1.0 TAO
    if (subnet.netuid === 0 || price > 1.0) continue;

    merged.push({
      netuid: subnet.netuid,
      name: subnet.name,
      topSpeed: parseFloat(subnet.net_flow_30_days) * RAO_TO_TAO,
      acceleration: parseFloat(subnet.net_flow_1_day) * RAO_TO_TAO,
      handling: parseFloat(subnet.net_flow_7_days) * RAO_TO_TAO,
      pitstopRate: getCommitsPerWeek(subnet.netuid),
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
