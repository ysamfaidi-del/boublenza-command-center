import { NextRequest, NextResponse } from "next/server";
import { getCocoaPrices } from "@/lib/market-data";

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get("period") || "3m") as "1m" | "3m" | "1y";
  const data = await getCocoaPrices(period);
  return NextResponse.json({ ...data, prices: data.history });
}
