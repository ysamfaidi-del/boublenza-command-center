import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const products = await prisma.product.findMany();

  // Calculate current stock per product
  const current = [];
  for (const product of products) {
    const stockIn = await prisma.stockEntry.aggregate({
      where: { productId: product.id, type: "in" },
      _sum: { quantity: true },
    });
    const stockOut = await prisma.stockEntry.aggregate({
      where: { productId: product.id, type: "out" },
      _sum: { quantity: true },
    });
    const qty = (stockIn._sum.quantity || 0) - (stockOut._sum.quantity || 0);
    const minThreshold = product.name === "CARUMA" ? 15000 : product.name === "CARANI" ? 5000 : 2000;
    current.push({
      product: product.name,
      quantity: Math.round(qty),
      minThreshold,
      status: qty < minThreshold ? "critical" : qty < minThreshold * 1.5 ? "warning" : "ok",
    });
  }

  // Recent movements (last 20)
  const recentMovements = await prisma.stockEntry.findMany({
    take: 20,
    orderBy: { date: "desc" },
    include: { product: true },
  });

  const movements = recentMovements.map((m) => ({
    date: m.date.toISOString(),
    product: m.product.name,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason || "—",
  }));

  // Stock trends (monthly)
  const allEntries = await prisma.stockEntry.findMany({
    where: { date: { gte: yearStart } },
    include: { product: true },
    orderBy: { date: "asc" },
  });

  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const trends: { month: string; CARUMA: number; CARANI: number; "CAROB EXTRACT": number }[] = [];

  // Running totals per product
  const runningStock: Record<string, number> = {};
  for (const p of products) {
    // Get stock before yearStart
    const beforeIn = await prisma.stockEntry.aggregate({
      where: { productId: p.id, type: "in", date: { lt: yearStart } },
      _sum: { quantity: true },
    });
    const beforeOut = await prisma.stockEntry.aggregate({
      where: { productId: p.id, type: "out", date: { lt: yearStart } },
      _sum: { quantity: true },
    });
    runningStock[p.name] = (beforeIn._sum.quantity || 0) - (beforeOut._sum.quantity || 0);
  }

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    for (const p of products) {
      const monthEntries = allEntries.filter(
        (e) =>
          e.product.name === p.name &&
          e.date >= d &&
          e.date < nextMonth
      );
      for (const entry of monthEntries) {
        if (entry.type === "in") {
          runningStock[p.name] += entry.quantity;
        } else {
          runningStock[p.name] -= entry.quantity;
        }
      }
    }

    trends.push({
      month: monthNames[d.getMonth()],
      CARUMA: Math.round(Math.max(0, runningStock["CARUMA"] || 0)),
      CARANI: Math.round(Math.max(0, runningStock["CARANI"] || 0)),
      "CAROB EXTRACT": Math.round(Math.max(0, runningStock["CAROB EXTRACT"] || 0)),
    });
  }

  return NextResponse.json({ current, movements, trends });
}
