import { prisma } from "@/lib/db";
import type { ClientScore } from "@/types/premium";

export async function calculateClientScores(): Promise<ClientScore[]> {
  const clients = await prisma.client.findMany({
    include: { orders: { include: { lines: true } } },
  });

  return clients.map((c) => {
    const validOrders = c.orders.filter((o) => o.status !== "cancelled");
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const orderCount = validOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // LTV = avg order value × order frequency × expected lifespan
    const monthsActive = Math.max(1, orderCount > 1
      ? Math.ceil((new Date().getTime() - validOrders[validOrders.length - 1].createdAt.getTime()) / (30 * 86400000))
      : 6);
    const orderFrequency = orderCount / monthsActive;
    const ltv = Math.round(avgOrderValue * orderFrequency * 36);

    // Churn risk: lower if recent orders, higher if dormant
    const lastOrder = validOrders[0]?.createdAt;
    const daysSince = lastOrder ? Math.floor((Date.now() - lastOrder.getTime()) / 86400000) : 999;
    const churnRisk = Math.min(100, Math.max(5, Math.round(daysSince / 3)));

    // Upsell: based on product diversity and order growth
    const products = new Set(validOrders.flatMap((o) => o.lines.map((l) => l.productId)));
    const upsellPotential = Math.min(100, Math.round((3 - products.size) * 30 + Math.random() * 20));

    const overallScore = Math.round(ltv / 1000 * 0.4 + (100 - churnRisk) * 0.3 + upsellPotential * 0.3);
    const tier = overallScore >= 75 ? "platinum" as const : overallScore >= 55 ? "gold" as const : overallScore >= 35 ? "silver" as const : "bronze" as const;

    return {
      clientId: c.id,
      client: c.name,
      country: c.country,
      ltv,
      churnRisk,
      upsellPotential,
      overallScore: Math.min(100, overallScore),
      tier,
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
}
