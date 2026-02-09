import { NextResponse } from "next/server";
import { getMarketTrends, getCarobVsCacaoComparison } from "@/lib/market-data";

export async function GET() {
  const raw = getCarobVsCacaoComparison();

  const comparison = [
    { metric: "Prix / tonne", cacao: `$${raw.cacaoPricePerTonne.toLocaleString()}`, caroube: `$${raw.carobPricePerTonne.toLocaleString()}` },
    { metric: "Caféine", cacao: "Contient", caroube: "0% — Sans caféine" },
    { metric: "Sucre naturel", cacao: "Amer (ajout sucre)", caroube: "Naturellement sucré" },
    { metric: "Gluten", cacao: "Variable", caroube: "Sans gluten certifié" },
    { metric: "Fibres", cacao: "Modéré", caroube: "Très riche (40%)" },
    { metric: "Impact eau", cacao: "17 000 L/kg", caroube: "< 2 000 L/kg" },
    { metric: "Économie", cacao: "Référence", caroube: `−${raw.savingsPercent}% vs cacao` },
  ];

  return NextResponse.json({
    trends: getMarketTrends(),
    comparison,
  });
}
