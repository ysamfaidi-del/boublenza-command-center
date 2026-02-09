import { prisma } from "@/lib/db";
import type { PricingRecommendation, RFQ, Deal } from "@/types/premium";

export async function generatePricingRecommendations(): Promise<PricingRecommendation[]> {
  const products = await prisma.product.findMany();
  return products.map((p) => {
    const market = p.pricePerKg * (0.9 + Math.random() * 0.3);
    const competitorLow = p.pricePerKg * 0.85;
    const competitorHigh = p.pricePerKg * 1.2;
    const recommended = p.pricePerKg * (1 + (Math.random() * 0.1 - 0.02));

    return {
      product: p.name,
      currentPrice: p.pricePerKg,
      recommendedPrice: Math.round(recommended * 100) / 100,
      marketAvg: Math.round(market * 100) / 100,
      competitorRange: [Math.round(competitorLow * 100) / 100, Math.round(competitorHigh * 100) / 100],
      confidence: Math.round(70 + Math.random() * 25),
      rationale: recommended > p.pricePerKg
        ? `Potentiel de hausse de ${Math.round((recommended / p.pricePerKg - 1) * 100)}% basé sur la demande croissante et les prix du cacao.`
        : `Ajustement mineur recommandé pour rester compétitif sur le marché européen.`,
    };
  });
}

export async function generateDealPipeline(): Promise<Deal[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["draft", "confirmed", "in_production"] } },
    include: { client: true, lines: { include: { product: true } } },
    orderBy: { totalAmount: "desc" },
  });

  const stageProb: Record<string, number> = { draft: 0.3, confirmed: 0.7, in_production: 0.9 };
  const stageLabels: Record<string, string> = { draft: "Négociation", confirmed: "Confirmé", in_production: "En production" };

  return orders.map((o) => {
    const prob = stageProb[o.status] || 0.5;
    return {
      id: o.id,
      client: o.client.name,
      country: o.client.country,
      product: o.lines[0]?.product.name || "Multi-produits",
      value: Math.round(o.totalAmount),
      probability: prob * 100,
      weightedValue: Math.round(o.totalAmount * prob),
      stage: stageLabels[o.status] || o.status,
      expectedClose: o.deliveryDate?.toISOString().split("T")[0] || "—",
    };
  });
}

export async function generateRFQs(): Promise<RFQ[]> {
  const clients = await prisma.client.findMany({ take: 6 });
  const products = await prisma.product.findMany();
  const statuses: RFQ["status"][] = ["pending", "quoted", "accepted", "rejected"];

  return clients.slice(0, 5).map((c, i) => {
    const p = products[i % products.length];
    const qty = Math.round(5000 + Math.random() * 20000);
    const reqPrice = p.pricePerKg * (0.85 + Math.random() * 0.1);
    return {
      id: `RFQ-${String(i + 1).padStart(3, "0")}`,
      client: c.name,
      product: p.name,
      quantity: qty,
      requestedPrice: Math.round(reqPrice * 100) / 100,
      date: new Date(Date.now() - i * 3 * 86400000).toISOString().split("T")[0],
      status: statuses[i % statuses.length],
      suggestedPrice: Math.round(p.pricePerKg * 0.97 * 100) / 100,
    };
  });
}
