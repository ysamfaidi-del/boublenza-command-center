import { prisma } from "@/lib/db";
import type { CriticalAlert } from "@/types/premium";

export async function generateAlerts(): Promise<CriticalAlert[]> {
  const alerts: CriticalAlert[] = [];
  const now = new Date();

  // Low stock
  const products = await prisma.product.findMany({ include: { stock: true } });
  for (const p of products) {
    const qty = p.stock.reduce((s, e) => s + e.quantity, 0);
    if (qty < 5000) {
      alerts.push({
        id: `stock-${p.id}`,
        severity: qty < 2000 ? "critical" : "warning",
        category: "stock",
        title: `Stock critique — ${p.name}`,
        description: `Niveau actuel : ${Math.round(qty)} kg. Seuil minimum : 5 000 kg.`,
        timestamp: now.toISOString(),
      });
    }
  }

  // Overdue deliveries
  const overdue = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "in_production", "shipped"] }, deliveryDate: { lt: now } },
    include: { client: true },
  });
  for (const o of overdue) {
    if (!o.deliveryDate) continue;
    const days = Math.floor((now.getTime() - o.deliveryDate.getTime()) / 86400000);
    alerts.push({
      id: `delivery-${o.id}`,
      severity: days > 7 ? "critical" : "warning",
      category: "delivery",
      title: `Livraison en retard — ${o.client.name}`,
      description: `Commande en retard de ${days} jour(s). Destination : ${o.client.country}.`,
      timestamp: now.toISOString(),
    });
  }

  // High concentration risk
  const orders = await prisma.order.findMany({
    where: { status: { not: "cancelled" }, createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) } },
    include: { client: true },
  });
  const clientRevenue: Record<string, number> = {};
  const totalRev = orders.reduce((s, o) => { clientRevenue[o.client.name] = (clientRevenue[o.client.name] || 0) + o.totalAmount; return s + o.totalAmount; }, 0);
  for (const [client, rev] of Object.entries(clientRevenue)) {
    const pct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
    if (pct > 30) {
      alerts.push({
        id: `concentration-${client}`,
        severity: pct > 50 ? "critical" : "warning",
        category: "finance",
        title: `Concentration client — ${client}`,
        description: `${Math.round(pct)}% du CA sur 3 mois. Risque de dépendance.`,
        timestamp: now.toISOString(),
      });
    }
  }

  return alerts.sort((a, b) => {
    const ord = { critical: 0, warning: 1, info: 2 };
    return ord[a.severity] - ord[b.severity];
  });
}
