import { NextResponse } from "next/server";
import {
  generateSpreadHistory, generateMarketSignals,
  generateCommodityTimeSeries, computeCorrelationMatrix,
  computeRollingCorrelations, generateCorrelationInsights,
} from "@/lib/analytics/spread-calculator";

export async function GET() {
  const spreads = generateSpreadHistory(180);
  const timeSeries = generateCommodityTimeSeries(180);
  const correlations = computeCorrelationMatrix(timeSeries);
  const rollingCorrelations = computeRollingCorrelations(timeSeries);
  const insights = generateCorrelationInsights(correlations);
  const signals = generateMarketSignals(spreads);
  const commodityList = [...new Set(correlations.map((c) => c.x))];

  const latest = spreads[spreads.length - 1];
  const fundamentals = [
    { label: "Prix cacao spot", value: `$${latest.cocoa.toLocaleString()}/t`, trend: 12 },
    { label: "Prix caroube spot", value: `$${latest.carob.toLocaleString()}/t`, trend: 3 },
    { label: "Spread actuel", value: `$${latest.spread.toLocaleString()}/t`, trend: 8 },
    { label: "Production mondiale caroube", value: "650 000 t/an", trend: 5 },
    { label: "Demande mondiale", value: "580 000 t/an", trend: 8 },
    { label: "Ratio substitution", value: "1:0.85", trend: 15 },
  ];

  return NextResponse.json({ spreads, correlations, signals, fundamentals, timeSeries, rollingCorrelations, insights, commodityList });
}
