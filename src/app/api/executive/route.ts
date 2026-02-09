import { NextResponse } from "next/server";
import { generateExecutiveSummary, generateBenchmarks, runMonteCarloProjections, calculateYoYMetrics } from "@/lib/analytics/monte-carlo";
import { demoExecutive } from "@/lib/demo-data";

export async function GET() {
  try {
  const [summary, yoy] = await Promise.all([generateExecutiveSummary(), calculateYoYMetrics()]);
  const benchmarks = generateBenchmarks();
  const scenarios = runMonteCarloProjections(summary.revenue || 500000);
  return NextResponse.json({ summary, benchmarks, scenarios, yoy });
  } catch { return NextResponse.json(demoExecutive); }
}
