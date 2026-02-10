import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoDashboard } from "@/lib/demo-data";

export async function GET() {
  try {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // KPIs
  const currentMonthOrders = await prisma.order.findMany({
    where: { createdAt: { gte: currentMonthStart } },
  });
  const lastMonthOrders = await prisma.order.findMany({
    where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
  });

  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  const currentProd = await prisma.productionEntry.aggregate({
    where: { date: { gte: currentMonthStart } },
    _sum: { quantity: true },
  });
  const lastProd = await prisma.productionEntry.aggregate({
    where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
    _sum: { quantity: true },
  });
  const prodChange =
    lastProd._sum.quantity && lastProd._sum.quantity > 0
      ? (((currentProd._sum.quantity || 0) - lastProd._sum.quantity) / lastProd._sum.quantity) * 100
      : 0;

  const activeOrders = await prisma.order.count({
    where: { status: { in: ["confirmed", "in_production", "shipped"] } },
  });
  const lastActiveOrders = await prisma.order.count({
    where: {
      status: { in: ["confirmed", "in_production", "shipped"] },
      createdAt: { lte: lastMonthEnd },
    },
  });
  const ordersChange = lastActiveOrders > 0 ? ((activeOrders - lastActiveOrders) / lastActiveOrders) * 100 : 0;

  // Monthly revenue (12 months)
  const allOrders = await prisma.order.findMany({
    where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
    select: { createdAt: true, totalAmount: true },
  });

  const monthlyRevenue: { month: string; revenue: number }[] = [];
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthOrders = allOrders.filter(
      (o) => o.createdAt.getMonth() === d.getMonth() && o.createdAt.getFullYear() === d.getFullYear()
    );
    monthlyRevenue.push({
      month: monthNames[d.getMonth()],
      revenue: Math.round(monthOrders.reduce((sum, o) => sum + o.totalAmount, 0)),
    });
  }

  // Product sales breakdown
  const orderLines = await prisma.orderLine.findMany({
    where: { order: { createdAt: { gte: yearStart }, status: { not: "cancelled" } } },
    include: { product: true },
  });

  const salesByProduct: Record<string, number> = {};
  for (const line of orderLines) {
    salesByProduct[line.product.name] = (salesByProduct[line.product.name] || 0) + line.quantity * line.unitPrice;
  }

  const productColors: Record<string, string> = {
    CARUMA: "#3a9348",
    CARANI: "#b07a3b",
    "CAROB EXTRACT": "#553424",
  };

  const productSales = Object.entries(salesByProduct).map(([name, value]) => ({
    name,
    value: Math.round(value),
    color: productColors[name] || "#888",
  }));

  // Production vs Target
  const productionEntries = await prisma.productionEntry.findMany({
    where: { date: { gte: yearStart } },
  });

  const targets = [28000, 30000, 33000, 35000, 32000, 27000, 24000, 26000, 30000, 36000, 38000, 37000];
  const productionVsTarget = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEntries = productionEntries.filter(
      (e) => e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear()
    );
    productionVsTarget.push({
      month: monthNames[d.getMonth()],
      production: Math.round(monthEntries.reduce((sum, e) => sum + e.quantity, 0)),
      target: targets[11 - i],
    });
  }

  // Top clients
  const topClientsData = await prisma.order.groupBy({
    by: ["clientId"],
    where: { status: { not: "cancelled" } },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 5,
  });

  const topClients = [];
  for (const tc of topClientsData) {
    const client = await prisma.client.findUnique({ where: { id: tc.clientId } });
    if (client) {
      topClients.push({
        name: client.name,
        country: client.country,
        revenue: Math.round(tc._sum.totalAmount || 0),
      });
    }
  }

  // Recent orders
  const recentOrdersData = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { client: true, lines: { include: { product: true } } },
  });

  const recentOrders = recentOrdersData.map((o) => ({
    id: o.id,
    client: o.client.name,
    country: o.client.country,
    product: o.lines[0]?.product.name || "—",
    quantity: o.lines[0]?.quantity || 0,
    total: o.totalAmount,
    status: o.status,
    date: o.createdAt.toISOString(),
  }));

  const capacityTarget = 40000;
  const capacityRate = Math.round(((currentProd._sum.quantity || 0) / capacityTarget) * 100);

  // ── Financial KPIs ──────────────────────────────────
  // Product costs → cost map
  const productCosts = await prisma.productCost.findMany({ include: { product: true } });
  const costMap: Record<string, number> = {};
  for (const pc of productCosts) {
    costMap[pc.product.name] =
      pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost;
  }

  // Gross margin from current-month order lines
  const currentMonthLines = await prisma.orderLine.findMany({
    where: { order: { createdAt: { gte: currentMonthStart }, status: { not: "cancelled" } } },
    include: { product: true },
  });
  let totalRevLines = 0;
  let totalCost = 0;
  for (const line of currentMonthLines) {
    const lineRev = line.quantity * line.unitPrice;
    const lineCost = line.quantity * (costMap[line.product.name] || 0);
    totalRevLines += lineRev;
    totalCost += lineCost;
  }
  const grossMarginPct =
    totalRevLines > 0 ? Math.round(((totalRevLines - totalCost) / totalRevLines) * 1000) / 10 : 0;

  // Budget for current month
  const budgets = await prisma.budget.findMany({
    where: { month: now.getMonth() + 1, year: now.getFullYear() },
  });
  const budgetRevenue = budgets
    .filter((b) => b.category === "revenue")
    .reduce((sum, b) => sum + b.amount, 0);

  // Latest cash entry
  const cashEntries = await prisma.cashEntry.findMany({
    orderBy: { date: "desc" },
    take: 1,
  });
  const cashPosition = cashEntries.length > 0 ? cashEntries[0].balance : 0;

  return NextResponse.json({
    kpis: {
      monthlyRevenue: Math.round(currentRevenue),
      monthlyRevenueChange: Math.round(revenueChange * 10) / 10,
      totalProduction: Math.round(currentProd._sum.quantity || 0),
      productionChange: Math.round(prodChange * 10) / 10,
      activeOrders,
      ordersChange: Math.round(ordersChange * 10) / 10,
      capacityRate,
      grossMarginPct,
      budgetRevenue: Math.round(budgetRevenue),
      actualRevenue: Math.round(currentRevenue),
      cashPosition: Math.round(cashPosition),
    },
    monthlyRevenue,
    productSales,
    productionVsTarget,
    topClients,
    recentOrders,
  });
  } catch { return NextResponse.json(demoDashboard); }
}
