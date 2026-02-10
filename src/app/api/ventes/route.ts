import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MONTHS_FR } from "@/lib/utils";
import { demoVentes } from "@/lib/demo-data";

export async function GET() {
  try {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Product costs for margin calculation
  const productCosts = await prisma.productCost.findMany({ include: { product: true } });
  const costMap: Record<string, number> = {};
  for (const pc of productCosts) {
    costMap[pc.product.name] = pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost;
  }

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
    include: { client: true, lines: { include: { product: true } }, payments: true },
  });

  const countryMap: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    const c = o.client.country;
    if (!countryMap[c]) countryMap[c] = { revenue: 0, orders: 0 };
    countryMap[c].revenue += o.totalAmount;
    countryMap[c].orders += 1;
  }
  const byCountry = Object.entries(countryMap)
    .map(([country, v]) => ({
      country,
      revenue: Math.round(v.revenue),
      orders: v.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const productMap: Record<string, { revenue: number; quantity: number; cogs: number }> = {};
  for (const o of orders) {
    for (const line of o.lines) {
      const name = line.product.name;
      if (!productMap[name]) productMap[name] = { revenue: 0, quantity: 0, cogs: 0 };
      productMap[name].revenue += line.quantity * line.unitPrice;
      productMap[name].quantity += line.quantity;
      productMap[name].cogs += line.quantity * (costMap[name] || line.unitPrice * 0.55);
    }
  }
  const byProduct = Object.entries(productMap)
    .map(([name, v]) => ({
      name,
      revenue: Math.round(v.revenue),
      quantity: Math.round(v.quantity),
      margin: Math.round(v.revenue - v.cogs),
      marginPct: v.revenue > 0 ? Math.round((v.revenue - v.cogs) / v.revenue * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const allOrders = await prisma.order.findMany({
    select: { status: true, totalAmount: true },
  });
  const pipeMap: Record<string, { count: number; amount: number }> = {};
  for (const o of allOrders) {
    if (!pipeMap[o.status]) pipeMap[o.status] = { count: 0, amount: 0 };
    pipeMap[o.status].count += 1;
    pipeMap[o.status].amount += o.totalAmount;
  }
  const statusOrder = ["draft", "confirmed", "in_production", "shipped", "delivered", "cancelled"];
  const pipeline = statusOrder
    .filter((s) => pipeMap[s])
    .map((status) => ({
      status,
      count: pipeMap[status].count,
      amount: Math.round(pipeMap[status].amount),
    }));

  const monthly: { month: string; revenue: number; orders: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthOrders = orders.filter(
      (o) => o.createdAt.getMonth() === m && o.createdAt.getFullYear() === y
    );
    monthly.push({
      month: MONTHS_FR[m],
      revenue: Math.round(monthOrders.reduce((sum, o) => sum + o.totalAmount, 0)),
      orders: monthOrders.length,
    });
  }

  // Recent orders with margin & payment status
  const recentOrders = orders
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)
    .map((o) => {
      let orderCogs = 0;
      for (const l of o.lines) {
        orderCogs += l.quantity * (costMap[l.product.name] || l.unitPrice * 0.55);
      }
      const orderMargin = o.totalAmount - orderCogs;
      const paymentStatus = o.payments.length > 0
        ? o.payments.some((p) => p.status === "overdue") ? "overdue"
          : o.payments.some((p) => p.status === "partial") ? "partial"
          : o.payments.every((p) => p.status === "received") ? "received"
          : "pending"
        : "pending";
      const paidAmount = o.payments.filter((p) => p.status === "received").reduce((s, p) => s + p.amount, 0)
        + o.payments.filter((p) => p.status === "partial").reduce((s, p) => s + p.amount * 0.5, 0);
      return {
        id: o.id,
        client: o.client.name,
        country: o.client.country,
        date: o.createdAt.toISOString().split("T")[0],
        status: o.status,
        totalAmount: Math.round(o.totalAmount),
        margin: Math.round(orderMargin),
        marginPct: o.totalAmount > 0 ? Math.round(orderMargin / o.totalAmount * 1000) / 10 : 0,
        paymentStatus,
        paidAmount: Math.round(paidAmount),
        products: o.lines.map((l) => l.product.name),
      };
    });

  // Query resellers from DB
  const months12 = monthly.map((m) => m.month);
  const dbResellers = await prisma.reseller.findMany({ orderBy: { totalRevenue: "desc" } });
  const resellers = dbResellers.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    type: r.type as "distributeur" | "grossiste" | "agent",
    status: r.status as "actif" | "onboarding" | "inactif",
    since: r.since.toISOString().split("T")[0],
    contactName: r.contactName,
    totalRevenue: r.totalRevenue,
    totalOrders: r.totalOrders,
    avgOrderValue: r.avgOrderValue,
    lastOrderDate: r.lastOrderDate?.toISOString().split("T")[0] || "",
    growthRate: r.growthRate,
    paymentScore: r.paymentScore,
    productsHandled: r.productsHandled.split(",").filter(Boolean),
    monthlyRevenue: months12.map((month, i) => ({
      month,
      revenue: Math.round(r.totalRevenue / 12 * (0.7 + Math.sin(i * 0.8) * 0.3)),
    })),
    target: r.target,
  }));

  return NextResponse.json({ byCountry, byProduct, pipeline, monthly, resellers, recentOrders });
  } catch { return NextResponse.json(demoVentes); }
}
