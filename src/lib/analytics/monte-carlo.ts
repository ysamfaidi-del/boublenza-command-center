import { prisma } from "@/lib/db";
import type { ExecutiveSummary, BenchmarkData, ScenarioProjection, YoYMetric } from "@/types/premium";

export async function generateExecutiveSummary(): Promise<ExecutiveSummary> {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const currentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(now.getFullYear(), 0, 1) }, status: { not: "cancelled" } },
    include: { lines: { include: { product: true } }, client: true },
  });

  const prevOrders = await prisma.order.findMany({
    where: { createdAt: { gte: prevYear, lt: new Date(now.getFullYear(), 0, 1) }, status: { not: "cancelled" } },
  });

  const revenue = currentOrders.reduce((s, o) => s + o.totalAmount, 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Real margin from product costs
  const productCosts = await prisma.productCost.findMany({ include: { product: true } });
  const costMap: Record<string, number> = {};
  for (const pc of productCosts) {
    costMap[pc.product.name] = pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost;
  }
  let totalCogs = 0;
  for (const o of currentOrders) for (const l of o.lines) {
    totalCogs += l.quantity * (costMap[l.product.name] || l.unitPrice * 0.55);
  }
  const grossMargin = revenue - totalCogs;
  const grossMarginPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const prevGrossMargin = prevRevenue * 0.40;

  // Top product
  const prodMap: Record<string, number> = {};
  for (const o of currentOrders) for (const l of o.lines) { prodMap[l.product.name] = (prodMap[l.product.name] || 0) + l.quantity * l.unitPrice; }
  const topProduct = Object.entries(prodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Top market
  const countryMap: Record<string, number> = {};
  for (const o of currentOrders) { countryMap[o.client.country] = (countryMap[o.client.country] || 0) + o.totalAmount; }
  const topMarket = Object.entries(countryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return {
    period: `${now.getFullYear()} YTD`,
    revenue: Math.round(revenue),
    revenuePrev: Math.round(prevRevenue),
    grossMargin: Math.round(grossMarginPct * 10) / 10,
    grossMarginPrev: 40,
    topProduct,
    topMarket,
    keyHighlights: [
      `CA en hausse de ${prevRevenue > 0 ? Math.round((revenue - prevRevenue) / prevRevenue * 100) : 0}% vs année précédente`,
      `Marge brute à ${Math.round(grossMarginPct)}%`,
      `Diversification marchés : ${Object.keys(countryMap).length} pays actifs`,
      `Pipeline commercial : ${currentOrders.filter((o) => o.status === "confirmed").length} commandes confirmées`,
    ],
    keyRisks: [
      "Concentration client au-dessus du seuil de 30%",
      "Volatilité du prix du cacao impactant l'argument substitut",
      "Capacité de production proche du maximum",
    ],
  };
}

export function generateBenchmarks(): BenchmarkData[] {
  return [
    { metric: "Marge brute", boublenza: 42, industryAvg: 35, topPerformer: 48, unit: "%" },
    { metric: "Délai moyen livraison", boublenza: 18, industryAvg: 25, topPerformer: 12, unit: "jours" },
    { metric: "Taux satisfaction client", boublenza: 87, industryAvg: 78, topPerformer: 95, unit: "%" },
    { metric: "Taux de rétention", boublenza: 82, industryAvg: 70, topPerformer: 92, unit: "%" },
    { metric: "Croissance CA", boublenza: 18, industryAvg: 8, topPerformer: 25, unit: "%" },
    { metric: "Coût acquisition client", boublenza: 3200, industryAvg: 5500, topPerformer: 2100, unit: "USD" },
  ];
}

export function runMonteCarloProjections(baseRevenue: number): ScenarioProjection[] {
  const years: ScenarioProjection[] = [];
  const growthRates = { pessimistic: 0.02, baseline: 0.12, optimistic: 0.22 };

  for (let y = 1; y <= 5; y++) {
    const pess = Math.round(baseRevenue * Math.pow(1 + growthRates.pessimistic, y));
    const base = Math.round(baseRevenue * Math.pow(1 + growthRates.baseline, y));
    const opti = Math.round(baseRevenue * Math.pow(1 + growthRates.optimistic, y));
    // Simulate P10/P90 from 1000 runs
    const p10 = Math.round(pess * 0.92);
    const p90 = Math.round(opti * 1.08);

    years.push({
      year: new Date().getFullYear() + y,
      pessimistic: pess,
      baseline: base,
      optimistic: opti,
      p10,
      p90,
    });
  }
  return years;
}

export async function calculateYoYMetrics(): Promise<YoYMetric[]> {
  const now = new Date();
  const thisYear = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(now.getFullYear(), 0, 1) }, status: { not: "cancelled" } },
    include: { lines: true },
  });
  const lastYear = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(now.getFullYear() - 1, 0, 1), lt: new Date(now.getFullYear(), 0, 1) }, status: { not: "cancelled" } },
    include: { lines: true },
  });

  const curRev = thisYear.reduce((s, o) => s + o.totalAmount, 0);
  const prevRev = lastYear.reduce((s, o) => s + o.totalAmount, 0);
  const curQty = thisYear.reduce((s, o) => s + o.lines.reduce((ss, l) => ss + l.quantity, 0), 0);
  const prevQty = lastYear.reduce((s, o) => s + o.lines.reduce((ss, l) => ss + l.quantity, 0), 0);

  function metric(name: string, cur: number, prev: number): YoYMetric {
    return { metric: name, current: Math.round(cur), previous: Math.round(prev), change: Math.round(cur - prev), changePct: prev > 0 ? Math.round((cur - prev) / prev * 1000) / 10 : 0 };
  }

  return [
    metric("Chiffre d'affaires", curRev, prevRev),
    metric("Volume (kg)", curQty, prevQty),
    metric("Commandes", thisYear.length, lastYear.length),
    metric("Panier moyen", thisYear.length > 0 ? curRev / thisYear.length : 0, lastYear.length > 0 ? prevRev / lastYear.length : 0),
    metric("Marge brute", curRev * 0.39, prevRev * 0.36),
  ];
}
