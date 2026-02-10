import { NextResponse } from "next/server";
import { calculateVaR, generateStressScenarios, generateHedgeScenarios, calculateCounterpartyRisk } from "@/lib/analytics/var-calculator";
import { demoRisk } from "@/lib/demo-data";

export async function GET() {
  try {
  const [varResult, counterparties, stressScenarios, hedgeScenarios] = await Promise.all([
    calculateVaR(),
    calculateCounterpartyRisk(),
    generateStressScenarios(),
    generateHedgeScenarios(),
  ]);
  return NextResponse.json({ var: varResult, stressScenarios, hedgeScenarios, counterparties });
  } catch { return NextResponse.json(demoRisk); }
}
