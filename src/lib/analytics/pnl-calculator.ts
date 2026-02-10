import { prisma } from "@/lib/db";
import type { PnLBreakdown, CurrencyExposure } from "@/types/premium";

export async function calculatePnL(start: Date, end: Date): Promise<PnLBreakdown[]> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "cancelled" } },
    include: { lines: { include: { product: true } } },
  });

  // Query real product costs from DB
  const productCosts = await prisma.productCost.findMany({ include: { product: true } });
  const costPerKgMap: Record<string, number> = {};
  for (const pc of productCosts) {
    costPerKgMap[pc.product.name] = pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost;
  }

  const map: Record<string, PnLBreakdown> = {};

  for (const order of orders) {
    for (const line of order.lines) {
      const name = line.product.name;
      const revenue = line.quantity * line.unitPrice;
      // Use real cost per kg if available, fall back to 58% estimate
      const unitCost = costPerKgMap[name];
      const cogs = unitCost != null ? line.quantity * unitCost : revenue * 0.58;
      const gross = revenue - cogs;
      const opex = revenue * 0.15;
      const ebitda = gross - opex;
      const net = ebitda * 0.85;

      if (!map[name]) {
        map[name] = { product: name, revenue: 0, costOfGoods: 0, grossMargin: 0, grossMarginPct: 0, netMargin: 0, ebitda: 0 };
      }
      map[name].revenue += revenue;
      map[name].costOfGoods += cogs;
      map[name].grossMargin += gross;
      map[name].ebitda += ebitda;
      map[name].netMargin += net;
    }
  }

  return Object.values(map).map((p) => ({
    ...p,
    revenue: Math.round(p.revenue),
    costOfGoods: Math.round(p.costOfGoods),
    grossMargin: Math.round(p.grossMargin),
    grossMarginPct: p.revenue > 0 ? Math.round((p.grossMargin / p.revenue) * 1000) / 10 : 0,
    netMargin: Math.round(p.netMargin),
    ebitda: Math.round(p.ebitda),
  }));
}

export async function calculateCurrencyExposure(): Promise<CurrencyExposure[]> {
  const open = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "in_production", "shipped"] } },
  });

  const map: Record<string, { total: number; orders: number }> = {};
  for (const o of open) {
    const c = o.currency;
    if (!map[c]) map[c] = { total: 0, orders: 0 };
    map[c].total += o.totalAmount;
    map[c].orders += 1;
  }

  const grand = Object.values(map).reduce((s, v) => s + v.total, 0);
  return Object.entries(map).map(([currency, d]) => ({
    currency,
    total: Math.round(d.total),
    pct: grand > 0 ? Math.round((d.total / grand) * 1000) / 10 : 0,
    orders: d.orders,
  }));
}
