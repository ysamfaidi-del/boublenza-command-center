import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateExecutiveSummary, generateBenchmarks, runMonteCarloProjections, calculateYoYMetrics } from "@/lib/analytics/monte-carlo";
import { demoExecutive } from "@/lib/demo-data";

export async function GET() {
  try {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [summary, yoy] = await Promise.all([generateExecutiveSummary(), calculateYoYMetrics()]);
  const benchmarks = generateBenchmarks();
  const scenarios = runMonteCarloProjections(summary.revenue || 500000);

  // Budget vs Actual for executive summary
  const monthBudgets = await prisma.budget.findMany({
    where: { year: currentYear },
  });
  const ytdBudgetRevenue = monthBudgets.filter((b) => b.category === "revenue" && b.month <= currentMonth).reduce((s, b) => s + b.amount, 0);
  const ytdBudgetCogs = monthBudgets.filter((b) => b.category === "cogs" && b.month <= currentMonth).reduce((s, b) => s + b.amount, 0);
  const ytdBudgetOpex = monthBudgets.filter((b) => b.category === "opex" && b.month <= currentMonth).reduce((s, b) => s + b.amount, 0);

  // Cash position
  const latestCash = await prisma.cashEntry.findFirst({ orderBy: { date: "desc" } });
  const cashPosition = latestCash?.balance || 0;

  // Payment health
  const payments = await prisma.payment.findMany();
  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const overdueAmount = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const receivedPayments = payments.filter((p) => p.status === "received" && p.receivedDate);
  const avgDSO = receivedPayments.length > 0
    ? Math.round(receivedPayments.reduce((s, p) => {
        const days = Math.floor((p.receivedDate!.getTime() - p.createdAt.getTime()) / 86400000);
        return s + Math.max(0, days);
      }, 0) / receivedPayments.length)
    : 35;

  return NextResponse.json({
    summary,
    benchmarks,
    scenarios,
    yoy,
    financial: {
      ytdBudgetRevenue: Math.round(ytdBudgetRevenue),
      ytdActualRevenue: summary.revenue,
      budgetAttainment: ytdBudgetRevenue > 0 ? Math.round(summary.revenue / ytdBudgetRevenue * 1000) / 10 : 0,
      cashPosition: Math.round(cashPosition),
      dso: avgDSO,
      overdueCount,
      overdueAmount: Math.round(overdueAmount),
    },
  });
  } catch { return NextResponse.json(demoExecutive); }
}
