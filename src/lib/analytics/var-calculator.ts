import { prisma } from "@/lib/db";
import type { VaRResult, StressScenario, HedgeScenario, CounterpartyScore } from "@/types/premium";

export async function calculateVaR(): Promise<VaRResult> {
  const open = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "in_production", "shipped"] } },
  });

  const totalExposure = open.reduce((s, o) => s + o.totalAmount, 0);
  const fxExposure = totalExposure * 0.6;
  const commodityExposure = totalExposure * 0.3;
  const creditExposure = totalExposure * 0.1;

  return {
    var95: Math.round(totalExposure * 0.05),
    var99: Math.round(totalExposure * 0.08),
    expectedShortfall: Math.round(totalExposure * 0.12),
    exposureByType: [
      { type: "Risque de change", amount: Math.round(fxExposure), pct: 60 },
      { type: "Risque matières", amount: Math.round(commodityExposure), pct: 30 },
      { type: "Risque crédit", amount: Math.round(creditExposure), pct: 10 },
    ],
  };
}

export function generateStressScenarios(): StressScenario[] {
  return [
    { name: "Cacao à $12 000/t", cocoaChange: 35, fxChange: 0, impactRevenue: 15, impactMargin: 8, riskLevel: "medium" },
    { name: "Cacao à $15 000/t", cocoaChange: 70, fxChange: 0, impactRevenue: 28, impactMargin: 18, riskLevel: "high" },
    { name: "EUR/USD à 1.20", cocoaChange: 0, fxChange: -10, impactRevenue: -8, impactMargin: -5, riskLevel: "medium" },
    { name: "Crise combinée", cocoaChange: 50, fxChange: -15, impactRevenue: 12, impactMargin: -3, riskLevel: "critical" },
    { name: "Récession EU", cocoaChange: -20, fxChange: -5, impactRevenue: -18, impactMargin: -12, riskLevel: "high" },
    { name: "Scénario favorable", cocoaChange: 40, fxChange: 5, impactRevenue: 25, impactMargin: 15, riskLevel: "low" },
  ];
}

export function generateHedgeScenarios(): HedgeScenario[] {
  return [
    { strategy: "Forward EUR/USD 6 mois", cost: 12000, protection: 85, netBenefit: 45000, recommendation: true },
    { strategy: "Option put cacao 3 mois", cost: 8500, protection: 70, netBenefit: 28000, recommendation: false },
    { strategy: "Natural hedge (achats EUR)", cost: 0, protection: 40, netBenefit: 18000, recommendation: true },
    { strategy: "Swap de devises 12 mois", cost: 25000, protection: 95, netBenefit: 62000, recommendation: false },
  ];
}

export async function calculateCounterpartyRisk(): Promise<CounterpartyScore[]> {
  const clients = await prisma.client.findMany({
    include: {
      orders: { where: { status: { not: "cancelled" } }, orderBy: { createdAt: "desc" } },
    },
  });

  return clients.map((c) => {
    const totalOrders = c.orders.length;
    const totalValue = c.orders.reduce((s, o) => s + o.totalAmount, 0);
    const delivered = c.orders.filter((o) => o.status === "delivered").length;
    const paymentScore = totalOrders > 0 ? Math.min(100, Math.round((delivered / totalOrders) * 100 + Math.random() * 10)) : 50;
    const volumeScore = Math.min(100, Math.round((totalValue / 50000) * 50 + Math.random() * 20));

    const avg = (paymentScore + volumeScore) / 2;
    const rating = avg >= 80 ? "A" as const : avg >= 60 ? "B" as const : avg >= 40 ? "C" as const : "D" as const;

    return {
      clientId: c.id,
      client: c.name,
      country: c.country,
      paymentScore,
      volumeScore,
      riskRating: rating,
      totalExposure: Math.round(c.orders.filter((o) => o.status !== "delivered").reduce((s, o) => s + o.totalAmount, 0)),
      avgPaymentDays: Math.round(15 + Math.random() * 45),
    };
  }).sort((a, b) => b.totalExposure - a.totalExposure);
}
