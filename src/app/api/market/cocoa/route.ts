import { NextRequest, NextResponse } from "next/server";
import { fetchRealCocoaPrices } from "@/lib/market-data-real";

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get("period") || "3m") as "1m" | "3m" | "1y";
  const data = await fetchRealCocoaPrices(period);
  return NextResponse.json({ ...data, prices: data.history });
}
