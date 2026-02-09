import { NextResponse } from "next/server";
import { calculateVaR, generateStressScenarios, generateHedgeScenarios, calculateCounterpartyRisk } from "@/lib/analytics/var-calculator";

export async function GET() {
  const [varResult, counterparties] = await Promise.all([calculateVaR(), calculateCounterpartyRisk()]);
  const stressScenarios = generateStressScenarios();
  const hedgeScenarios = generateHedgeScenarios();
  return NextResponse.json({ var: varResult, stressScenarios, hedgeScenarios, counterparties });
}
