import { NextResponse } from "next/server";
import { generateShipments, calculateLeadTimes, detectBottlenecks, generateQualityLots } from "@/lib/analytics/supply-chain";
import { demoSupplyChain } from "@/lib/demo-data";

export async function GET() {
  try {
  const [shipments, leadTimes, qualityLots] = await Promise.all([generateShipments(), calculateLeadTimes(), generateQualityLots()]);
  const bottlenecks = detectBottlenecks();
  return NextResponse.json({ shipments, leadTimes, bottlenecks, qualityLots });
  } catch { return NextResponse.json(demoSupplyChain); }
}
