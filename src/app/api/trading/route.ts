import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    // ── Open Positions (mark-to-market) ───────────────
    const positions = await prisma.tradingPosition.findMany({
      where: { status: "open" },
      include: { trade: { include: { counterparty: true } } },
      orderBy: { unrealizedPnl: "desc" },
    });

    // Refresh MTM from latest market data
    const latestPrices: Record<string, number> = {};
    for (const pos of positions) {
      if (!latestPrices[pos.instrument]) {
        const md = await prisma.marketData.findFirst({
          where: { instrument: { contains: pos.instrument.replace(" ", "_") } },
          orderBy: { date: "desc" },
        });
        // For physical products use internal pricing
        const productCost = await prisma.productCost.findFirst({
          where: { product: { name: pos.instrument } },
          orderBy: { effectiveDate: "desc" },
        });
        latestPrices[pos.instrument] = md?.close ?? pos.markPrice;
      }
    }

    const positionBook = positions.map((p) => {
      const currentMark = latestPrices[p.instrument] ?? p.markPrice;
      const multiplier = p.side === "long" ? 1 : -1;
      const unrealizedPnl = multiplier * p.quantity * (currentMark - p.avgPrice);
      return {
        id: p.id,
        instrument: p.instrument,
        side: p.side as "long" | "short",
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        markPrice: Math.round(currentMark * 100) / 100,
        unrealizedPnl: Math.round(unrealizedPnl),
        realizedPnl: Math.round(p.realizedPnl),
        deltaExposure: Math.round(multiplier * p.quantity * currentMark),
        currency: p.currency,
        openDate: p.openDate.toISOString().split("T")[0],
        status: p.status,
        counterparty: p.trade.counterparty.name,
      };
    });

    // ── Recent Trades ─────────────────────────────────
    const recentTrades = await prisma.trade.findMany({
      include: { counterparty: true },
      orderBy: { tradeDate: "desc" },
      take: 30,
    });

    const trades = recentTrades.map((t) => ({
      id: t.id,
      tradeRef: t.tradeRef,
      counterparty: t.counterparty.name,
      instrument: t.instrument,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      currency: t.currency,
      tradeDate: t.tradeDate.toISOString().split("T")[0],
      settlementDate: t.settlementDate?.toISOString().split("T")[0] ?? null,
      method: t.method,
      status: t.status,
      pnlRealized: Math.round(t.pnlRealized),
      pnlUnrealized: Math.round(t.pnlUnrealized),
    }));

    // ── Derivatives ───────────────────────────────────
    const activeDerivatives = await prisma.derivative.findMany({
      where: { status: "active" },
      orderBy: { expiry: "asc" },
    });

    const derivatives = activeDerivatives.map((d) => ({
      id: d.id,
      type: d.type,
      underlying: d.underlying,
      side: d.side,
      quantity: d.quantity,
      strike: d.strike,
      expiry: d.expiry.toISOString().split("T")[0],
      premium: d.premium,
      notional: d.notional,
      delta: d.delta,
      gamma: d.gamma,
      vega: d.vega,
      theta: d.theta,
      rho: d.rho,
      markToMarket: Math.round(d.markToMarket),
      status: d.status,
      daysToExpiry: Math.max(0, Math.ceil((d.expiry.getTime() - now.getTime()) / 86400000)),
    }));

    // ── Futures Curve ─────────────────────────────────
    const futures = await prisma.futuresContract.findMany({
      where: { symbol: "CC" }, // Cocoa
      orderBy: { contractMonth: "asc" },
    });

    const spotPrice = latestPrices["COCOA_USD"] ?? (await prisma.marketData.findFirst({ where: { instrument: "COCOA_USD" }, orderBy: { date: "desc" } }))?.close ?? 8800;

    const futuresCurve = futures.map((f) => ({
      contractMonth: f.contractMonth,
      bid: f.bid,
      ask: f.ask,
      settlement: f.settlement,
      openInterest: f.openInterest,
      volume: f.volume,
      basis: Math.round((f.settlement - spotPrice) * 100) / 100,
    }));

    // ── Trading Limits ────────────────────────────────
    const dbLimits = await prisma.tradingLimit.findMany({
      orderBy: { utilizationPct: "desc" },
    });

    const limits = dbLimits.map((l) => ({
      entity: l.entity,
      entityRef: l.entityRef,
      riskType: l.riskType,
      limitAmount: l.limitAmount,
      currentUsage: l.currentUsage,
      utilizationPct: l.utilizationPct,
      breached: l.breached,
    }));

    // ── P&L Attribution (last 20 business days) ───────
    const pnlAttribution = await prisma.pnLAttribution.findMany({
      where: { portfolio: "total" },
      orderBy: { date: "desc" },
      take: 22,
    });

    const attribution = pnlAttribution.reverse().map((a) => ({
      date: a.date.toISOString().split("T")[0],
      marketMove: a.marketMove,
      carry: a.carry,
      spread: a.spread,
      theta: a.theta,
      vega: a.vega,
      gamma: a.gamma,
      fx: a.fx,
      other: a.other,
      total: a.total,
    }));

    // ── VaR Backtest ──────────────────────────────────
    const varData = await prisma.vaRBacktest.findMany({
      where: { confidence: 0.95, portfolio: "total" },
      orderBy: { date: "desc" },
      take: 60,
    });

    const varBacktest = varData.reverse().map((v) => ({
      date: v.date.toISOString().split("T")[0],
      varForecast: v.varForecast,
      realizedPnl: v.realizedPnl,
      breach: v.breach,
    }));

    // ── Summary Aggregations ──────────────────────────
    const totalMTM = positionBook.reduce((s, p) => s + p.quantity * p.markPrice, 0);
    const totalUnrealizedPnl = positionBook.reduce((s, p) => s + p.unrealizedPnl, 0);
    const totalRealizedPnl = trades.filter((t) => t.status === "settled" || t.status === "closed")
      .reduce((s, t) => s + t.pnlRealized, 0);
    const netDelta = [...positionBook.map((p) => p.deltaExposure), ...derivatives.map((d) => d.delta * d.notional)]
      .reduce((s, v) => s + v, 0);
    const netGamma = derivatives.reduce((s, d) => s + d.gamma * d.notional, 0);
    const netVega = derivatives.reduce((s, d) => s + d.vega, 0);

    return NextResponse.json({
      positions: positionBook,
      trades,
      derivatives,
      futuresCurve,
      limits,
      pnlAttribution: attribution,
      varBacktest,
      summary: {
        totalMTM: Math.round(totalMTM),
        totalUnrealizedPnl: Math.round(totalUnrealizedPnl),
        totalRealizedPnl: Math.round(totalRealizedPnl),
        netDelta: Math.round(netDelta),
        netGamma: Math.round(netGamma),
        netVega: Math.round(netVega),
        openPositionCount: positionBook.length,
        limitsBreached: limits.filter((l) => l.breached).length,
      },
    });
  } catch (err) {
    console.error("Trading API error:", err);
    return NextResponse.json({ error: "Failed to load trading data" }, { status: 500 });
  }
}
