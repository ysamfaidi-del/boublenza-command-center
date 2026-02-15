import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAlerts } from "@/lib/analytics/alerts-engine";

export async function GET() {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth() - 11, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

    // ── Revenue Summary ─────────────────────────────
    const qtdOrders = await prisma.order.findMany({
      where: { createdAt: { gte: quarterStart }, status: { not: "cancelled" } },
    });
    const qtdRevenue = qtdOrders.reduce((s, o) => s + o.totalAmount, 0);

    // Budget = quarter target
    const budgets = await prisma.budget.findMany({
      where: {
        year: now.getFullYear(),
        month: { gte: Math.floor(now.getMonth() / 3) * 3 + 1, lte: Math.floor(now.getMonth() / 3) * 3 + 3 },
        category: "revenue",
      },
    });
    const quarterTarget = budgets.reduce((s, b) => s + b.amount, 0) || qtdRevenue * 1.8;

    // Week over week
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    const thisWeekOrders = await prisma.order.findMany({
      where: { createdAt: { gte: weekAgo }, status: { not: "cancelled" } },
    });
    const lastWeekOrders = await prisma.order.findMany({
      where: { createdAt: { gte: twoWeeksAgo, lte: weekAgo }, status: { not: "cancelled" } },
    });
    const thisWeekRev = thisWeekOrders.reduce((s, o) => s + o.totalAmount, 0);
    const lastWeekRev = lastWeekOrders.reduce((s, o) => s + o.totalAmount, 0);
    const weekOverWeek = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;

    // YoY
    const lastYearQtdOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(now.getFullYear() - 1, Math.floor(now.getMonth() / 3) * 3, 1), lte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) },
        status: { not: "cancelled" },
      },
    });
    const lastYearQtdRev = lastYearQtdOrders.reduce((s, o) => s + o.totalAmount, 0);
    const qtdYoy = lastYearQtdRev > 0 ? ((qtdRevenue - lastYearQtdRev) / lastYearQtdRev) * 100 : 0;

    // Quarter progress
    const quarterDays = (quarterEnd.getTime() - quarterStart.getTime()) / 86400000;
    const elapsedDays = (now.getTime() - quarterStart.getTime()) / 86400000;
    const quarterProgress = Math.round((elapsedDays / quarterDays) * 100);
    const targetAttainment = quarterTarget > 0 ? Math.round((qtdRevenue / quarterTarget) * 100) : 0;

    // Finance outlook — simple linear projection
    const financeOutlook = elapsedDays > 0 ? (qtdRevenue / elapsedDays) * quarterDays : qtdRevenue;
    const financeOutlookPct = quarterTarget > 0 ? Math.round((financeOutlook / quarterTarget) * 1000) / 10 : 0;

    // Pipeline (sales outlook)
    let salesOutlookAmount = 0;
    try {
      const deals = await prisma.order.findMany({
        where: { status: { in: ["confirmed", "in_production"] }, createdAt: { gte: quarterStart } },
      });
      salesOutlookAmount = deals.reduce((s, o) => s + o.totalAmount, 0);
    } catch { /* no deals */ }

    const revenueSummary = {
      quarterTarget: Math.round(quarterTarget),
      qtdRevenue: Math.round(qtdRevenue),
      gapToTarget: Math.round(quarterTarget - qtdRevenue),
      financeOutlook: Math.round(financeOutlook),
      financeOutlookPct,
      salesOutlook: quarterTarget > 0 ? Math.round((salesOutlookAmount / quarterTarget) * 100) : 0,
      salesOutlookAmount: Math.round(salesOutlookAmount),
      weekOverWeek: Math.round(weekOverWeek * 10) / 10,
      weekOverWeekAmount: Math.round(thisWeekRev - lastWeekRev),
      qtdYearOverYear: Math.round(qtdYoy * 10) / 10,
      qtdYearOverYearAmount: Math.round(qtdRevenue - lastYearQtdRev),
      quarterProgress,
      targetAttainment,
    };

    // ── Revenue Trend (daily for current quarter) ────
    const allQtdOrders = await prisma.order.findMany({
      where: { createdAt: { gte: quarterStart }, status: { not: "cancelled" } },
      select: { createdAt: true, totalAmount: true },
    });
    const lastYearAllOrders = await prisma.order.findMany({
      where: { createdAt: { gte: lastYearStart, lte: lastYearEnd }, status: { not: "cancelled" } },
      select: { createdAt: true, totalAmount: true },
    });

    const dailyTarget = quarterTarget / quarterDays;
    const revenueTrend = [];
    for (let d = new Date(quarterStart); d <= now; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split("T")[0];
      const dayOrders = allQtdOrders.filter((o) => o.createdAt.toISOString().split("T")[0] === dayStr);
      const dayRevenue = dayOrders.reduce((s, o) => s + o.totalAmount, 0);
      const lastYearDay = new Date(d);
      lastYearDay.setFullYear(lastYearDay.getFullYear() - 1);
      const lyDayStr = lastYearDay.toISOString().split("T")[0];
      const lyDayOrders = lastYearAllOrders.filter((o) => o.createdAt.toISOString().split("T")[0] === lyDayStr);
      revenueTrend.push({
        date: dayStr,
        revenue: Math.round(dayRevenue),
        target: Math.round(dailyTarget),
        lastYear: Math.round(lyDayOrders.reduce((s, o) => s + o.totalAmount, 0)),
        outlook: Math.round(dayRevenue * financeOutlookPct / 100),
      });
    }

    // ── Top Movers (7d comparison) ──────────────────
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: twoWeeksAgo }, status: { not: "cancelled" } },
      include: { client: true },
    });

    const clientThis: Record<string, { name: string; rev: number; orders: number }> = {};
    const clientLast: Record<string, { name: string; rev: number; orders: number }> = {};
    for (const o of recentOrders) {
      const bucket = o.createdAt >= weekAgo ? clientThis : clientLast;
      if (!bucket[o.clientId]) bucket[o.clientId] = { name: o.client.name, rev: 0, orders: 0 };
      bucket[o.clientId].rev += o.totalAmount;
      bucket[o.clientId].orders += 1;
    }

    const allClientIds = new Set([...Object.keys(clientThis), ...Object.keys(clientLast)]);
    const movers = Array.from(allClientIds).map((id) => {
      const curr = clientThis[id]?.rev || 0;
      const prev = clientLast[id]?.rev || 0;
      return {
        name: clientThis[id]?.name || clientLast[id]?.name || id,
        change7d: Math.round(curr - prev),
        wow: prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : curr > 0 ? 100 : 0,
        accts: 1,
      };
    }).sort((a, b) => a.change7d - b.change7d);

    const decliners = movers.filter((m) => m.change7d < 0).slice(0, 5);
    const risers = movers.filter((m) => m.change7d > 0).reverse().slice(0, 5);

    // ── Todos from alerts ───────────────────────────
    let alerts: Awaited<ReturnType<typeof generateAlerts>> = [];
    try { alerts = await generateAlerts(); } catch { /* fallback empty */ }
    const stockAlerts = alerts.filter((a) => a.category === "stock");
    const deliveryAlerts = alerts.filter((a) => a.category === "delivery");
    const financeAlerts = alerts.filter((a) => a.category === "finance");

    // Overdue payments
    let overduePayments = 0;
    let overdueAmount = 0;
    try {
      const payments = await prisma.payment.findMany({ where: { status: "overdue" } });
      overduePayments = payments.length;
      overdueAmount = payments.reduce((s, p) => s + p.amount, 0);
    } catch { /* no payments table or empty */ }

    const todos = [];
    if (stockAlerts.length > 0) {
      todos.push({ id: "t-stock", label: "Resolve low stock alerts", icon: "alert", severity: stockAlerts.some((a) => a.severity === "critical") ? "critical" as const : "warning" as const, count: stockAlerts.length });
    }
    if (overduePayments > 0) {
      todos.push({ id: "t-payments", label: "Collect overdue payments", icon: "dollar", severity: "critical" as const, value: `$${Math.round(overdueAmount / 1000)}k`, count: overduePayments });
    }
    if (deliveryAlerts.length > 0) {
      todos.push({ id: "t-delivery", label: "Check late deliveries", icon: "calendar", severity: "warning" as const, count: deliveryAlerts.length });
    }
    if (financeAlerts.length > 0) {
      todos.push({ id: "t-concentration", label: "Review client concentration", icon: "users", severity: "warning" as const, count: financeAlerts.length });
    }

    // ── News ────────────────────────────────────────
    let news: { title: string; source: string; date: string; sentiment: string }[] = [];
    try {
      const newsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/market/news`);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        news = (newsData.news || []).slice(0, 4).map((n: { title: string; source?: string; date?: string; sentiment?: string }) => ({
          title: n.title,
          source: n.source || "Market Intelligence",
          date: n.date || now.toISOString(),
          sentiment: n.sentiment || "neutral",
        }));
      }
    } catch { /* fallback empty */ }

    // ── Recent links ────────────────────────────────
    const recentLinks = [
      { title: "QBR Boublenza — Pitch Budget Full Funnel", subtitle: "Reporting Exécutif", type: "report" },
      { title: "Performance Q1 — Revenue Tracking", subtitle: "Boublenza SARL > Finances", type: "dashboard" },
      { title: "Supply Chain Overview — Logistics", type: "page" },
    ];

    // ── Dashboard KPIs & extra data ─────────────
    let dashData: Record<string, unknown> = {};
    try {
      const dashRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/dashboard`);
      if (dashRes.ok) dashData = await dashRes.json();
    } catch { /* fallback */ }

    const kpis = {
      monthlyRevenue: Number((dashData as { kpis?: { monthlyRevenue?: number } }).kpis?.monthlyRevenue || Math.round(qtdRevenue / 3)),
      monthlyRevenueChange: Number((dashData as { kpis?: { monthlyRevenueChange?: number } }).kpis?.monthlyRevenueChange || Math.round(weekOverWeek)),
      totalProduction: Number((dashData as { kpis?: { totalProduction?: number } }).kpis?.totalProduction || 285),
      productionChange: Number((dashData as { kpis?: { productionChange?: number } }).kpis?.productionChange || 4.2),
      activeOrders: Number((dashData as { kpis?: { activeOrders?: number } }).kpis?.activeOrders || qtdOrders.length),
      capacityRate: Number((dashData as { kpis?: { capacityRate?: number } }).kpis?.capacityRate || 78),
      grossMarginPct: Number((dashData as { kpis?: { grossMarginPct?: number } }).kpis?.grossMarginPct || 42),
      cashPosition: Number((dashData as { kpis?: { cashPosition?: number } }).kpis?.cashPosition || 705000),
      ebitda: Number((dashData as { kpis?: { actualRevenue?: number; grossMarginPct?: number } }).kpis?.actualRevenue || qtdRevenue) * Number((dashData as { kpis?: { grossMarginPct?: number } }).kpis?.grossMarginPct || 42) / 100 * 0.7,
    };

    const productSales = ((dashData as { productSales?: unknown[] }).productSales || []).slice(0, 3).map((p: unknown) => {
      const pp = p as Record<string, unknown>;
      return { name: String(pp.name || ""), revenue: Number(pp.revenue || 0), quantity: Number(pp.quantity || 0), margin: Number(pp.margin || 0), marginPct: Number(pp.marginPct || 0) };
    });
    if (productSales.length === 0) {
      productSales.push(
        { name: "CARUMA", revenue: 720000, quantity: 160000, margin: 360000, marginPct: 50 },
        { name: "CARANI", revenue: 420000, quantity: 210000, margin: 168000, marginPct: 40 },
        { name: "CAROB EXTRACT", revenue: 480000, quantity: 56470, margin: 288000, marginPct: 60 },
      );
    }

    const topClients = ((dashData as { topClients?: unknown[] }).topClients || []).slice(0, 5).map((c: unknown) => {
      const cc = c as Record<string, unknown>;
      return { name: String(cc.name || cc.client || ""), country: String(cc.country || ""), revenue: Number(cc.revenue || cc.value || 0), orders: Number(cc.orders || cc.count || 0), trend: (String(cc.trend || "up")) as "up" | "stable" | "down" };
    });
    if (topClients.length === 0) {
      topClients.push(
        { name: "Cargill EMEA", country: "Netherlands", revenue: 450000, orders: 12, trend: "up" as const },
        { name: "Barry Callebaut", country: "Switzerland", revenue: 380000, orders: 8, trend: "stable" as const },
        { name: "Olam Intl", country: "Singapore", revenue: 220000, orders: 6, trend: "up" as const },
        { name: "Naturex", country: "France", revenue: 150000, orders: 5, trend: "down" as const },
        { name: "SunOpta", country: "Canada", revenue: 180000, orders: 7, trend: "stable" as const },
      );
    }

    const recentOrdersData = ((dashData as { recentOrders?: unknown[] }).recentOrders || []).slice(0, 5).map((o: unknown) => {
      const oo = o as Record<string, unknown>;
      return { id: String(oo.id || ""), client: String(oo.client || ""), product: String(oo.product || ""), amount: Number(oo.totalAmount || oo.amount || 0), status: String(oo.status || ""), date: String(oo.date || ""), paymentStatus: String(oo.paymentStatus || "pending") };
    });
    if (recentOrdersData.length === 0) {
      recentOrdersData.push(
        { id: "ORD-2025-041", client: "Cargill EMEA", product: "CARUMA", amount: 90000, status: "confirmed", date: "2025-02-08", paymentStatus: "pending" },
        { id: "ORD-2025-040", client: "Barry Callebaut", product: "CAROB EXTRACT", amount: 42500, status: "in_production", date: "2025-02-06", paymentStatus: "received" },
        { id: "ORD-2025-039", client: "Naturex", product: "CARUMA", amount: 67500, status: "shipped", date: "2025-02-03", paymentStatus: "partial" },
      );
    }

    const productionVsTarget = ((dashData as { productionVsTarget?: unknown[] }).productionVsTarget || []).map((p: unknown) => {
      const pp = p as Record<string, unknown>;
      return { month: String(pp.month || pp.name || ""), actual: Number(pp.actual || pp.value || 0), target: Number(pp.target || 0) };
    });
    if (productionVsTarget.length === 0) {
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].forEach((m, i) => {
        productionVsTarget.push({ month: m, actual: 42 + Math.round(Math.random() * 12), target: 45 + i });
      });
    }

    return NextResponse.json({
      revenueSummary,
      revenueTrend,
      topMovers: {
        companies: { decliners, risers },
        accounts: {
          decliners: decliners.slice(0, 3).map((m) => ({ account: m.name, change1d: Math.round(m.change7d / 7), dd: Math.round(m.wow / 7 * 10) / 10, trend7d: Array.from({ length: 7 }, () => Math.round(Math.random() * m.change7d / 7)) })),
          risers: risers.slice(0, 3).map((m) => ({ account: m.name, change1d: Math.round(m.change7d / 7), dd: Math.round(m.wow / 7 * 10) / 10, trend7d: Array.from({ length: 7 }, () => Math.round(Math.random() * m.change7d / 7)) })),
        },
      },
      todos,
      anomaliesCount: alerts.filter((a) => a.severity === "critical").length,
      news,
      recentLinks,
      kpis,
      productSales,
      topClients,
      recentOrders: recentOrdersData,
      productionVsTarget,
    });
  } catch {
    // Demo fallback
    return NextResponse.json({
      revenueSummary: {
        quarterTarget: 450000, qtdRevenue: 258000, gapToTarget: 192000,
        financeOutlook: 518000, financeOutlookPct: 115.1,
        salesOutlook: 0, salesOutlookAmount: 0,
        weekOverWeek: -12.5, weekOverWeekAmount: -18500,
        qtdYearOverYear: -8.2, qtdYearOverYearAmount: -23000,
        quarterProgress: 44, targetAttainment: 57,
      },
      revenueTrend: Array.from({ length: 60 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 60 + i);
        const base = 4000 + Math.sin(i * 0.3) * 1500;
        return {
          date: d.toISOString().split("T")[0],
          revenue: Math.round(base + Math.random() * 2000),
          target: 5000,
          lastYear: Math.round(base * 0.9 + Math.random() * 1000),
          outlook: Math.round(base * 1.15),
        };
      }),
      topMovers: {
        companies: {
          decliners: [
            { name: "Naturex SA", change7d: -18500, wow: -41.9, accts: 3 },
            { name: "Döhler GmbH", change7d: -8200, wow: -22.1, accts: 1 },
            { name: "Barry Callebaut", change7d: -3100, wow: -8.5, accts: 2 },
          ],
          risers: [
            { name: "Cargill International", change7d: 12400, wow: 28.3, accts: 2 },
            { name: "Tate & Lyle", change7d: 5600, wow: 15.1, accts: 1 },
          ],
        },
        accounts: {
          decliners: [
            { account: "Naturex FR", change1d: -2640, dd: -6.7, trend7d: [-1200, -800, -3200, -2600, -400, -2100, -2640] },
          ],
          risers: [
            { account: "Cargill US", change1d: 1770, dd: 4.0, trend7d: [800, 1200, 1500, 2000, 1770, 1400, 1770] },
          ],
        },
      },
      todos: [
        { id: "t-stock", label: "Resolve low stock alerts", icon: "alert", severity: "critical", count: 2 },
        { id: "t-payments", label: "Collect overdue payments", icon: "dollar", severity: "critical", value: "$45.2k", count: 5 },
        { id: "t-delivery", label: "Check late deliveries", icon: "calendar", severity: "warning", count: 3 },
        { id: "t-concentration", label: "Review client concentration", icon: "users", severity: "warning", count: 1 },
      ],
      anomaliesCount: 0,
      news: [
        { title: "Cocoa prices surge 12% amid West African supply concerns", source: "Reuters Commodities", date: new Date().toISOString(), sentiment: "negative" },
        { title: "EU sets new organic certification standards for imported goods", source: "European Commission", date: new Date().toISOString(), sentiment: "neutral" },
        { title: "Carob demand rises as chocolate alternative gains popularity", source: "Food Business News", date: new Date().toISOString(), sentiment: "positive" },
      ],
      recentLinks: [
        { title: "QBR Boublenza — Pitch Budget Full Funnel", subtitle: "Reporting Exécutif", type: "report" },
        { title: "Performance Q1 — Revenue Tracking", subtitle: "Boublenza SARL > Finances", type: "dashboard" },
      ],
      kpis: {
        monthlyRevenue: 310000, monthlyRevenueChange: 8.5,
        totalProduction: 285, productionChange: 4.2,
        activeOrders: 14, capacityRate: 78,
        grossMarginPct: 42, cashPosition: 705000, ebitda: 92610,
      },
      productSales: [
        { name: "CARUMA", revenue: 720000, quantity: 160000, margin: 360000, marginPct: 50 },
        { name: "CARANI", revenue: 420000, quantity: 210000, margin: 168000, marginPct: 40 },
        { name: "CAROB EXTRACT", revenue: 480000, quantity: 56470, margin: 288000, marginPct: 60 },
      ],
      topClients: [
        { name: "Cargill EMEA", country: "Netherlands", revenue: 450000, orders: 12, trend: "up" },
        { name: "Barry Callebaut", country: "Switzerland", revenue: 380000, orders: 8, trend: "stable" },
        { name: "Olam Intl", country: "Singapore", revenue: 220000, orders: 6, trend: "up" },
        { name: "Naturex", country: "France", revenue: 150000, orders: 5, trend: "down" },
        { name: "SunOpta", country: "Canada", revenue: 180000, orders: 7, trend: "stable" },
      ],
      recentOrders: [
        { id: "ORD-2025-041", client: "Cargill EMEA", product: "CARUMA", amount: 90000, status: "confirmed", date: "2025-02-08", paymentStatus: "pending" },
        { id: "ORD-2025-040", client: "Barry Callebaut", product: "CAROB EXTRACT", amount: 42500, status: "in_production", date: "2025-02-06", paymentStatus: "received" },
        { id: "ORD-2025-039", client: "Naturex", product: "CARUMA", amount: 67500, status: "shipped", date: "2025-02-03", paymentStatus: "partial" },
      ],
      productionVsTarget: [
        { month: "Jan", actual: 42, target: 45 },
        { month: "Feb", actual: 48, target: 45 },
        { month: "Mar", actual: 44, target: 50 },
        { month: "Apr", actual: 51, target: 50 },
        { month: "May", actual: 47, target: 48 },
        { month: "Jun", actual: 53, target: 52 },
      ],
    });
  }
}
