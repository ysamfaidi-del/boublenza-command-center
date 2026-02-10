import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MONTHS_FR } from "@/lib/utils";

export async function GET() {
  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ── Product costs (per kg) ──
    const productCosts = await prisma.productCost.findMany({
      include: { product: true },
    });
    const costMap: Record<string, number> = {};
    for (const pc of productCosts) {
      costMap[pc.product.name] = pc.rawMaterialCost + pc.laborCost + pc.energyCost + pc.packagingCost + pc.overheadCost;
    }

    // ── Orders for P&L calculation ──
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
      include: { lines: { include: { product: true } } },
    });

    // ── Monthly P&L ──
    const monthlyPnl: { month: string; revenue: number; cogs: number; grossMargin: number; opex: number; ebitda: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthOrders = orders.filter((o) => o.createdAt.getMonth() === m && o.createdAt.getFullYear() === y);

      let revenue = 0;
      let cogs = 0;
      for (const o of monthOrders) {
        for (const l of o.lines) {
          const lineRev = l.quantity * l.unitPrice;
          const unitCost = costMap[l.product.name] || l.unitPrice * 0.55;
          revenue += lineRev;
          cogs += l.quantity * unitCost;
        }
      }

      // Get real OPEX from expenses table
      const monthExpenses = await prisma.expense.findMany({
        where: {
          date: { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) },
          category: { notIn: ["raw_material"] },
        },
      });
      const opex = monthExpenses.reduce((s, e) => s + e.amount, 0);

      monthlyPnl.push({
        month: MONTHS_FR[m],
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        grossMargin: Math.round(revenue - cogs),
        opex: Math.round(opex),
        ebitda: Math.round(revenue - cogs - opex),
      });
    }

    // ── Margin by product ──
    const productMargins: { product: string; revenue: number; cogs: number; margin: number; marginPct: number; volume: number }[] = [];
    const prodMap: Record<string, { revenue: number; cogs: number; volume: number }> = {};
    for (const o of orders) {
      for (const l of o.lines) {
        const name = l.product.name;
        if (!prodMap[name]) prodMap[name] = { revenue: 0, cogs: 0, volume: 0 };
        prodMap[name].revenue += l.quantity * l.unitPrice;
        prodMap[name].cogs += l.quantity * (costMap[name] || l.unitPrice * 0.55);
        prodMap[name].volume += l.quantity;
      }
    }
    for (const [product, d] of Object.entries(prodMap)) {
      productMargins.push({
        product,
        revenue: Math.round(d.revenue),
        cogs: Math.round(d.cogs),
        margin: Math.round(d.revenue - d.cogs),
        marginPct: d.revenue > 0 ? Math.round((d.revenue - d.cogs) / d.revenue * 1000) / 10 : 0,
        volume: Math.round(d.volume),
      });
    }

    // ── Cash flow from CashEntry ──
    const cashEntries = await prisma.cashEntry.findMany({
      where: { date: { gte: yearStart } },
      orderBy: { date: "asc" },
    });
    const monthlyCash: { month: string; inflow: number; outflow: number; balance: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthEntries = cashEntries.filter((e) => e.date.getMonth() === m && e.date.getFullYear() === y);
      const inflow = monthEntries.filter((e) => e.type === "inflow").reduce((s, e) => s + e.amount, 0);
      const outflow = monthEntries.filter((e) => e.type === "outflow").reduce((s, e) => s + e.amount, 0);
      const lastEntry = monthEntries[monthEntries.length - 1];
      monthlyCash.push({
        month: MONTHS_FR[m],
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        balance: lastEntry ? Math.round(lastEntry.balance) : monthlyCash[monthlyCash.length - 1]?.balance || 320000,
      });
    }

    // ── Payments: DSO, aging report ──
    const payments = await prisma.payment.findMany({
      include: { order: { include: { client: true } } },
    });
    const receivedPayments = payments.filter((p) => p.status === "received" && p.receivedDate);
    const avgDSO = receivedPayments.length > 0
      ? Math.round(receivedPayments.reduce((s, p) => {
          const days = Math.floor((p.receivedDate!.getTime() - p.order.createdAt.getTime()) / 86400000);
          return s + days;
        }, 0) / receivedPayments.length)
      : 35;

    const totalReceivable = payments.filter((p) => ["pending", "partial", "overdue"].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
    const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const totalPartial = payments.filter((p) => p.status === "partial").reduce((s, p) => s + p.amount, 0);

    // Aging buckets
    const aging = { current: 0, days30: 0, days60: 0, days90plus: 0 };
    for (const p of payments.filter((p) => ["pending", "partial", "overdue"].includes(p.status))) {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - p.dueDate.getTime()) / 86400000));
      if (daysOverdue <= 0) aging.current += p.amount;
      else if (daysOverdue <= 30) aging.days30 += p.amount;
      else if (daysOverdue <= 60) aging.days60 += p.amount;
      else aging.days90plus += p.amount;
    }

    // ── Budget vs Actual ──
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthBudget = await prisma.budget.findMany({
      where: { month: currentMonth, year: currentYear },
    });
    const budgetRevenue = monthBudget.filter((b) => b.category === "revenue").reduce((s, b) => s + b.amount, 0);
    const budgetCogs = monthBudget.filter((b) => b.category === "cogs").reduce((s, b) => s + b.amount, 0);
    const budgetOpex = monthBudget.filter((b) => b.category === "opex").reduce((s, b) => s + b.amount, 0);
    const currentPnl = monthlyPnl[monthlyPnl.length - 1] || { revenue: 0, cogs: 0, opex: 0, ebitda: 0 };

    // ── Expense breakdown (current month) ──
    const currentExpenses = await prisma.expense.findMany({
      where: { date: { gte: new Date(currentYear, currentMonth - 1, 1), lt: new Date(currentYear, currentMonth, 1) } },
    });
    const expenseBreakdown = currentExpenses.map((e) => ({
      category: e.category,
      label: e.label,
      amount: Math.round(e.amount),
    }));

    // ── KPIs ──
    const totalRevenue12m = monthlyPnl.reduce((s, m) => s + m.revenue, 0);
    const totalCogs12m = monthlyPnl.reduce((s, m) => s + m.cogs, 0);
    const totalEbitda12m = monthlyPnl.reduce((s, m) => s + m.ebitda, 0);
    const grossMarginPct = totalRevenue12m > 0 ? Math.round((totalRevenue12m - totalCogs12m) / totalRevenue12m * 1000) / 10 : 0;
    const latestCash = monthlyCash[monthlyCash.length - 1]?.balance || 0;

    // DPO estimate (30 days standard for Algerian market)
    const avgDPO = 25;
    const bfr = Math.round((avgDSO - avgDPO) * (totalRevenue12m / 365));

    return NextResponse.json({
      kpis: {
        revenue12m: totalRevenue12m,
        grossMarginPct,
        ebitda12m: totalEbitda12m,
        cashPosition: latestCash,
        dso: avgDSO,
        dpo: avgDPO,
        bfr,
        totalReceivable: Math.round(totalReceivable),
        totalOverdue: Math.round(totalOverdue),
      },
      monthlyPnl,
      productMargins,
      monthlyCash,
      aging: {
        current: Math.round(aging.current),
        days30: Math.round(aging.days30),
        days60: Math.round(aging.days60),
        days90plus: Math.round(aging.days90plus),
      },
      budgetVsActual: {
        revenue: { budget: budgetRevenue, actual: currentPnl.revenue },
        cogs: { budget: budgetCogs, actual: currentPnl.cogs },
        opex: { budget: budgetOpex, actual: currentPnl.opex },
      },
      expenseBreakdown,
      payments: {
        received: payments.filter((p) => p.status === "received").length,
        pending: payments.filter((p) => p.status === "pending").length,
        overdue: payments.filter((p) => p.status === "overdue").length,
        partial: payments.filter((p) => p.status === "partial").length,
        totalPending: Math.round(totalPending),
        totalOverdue: Math.round(totalOverdue),
        totalPartial: Math.round(totalPartial),
      },
    });
  } catch (e) {
    console.error("Financials API error:", e);
    return NextResponse.json({ error: "Failed to load financial data" }, { status: 500 });
  }
}
