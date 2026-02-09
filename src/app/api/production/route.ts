import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export async function GET() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

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

  return NextResponse.json({ monthly, byQuality, byShift, total, totalChange });
}
