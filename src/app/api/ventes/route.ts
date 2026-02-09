import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MONTHS_FR } from "@/lib/utils";
import { demoVentes } from "@/lib/demo-data";

export async function GET() {
  try {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
    include: { client: true, lines: { include: { product: true } } },
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

  const productMap: Record<string, { revenue: number; quantity: number }> = {};
  for (const o of orders) {
    for (const line of o.lines) {
      const name = line.product.name;
      if (!productMap[name]) productMap[name] = { revenue: 0, quantity: 0 };
      productMap[name].revenue += line.quantity * line.unitPrice;
      productMap[name].quantity += line.quantity;
    }
  }
  const byProduct = Object.entries(productMap)
    .map(([name, v]) => ({
      name,
      revenue: Math.round(v.revenue),
      quantity: Math.round(v.quantity),
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

  return NextResponse.json({ byCountry, byProduct, pipeline, monthly, resellers: [] });
  } catch { return NextResponse.json(demoVentes); }
}
