import { NextResponse } from "next/server";
import { generateDealPipeline, generatePricingRecommendations, generateRFQs } from "@/lib/analytics/pricing-engine";
import { calculateClientScores } from "@/lib/analytics/client-scoring";
import { demoCommercial } from "@/lib/demo-data";

export async function GET() {
  try {
  const [pipeline, scoring, pricing, rfqs] = await Promise.all([
    generateDealPipeline(), calculateClientScores(), generatePricingRecommendations(), generateRFQs(),
  ]);
  return NextResponse.json({ pipeline, scoring, pricing, rfqs });
  } catch { return NextResponse.json(demoCommercial); }
}
