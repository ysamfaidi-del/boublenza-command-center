import { NextResponse } from "next/server";
import { generateDealPipeline, generatePricingRecommendations, generateRFQs } from "@/lib/analytics/pricing-engine";
import { calculateClientScores } from "@/lib/analytics/client-scoring";

export async function GET() {
  const [pipeline, scoring, pricing, rfqs] = await Promise.all([
    generateDealPipeline(), calculateClientScores(), generatePricingRecommendations(), generateRFQs(),
  ]);
  return NextResponse.json({ pipeline, scoring, pricing, rfqs });
}
