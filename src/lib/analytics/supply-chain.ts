import { prisma } from "@/lib/db";
import type { Shipment, LeadTimeData, Bottleneck, QualityLot } from "@/types/premium";

export async function generateShipments(): Promise<Shipment[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "in_production", "shipped", "delivered"] } },
    include: { client: true, lines: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const statusMap: Record<string, Shipment["status"]> = {
    confirmed: "preparing",
    in_production: "preparing",
    shipped: "in_transit",
    delivered: "delivered",
  };

  return orders.map((o, i) => {
    const status = statusMap[o.status] || "preparing";
    const departure = new Date(o.createdAt);
    departure.setDate(departure.getDate() + 5);
    const eta = new Date(departure);
    eta.setDate(eta.getDate() + 12 + Math.floor(Math.random() * 10));
    const daysRemaining = Math.max(0, Math.floor((eta.getTime() - Date.now()) / 86400000));

    // Some are delayed
    const isDelayed = i % 5 === 3;
    return {
      id: `SHP-${String(i + 1).padStart(4, "0")}`,
      client: o.client.name,
      destination: o.client.country,
      product: o.lines[0]?.product.name || "Multi",
      quantity: Math.round(o.lines.reduce((s, l) => s + l.quantity, 0)),
      status: isDelayed && status === "in_transit" ? "delayed" : status,
      departureDate: departure.toISOString().split("T")[0],
      eta: eta.toISOString().split("T")[0],
      daysRemaining: isDelayed ? daysRemaining + 5 : daysRemaining,
    };
  });
}

export async function calculateLeadTimes(): Promise<LeadTimeData[]> {
  const orders = await prisma.order.findMany({
    where: { status: "delivered" },
    include: { client: true },
  });

  const byCountry: Record<string, number[]> = {};
  for (const o of orders) {
    if (!o.deliveryDate) continue;
    const days = Math.floor((o.deliveryDate.getTime() - o.createdAt.getTime()) / 86400000);
    if (!byCountry[o.client.country]) byCountry[o.client.country] = [];
    byCountry[o.client.country].push(Math.max(5, days));
  }

  return Object.entries(byCountry).map(([destination, days]) => {
    const avg = days.reduce((s, d) => s + d, 0) / days.length;
    const sorted = [...days].sort((a, b) => a - b);
    return {
      destination,
      avgDays: Math.round(avg),
      minDays: sorted[0] || 0,
      maxDays: sorted[sorted.length - 1] || 0,
      onTimeRate: Math.round((days.filter((d) => d <= avg * 1.2).length / days.length) * 100),
      shipments: days.length,
    };
  }).sort((a, b) => b.shipments - a.shipments);
}

export function detectBottlenecks(): Bottleneck[] {
  return [
    { stage: "Approvisionnement matière première", severity: "medium", description: "Délais d'approvisionnement en hausse de 15% ce trimestre", impact: "Retard potentiel de 3-5 jours sur les commandes", avgDelay: 4 },
    { stage: "Contrôle qualité", severity: "low", description: "Processus de certification ISO en cours", impact: "Temps de contrôle rallongé temporairement", avgDelay: 1 },
    { stage: "Dédouanement export", severity: "high", description: "Nouvelles réglementations douanières algériennes", impact: "Blocage potentiel de 5-10 jours pour certaines destinations", avgDelay: 7 },
    { stage: "Transport maritime", severity: "medium", description: "Congestion portuaire à Oran", impact: "Retards de chargement de 2-3 jours", avgDelay: 3 },
  ];
}

export async function generateQualityLots(): Promise<QualityLot[]> {
  const production = await prisma.productionEntry.findMany({
    include: { product: true },
    orderBy: { date: "desc" },
    take: 20,
  });

  return production.map((p, i) => ({
    lotId: `LOT-${p.date.getFullYear()}${String(p.date.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
    product: p.product.name,
    date: p.date.toISOString().split("T")[0],
    quantity: Math.round(p.quantity),
    quality: p.quality || "Standard",
    destination: ["Spain", "France", "Germany", "Italy", "USA"][i % 5],
    status: i < 5 ? "En stock" : i < 12 ? "Expédié" : "Livré",
  }));
}
