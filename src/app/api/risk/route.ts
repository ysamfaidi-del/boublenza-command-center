import { NextResponse } from "next/server";
import { calculateVaR, generateStressScenarios, generateHedgeScenarios, calculateCounterpartyRisk } from "@/lib/analytics/var-calculator";
import { demoRisk } from "@/lib/demo-data";

export async function GET() {
  try {
  const [varResult, counterparties] = await Promise.all([calculateVaR(), calculateCounterpartyRisk()]);
  const stressScenarios = generateStressScenarios();
  const hedgeScenarios = generateHedgeScenarios();
  return NextResponse.json({ var: varResult, stressScenarios, hedgeScenarios, counterparties });
  } catch { return NextResponse.json(demoRisk); }
}
