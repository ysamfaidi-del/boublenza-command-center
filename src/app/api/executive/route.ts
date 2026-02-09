import { NextResponse } from "next/server";
import { generateExecutiveSummary, generateBenchmarks, runMonteCarloProjections, calculateYoYMetrics } from "@/lib/analytics/monte-carlo";

export async function GET() {
  const [summary, yoy] = await Promise.all([generateExecutiveSummary(), calculateYoYMetrics()]);
  const benchmarks = generateBenchmarks();
  const scenarios = runMonteCarloProjections(summary.revenue || 500000);
  return NextResponse.json({ summary, benchmarks, scenarios, yoy });
}
