import { NextResponse } from "next/server";
import { fetchSubnetData } from "@/lib/api/taostats";
import { API_REVALIDATE_SECONDS } from "@/lib/constants";
export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  try {
    const subnets = await fetchSubnetData();
    return NextResponse.json(subnets, {
      headers: {
        "Cache-Control": `public, s-maxage=${API_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch subnet data";
    console.error("GET /api/subnets error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
