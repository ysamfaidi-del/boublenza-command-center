import { NextResponse } from "next/server";
import { generateSpreadHistory, generateCorrelationMatrix, generateMarketSignals } from "@/lib/analytics/spread-calculator";

export async function GET() {
  const spreads = generateSpreadHistory(180);
  const correlations = generateCorrelationMatrix();
  const signals = generateMarketSignals(spreads);

  const latest = spreads[spreads.length - 1];
  const fundamentals = [
    { label: "Prix cacao spot", value: `$${latest.cocoa.toLocaleString()}/t`, trend: 12 },
    { label: "Prix caroube spot", value: `$${latest.carob.toLocaleString()}/t`, trend: 3 },
    { label: "Spread actuel", value: `$${latest.spread.toLocaleString()}/t`, trend: 8 },
    { label: "Production mondiale caroube", value: "650 000 t/an", trend: 5 },
    { label: "Demande mondiale", value: "580 000 t/an", trend: 8 },
    { label: "Ratio substitution", value: "1:0.85", trend: 15 },
  ];

  return NextResponse.json({ spreads, correlations, signals, fundamentals });
}
