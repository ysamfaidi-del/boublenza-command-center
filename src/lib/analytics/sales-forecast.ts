import type { V2Deal, V2PipelineSummary, V2SalesForecast, DealStage } from "@/types/v2";

const STAGE_ORDER: DealStage[] = ["prospection", "qualification", "proposition", "negociation", "closing", "won", "lost"];

const STAGE_PROBABILITY: Record<DealStage, number> = {
  prospection: 10,
  qualification: 25,
  proposition: 50,
  negociation: 70,
  closing: 90,
  won: 100,
  lost: 0,
};

/**
 * Calculate pipeline summary from a list of deals.
 * Excludes "won" and "lost" deals from active pipeline metrics.
 */
export function pipelineSummary(deals: V2Deal[]): V2PipelineSummary {
  const activeDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");

  const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0;

  const avgDealSize = activeDeals.length > 0
    ? Math.round(totalPipeline / activeDeals.length)
    : 0;

  // Avg cycle in days — from createdAt to closedAt for won deals
  let avgCycleDays = 0;
  if (wonDeals.length > 0) {
    const totalDays = wonDeals.reduce((sum, d) => {
      const created = new Date(d.createdAt);
      const closed = d.closedAt ? new Date(d.closedAt) : new Date();
      return sum + Math.max(1, (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgCycleDays = Math.round(totalDays / wonDeals.length);
  }

  // Deals by stage
  const dealsByStage = STAGE_ORDER.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  return { totalPipeline, weightedValue, winRate, avgDealSize, avgCycleDays, dealsByStage };
}

/**
 * Calculate per-rep performance metrics.
 */
export function repPerformance(deals: V2Deal[], repId: string, quota: number) {
  const repDeals = deals.filter((d) => d.repId === repId);
  const wonDeals = repDeals.filter((d) => d.stage === "won");
  const lostDeals = repDeals.filter((d) => d.stage === "lost");
  const activeDeals = repDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");

  const totalWon = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const quotaAttainment = quota > 0 ? Math.round((totalWon / quota) * 100) : 0;

  return {
    repId,
    dealsWon: wonDeals.length,
    dealsLost: lostDeals.length,
    dealsActive: activeDeals.length,
    totalWon,
    pipelineValue,
    weightedPipeline,
    quotaAttainment,
    winRate: wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0,
  };
}

/**
 * Generate revenue forecasts for a list of deals.
 *
 * Four projection methods:
 * - Weighted: Σ(value × probability / 100)
 * - Best case: 85% of total pipeline value
 * - Worst case: historical_win_rate × 70% of pipeline
 * - AI-adjusted: total × historical_win_rate (calibrated)
 */
export function revenueForecasts(
  deals: V2Deal[],
  periods: string[] = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"],
): V2SalesForecast[] {
  const activeDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");

  const historicalWinRate = wonDeals.length + lostDeals.length > 0
    ? wonDeals.length / (wonDeals.length + lostDeals.length)
    : 0.5;

  const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weighted = activeDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const bestCase = totalPipeline * 0.85;
  const worstCase = totalPipeline * historicalWinRate * 0.7;
  const aiAdjusted = totalPipeline * historicalWinRate;

  // Distribute across periods with a decay factor (more certainty near-term)
  return periods.map((period, i) => {
    const decay = Math.pow(0.85, i); // 1.0, 0.85, 0.72, 0.61
    return {
      period,
      weighted: Math.round(weighted * decay),
      bestCase: Math.round(bestCase * decay),
      worstCase: Math.round(worstCase * decay),
      aiAdjusted: Math.round(aiAdjusted * decay),
    };
  });
}

/** Map stages to display labels */
export const STAGE_LABELS: Record<DealStage, string> = {
  prospection: "Prospection",
  qualification: "Qualification",
  proposition: "Proposition",
  negociation: "Négociation",
  closing: "Closing",
  won: "Won ✓",
  lost: "Lost ✗",
};

/** Get stage color for charts/badges */
export const STAGE_COLORS: Record<DealStage, string> = {
  prospection: "#80868b",
  qualification: "#f9ab00",
  proposition: "#1a73e8",
  negociation: "#174ea6",
  closing: "#188038",
  won: "#137333",
  lost: "#d93025",
};

export { STAGE_ORDER, STAGE_PROBABILITY };
