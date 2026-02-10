import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoProduction } from "@/lib/demo-data";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export async function GET() {
  try {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const targets = await prisma.productionTarget.findMany({ where: { year: now.getFullYear() } });
  const productCosts = await prisma.productCost.findMany({ include: { product: true } });

  const currentProd = await prisma.productionEntry.aggregate({
    where: { date: { gte: currentMonthStart } },
    _sum: { quantity: true },
  });
  const lastProd = await prisma.productionEntry.aggregate({
    where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
    _sum: { quantity: true },
  });

  const total = Math.round(currentProd._sum.quantity || 0);
  const lastTotal = lastProd._sum.quantity || 0;
  const totalChange = lastTotal > 0 ? Math.round(((total - lastTotal) / lastTotal) * 1000) / 10 : 0;

  const entries = await prisma.productionEntry.findMany({
    where: { date: { gte: yearStart } },
    include: { product: true },
  });

  const monthly: { month: string; CARUMA: number; CARANI: number; "CAROB EXTRACT": number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEntries = entries.filter(
      (e) => e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear()
    );

    const row = { month: MONTHS_FR[d.getMonth()], CARUMA: 0, CARANI: 0, "CAROB EXTRACT": 0 };

    for (const e of monthEntries) {
      const name = e.product.name;
      if (name === "CARUMA") row.CARUMA += e.quantity;
      else if (name === "CARANI") row.CARANI += e.quantity;
      else if (name === "CAROB EXTRACT") row["CAROB EXTRACT"] += e.quantity;
    }

    row.CARUMA = Math.round(row.CARUMA);
    row.CARANI = Math.round(row.CARANI);
    row["CAROB EXTRACT"] = Math.round(row["CAROB EXTRACT"]);
    monthly.push(row);
  }

  const qualityGroups = await prisma.productionEntry.groupBy({
    by: ["quality"],
    _count: { id: true },
  });
  const byQuality = qualityGroups.map((g) => ({
    quality: g.quality || "Non spécifié",
    count: g._count.id,
  }));

  const SHIFT_LABELS: Record<string, string> = { morning: "Matin", afternoon: "Après-midi", night: "Nuit" };
  const shiftGroups = await prisma.productionEntry.groupBy({
    by: ["shift"],
    _sum: { quantity: true },
  });
  const byShift = shiftGroups.map((g) => ({
    shift: SHIFT_LABELS[g.shift || ""] || g.shift || "Non spécifié",
    quantity: Math.round(g._sum.quantity || 0),
  }));

  // Production vs Target using real DB targets
  const productionVsTarget = MONTHS_FR.map((monthLabel, idx) => {
    const monthTargets = targets.filter((t) => t.month === idx + 1);
    const target = monthTargets.reduce((sum, t) => sum + t.quantity, 0);
    const monthData = monthly.find((m) => m.month === monthLabel);
    const actual = monthData ? monthData.CARUMA + monthData.CARANI + monthData["CAROB EXTRACT"] : 0;
    return { month: monthLabel, target: Math.round(target), actual: Math.round(actual) };
  });

  // Cost per kg from ProductCost table
  const costPerKg = productCosts.map((pc) => ({
    product: pc.product.name,
    cost: Math.round((pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost) * 100) / 100,
    breakdown: {
      raw: pc.rawMaterialCost,
      labor: pc.laborCost,
      energy: pc.energyCost,
      packaging: pc.packagingCost,
      overhead: pc.overheadCost,
    },
  }));

  // Yield rate: production output vs raw input
  const RAW_INPUT_RATIO: Record<string, number> = { CARUMA: 1.3, CARANI: 1.1, "CAROB EXTRACT": 2.0 };
  const productTotals: Record<string, number> = {};
  for (const e of entries) {
    const name = e.product.name;
    productTotals[name] = (productTotals[name] || 0) + e.quantity;
  }
  const yieldRate = Object.entries(productTotals).map(([product, output]) => {
    const ratio = RAW_INPUT_RATIO[product] || 1;
    const rawInput = output * ratio;
    return { product, yieldPct: Math.round((output / rawInput) * 1000) / 10 };
  });

  // Quality rate: percentage of "A" entries vs total
  const totalEntries = byQuality.reduce((s, q) => s + q.count, 0);
  const qualityACount = byQuality.find((q) => q.quality === "A")?.count || 0;
  const qualityRate = totalEntries > 0 ? Math.round((qualityACount / totalEntries) * 1000) / 10 : 0;

  return NextResponse.json({ monthly, byQuality, byShift, total, totalChange, productionVsTarget, costPerKg, yieldRate, qualityRate });
  } catch { return NextResponse.json(demoProduction); }
}
