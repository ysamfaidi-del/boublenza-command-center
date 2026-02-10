import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateSpreadHistory, generateMarketSignals,
  generateCommodityTimeSeries, computeCorrelationMatrix,
  computeRollingCorrelations, generateCorrelationInsights,
} from "@/lib/analytics/spread-calculator";

export async function GET() {
  try {
    // Try to get real market data from DB first
    const [cocoaData, carobData] = await Promise.all([
      prisma.marketData.findMany({
        where: { instrument: "COCOA_USD" },
        orderBy: { date: "asc" },
        take: 180,
      }),
      prisma.marketData.findMany({
        where: { instrument: "CAROB_USD" },
        orderBy: { date: "asc" },
        take: 180,
      }),
    ]);

    // Use real data for spreads if available
    const hasRealData = cocoaData.length >= 30 && carobData.length >= 30;

    let spreads;
    if (hasRealData) {
      const minLen = Math.min(cocoaData.length, carobData.length);
      spreads = [];
      for (let i = 0; i < minLen; i++) {
        spreads.push({
          date: cocoaData[i].date.toISOString().split("T")[0],
          cocoa: Math.round(cocoaData[i].close),
          carob: Math.round(carobData[i].close),
          spread: Math.round(cocoaData[i].close - carobData[i].close),
        });
      }
    } else {
      spreads = generateSpreadHistory(180);
    }

    // Time series uses full 8-commodity set (still simulated for non-core commodities)
    const timeSeries = generateCommodityTimeSeries(180);

    // If we have real data, overwrite the Cacao and Caroube columns
    if (hasRealData) {
      for (let i = 0; i < Math.min(timeSeries.length, cocoaData.length); i++) {
        timeSeries[i].prices["Cacao"] = Math.round(cocoaData[i].close);
      }
      for (let i = 0; i < Math.min(timeSeries.length, carobData.length); i++) {
        timeSeries[i].prices["Caroube"] = Math.round(carobData[i].close);
      }
    }

    const correlations = computeCorrelationMatrix(timeSeries);
    const rollingCorrelations = computeRollingCorrelations(timeSeries);
    const insights = generateCorrelationInsights(correlations);
    const signals = generateMarketSignals(spreads);
    const commodityList = [...new Set(correlations.map((c) => c.x))];

    const latest = spreads[spreads.length - 1];

    // Futures data for forward curve
    const futures = await prisma.futuresContract.findMany({
      where: { symbol: "CC" },
      orderBy: { contractMonth: "asc" },
    });

    const forwardCurve = futures.map((f) => ({
      month: f.contractMonth,
      settlement: f.settlement,
      basis: Math.round((f.settlement - latest.cocoa) * 100) / 100,
      openInterest: f.openInterest,
    }));

    const fundamentals = [
      { label: "Prix cacao spot", value: `$${latest.cocoa.toLocaleString()}/t`, trend: 12 },
      { label: "Prix caroube spot", value: `$${latest.carob.toLocaleString()}/t`, trend: 3 },
      { label: "Spread actuel", value: `$${latest.spread.toLocaleString()}/t`, trend: 8 },
      { label: "Production mondiale caroube", value: "650 000 t/an", trend: 5 },
      { label: "Demande mondiale", value: "580 000 t/an", trend: 8 },
      { label: "Ratio substitution", value: "1:0.85", trend: 15 },
    ];

    return NextResponse.json({
      spreads,
      correlations,
      signals,
      fundamentals,
      timeSeries,
      rollingCorrelations,
      insights,
      commodityList,
      forwardCurve,
      dataSource: hasRealData ? "database" : "simulated",
    });
  } catch {
    // Fallback to fully simulated
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
    return NextResponse.json({ spreads, correlations, signals, fundamentals, timeSeries, rollingCorrelations, insights, commodityList, forwardCurve: [], dataSource: "simulated" });
  }
}
