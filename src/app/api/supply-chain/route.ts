import { NextResponse } from "next/server";
import { generateShipments, calculateLeadTimes, detectBottlenecks, generateQualityLots } from "@/lib/analytics/supply-chain";

export async function GET() {
  const [shipments, leadTimes, qualityLots] = await Promise.all([generateShipments(), calculateLeadTimes(), generateQualityLots()]);
  const bottlenecks = detectBottlenecks();
  return NextResponse.json({ shipments, leadTimes, bottlenecks, qualityLots });
}
