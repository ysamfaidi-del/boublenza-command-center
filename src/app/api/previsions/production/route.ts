import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoPrevisionsProd } from "@/lib/demo-data";

export async function GET() {
  try {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const products = await prisma.product.findMany();
  const production = await prisma.productionEntry.findMany({
    where: { date: { gte: yearStart } },
    include: { product: true },
  });
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
    include: { lines: { include: { product: true } } },
  });

  const recommendations = products.map((product) => {
    // Monthly production
    const monthlyProd: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const qty = production
        .filter((p) => p.productId === product.id && p.date.getMonth() === m && p.date.getFullYear() === y)
        .reduce((s, p) => s + p.quantity, 0);
      monthlyProd.push(qty);
    }

    // Monthly demand
    const monthlyDemand: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const qty = orders
        .filter((o) => o.createdAt.getMonth() === m && o.createdAt.getFullYear() === y)
        .reduce((sum, o) => {
          return sum + o.lines.filter((l) => l.productId === product.id).reduce((s, l) => s + l.quantity, 0);
        }, 0);
      monthlyDemand.push(qty);
    }

    const avgProd = monthlyProd.slice(-3).reduce((s, v) => s + v, 0) / 3;
    const avgDemand = monthlyDemand.slice(-3).reduce((s, v) => s + v, 0) / 3;
    const ratio = avgProd > 0 ? avgDemand / avgProd : 0;

    // Capacity utilization
    const totalProd = monthlyProd.reduce((s, v) => s + v, 0);
    const maxMonthly = Math.max(...monthlyProd, 1);
    const capacityUtil = Math.round((totalProd / (maxMonthly * 12)) * 100);

    let status: "optimal" | "sous_capacite" | "sur_capacite";
    let recommendation: string;

    if (ratio > 1.15) {
      status = "sous_capacite";
      recommendation = `Augmenter la production de ${product.name} de ${Math.round((ratio - 1) * 100)}% pour répondre à la demande croissante. Envisager un passage en 2 équipes.`;
    } else if (ratio < 0.85) {
      status = "sur_capacite";
      recommendation = `Réduire la production de ${product.name} de ${Math.round((1 - ratio) * 100)}% ou diversifier les marchés export pour écouler les surplus.`;
    } else {
      status = "optimal";
      recommendation = `Maintenir le niveau actuel de production de ${product.name}. L'équilibre offre/demande est satisfaisant.`;
    }

    return {
      product: product.name,
      avgMonthlyProduction: Math.round(avgProd),
      avgMonthlyDemand: Math.round(avgDemand),
      ratio: Math.round(ratio * 100) / 100,
      capacityUtilization: capacityUtil,
      status,
      recommendation,
    };
  });

  return NextResponse.json({ recommendations });
  } catch { return NextResponse.json(demoPrevisionsProd); }
}
