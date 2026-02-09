import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePnL, calculateCurrencyExposure } from "@/lib/analytics/pnl-calculator";
import { generateAlerts } from "@/lib/analytics/alerts-engine";
import { demoWarRoom } from "@/lib/demo-data";
import type { WarRoomData, ExportFlow, OpenPosition } from "@/types/premium";

const CITY_COORDS: Record<string, [number, number]> = {
  Spain: [40.42, -3.70], Italy: [41.90, 12.50], Germany: [52.52, 13.41],
  France: [48.86, 2.35], USA: [40.71, -74.01], Japan: [35.68, 139.65],
  "South Korea": [37.57, 126.98], Turkey: [41.01, 28.98], UK: [51.51, -0.13],
  Brazil: [-23.55, -46.63], China: [31.23, 121.47], Canada: [45.50, -73.57],
};
const TLEMCEN: [number, number] = [34.89, -1.32];

export async function GET() {
  try {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [pnl, prevPnl, currencies, alerts] = await Promise.all([
    calculatePnL(monthStart, now),
    calculatePnL(lastMonthStart, monthStart),
    calculateCurrencyExposure(),
    generateAlerts(),
  ]);

  const rev = pnl.reduce((s, p) => s + p.revenue, 0);
  const prevRev = prevPnl.reduce((s, p) => s + p.revenue, 0);
  const gm = pnl.reduce((s, p) => s + p.grossMargin, 0);
  const nm = pnl.reduce((s, p) => s + p.netMargin, 0);
  const ebitda = pnl.reduce((s, p) => s + p.ebitda, 0);
  const trend = prevRev > 0 ? Math.round((rev - prevRev) / prevRev * 100) : 0;

  // Open positions
  const openOrders = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "in_production", "shipped"] } },
    include: { client: true, lines: { include: { product: true } } },
    orderBy: { totalAmount: "desc" },
  });

  const positions: OpenPosition[] = openOrders.map((o) => ({
    orderId: o.id.slice(-6).toUpperCase(),
    client: o.client.name,
    country: o.client.country,
    product: o.lines[0]?.product.name || "Multi",
    quantity: Math.round(o.lines.reduce((s, l) => s + l.quantity, 0)),
    value: Math.round(o.totalAmount),
    currency: o.currency,
    status: o.status,
    deliveryDate: o.deliveryDate?.toISOString().split("T")[0] || "—",
    daysUntilDelivery: o.deliveryDate ? Math.floor((o.deliveryDate.getTime() - now.getTime()) / 86400000) : 0,
  }));

  // Export flows
  const flowMap: Record<string, { value: number; orders: number }> = {};
  for (const o of openOrders) {
    const c = o.client.country;
    if (!flowMap[c]) flowMap[c] = { value: 0, orders: 0 };
    flowMap[c].value += o.totalAmount;
    flowMap[c].orders += 1;
  }
  const flows: ExportFlow[] = Object.entries(flowMap)
    .filter(([c]) => CITY_COORDS[c])
    .map(([c, d]) => ({
      from: TLEMCEN,
      to: CITY_COORDS[c],
      toLabel: c,
      value: Math.round(d.value),
      orders: d.orders,
    }));

  const kpis: WarRoomData["kpis"] = {
    revenue: { label: "Chiffre d'affaires", value: rev, currency: "USD", trend, severity: "normal" },
    grossMargin: { label: "Marge brute", value: gm, trend: 0, severity: "normal" },
    netMargin: { label: "Marge nette", value: nm, trend: 0, severity: nm < 0 ? "critical" : "normal" },
    ebitda: { label: "EBITDA", value: ebitda, trend: 0, severity: "normal" },
    openPositions: { label: "Positions ouvertes", value: positions.length, trend: 0, severity: positions.length > 20 ? "warning" : "normal" },
    cash: { label: "Trésorerie", value: 450000, currency: "USD", trend: 5, severity: "normal" },
  };

  const data: WarRoomData = { kpis, pnl, positions, currencies, alerts, flows, lastUpdate: now.toISOString() };
  return NextResponse.json(data);
  } catch { return NextResponse.json(demoWarRoom); }
}
