import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export async function GET() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
    include: { lines: { include: { product: true } } },
  });

  const forecasts = products.map((product) => {
    // Get monthly historical demand
    const monthlyDemand: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthOrders = orders.filter(
        (o) => o.createdAt.getMonth() === d.getMonth() && o.createdAt.getFullYear() === d.getFullYear()
      );
      const qty = monthOrders.reduce((sum, o) => {
        return sum + o.lines.filter((l) => l.productId === product.id).reduce((s, l) => s + l.quantity, 0);
      }, 0);
      monthlyDemand.push(qty);
    }

    // Simple linear regression for forecast
    const n = monthlyDemand.length;
    const xMean = (n - 1) / 2;
    const yMean = monthlyDemand.reduce((s, v) => s + v, 0) / n;

    let slope = 0;
    let denom = 0;
    for (let i = 0; i < n; i++) {
      slope += (i - xMean) * (monthlyDemand[i] - yMean);
      denom += (i - xMean) * (i - xMean);
    }
    slope = denom > 0 ? slope / denom : 0;
    const intercept = yMean - slope * xMean;

    // Forecast next 6 months
    const forecastPoints = [];
    for (let i = 1; i <= 6; i++) {
      const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
      const uncertainty = Math.round(predicted * 0.15); // ±15%
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecastPoints.push({
        month: MONTHS_FR[futureDate.getMonth()],
        predicted,
        lower: Math.max(0, predicted - uncertainty),
        upper: predicted + uncertainty,
      });
    }

    const avgRecent = monthlyDemand.slice(-3).reduce((s, v) => s + v, 0) / 3;
    const avgOlder = monthlyDemand.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const trendPct = avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder * 100).toFixed(1) : "0";
    const trend = slope > 0 ? `Tendance haussière (+${trendPct}%)` : slope < 0 ? `Tendance baissière (${trendPct}%)` : "Stable";

    const recommendation = slope > 50
      ? `Augmenter la production de ${product.name} de 10-15% pour répondre à la demande croissante.`
      : slope < -50
      ? `Surveiller la demande de ${product.name}. Envisager une diversification des marchés.`
      : `Maintenir le niveau de production actuel de ${product.name}. Demande stable.`;

    return {
      product: product.name,
      forecasts: forecastPoints,
      trend,
      recommendation,
    };
  });

  return NextResponse.json({ forecasts });
}
