import type { SpreadPoint, CorrelationPair, MarketSignal, CommodityTimeSeries, RollingCorrelation, CorrelationInsight } from "@/types/premium";

// ── 8 commodities with realistic price ranges ──
const COMMODITIES: Record<string, { base: number; vol: number; drift: number }> = {
  "Cacao":         { base: 8800, vol: 120, drift: -0.47 },
  "Caroube":       { base: 4200, vol: 40,  drift: -0.49 },
  "Sucre":         { base: 580,  vol: 12,  drift: -0.48 },
  "Gomme guar":    { base: 2800, vol: 60,  drift: -0.50 },
  "Vanille":       { base: 42000, vol: 800, drift: -0.46 },
  "Huile de palme": { base: 950, vol: 20,  drift: -0.49 },
  "Farine de blé": { base: 320,  vol: 8,   drift: -0.48 },
  "Lécithine soja": { base: 1600, vol: 35, drift: -0.50 },
};

// Correlation structure (realistic: cacao-sucre high, caroube-gomme moderate, etc.)
const BASE_CORR: Record<string, Record<string, number>> = {
  "Cacao":          { "Caroube": 0.35, "Sucre": 0.62, "Gomme guar": 0.18, "Vanille": 0.25, "Huile de palme": 0.42, "Farine de blé": 0.15, "Lécithine soja": 0.30 },
  "Caroube":        { "Sucre": 0.22, "Gomme guar": 0.45, "Vanille": 0.12, "Huile de palme": 0.28, "Farine de blé": 0.38, "Lécithine soja": 0.20 },
  "Sucre":          { "Gomme guar": 0.15, "Vanille": 0.55, "Huile de palme": 0.68, "Farine de blé": 0.48, "Lécithine soja": 0.32 },
  "Gomme guar":     { "Vanille": 0.08, "Huile de palme": 0.12, "Farine de blé": 0.52, "Lécithine soja": 0.58 },
  "Vanille":        { "Huile de palme": 0.15, "Farine de blé": 0.10, "Lécithine soja": 0.18 },
  "Huile de palme": { "Farine de blé": 0.55, "Lécithine soja": 0.72 },
  "Farine de blé":  { "Lécithine soja": 0.45 },
};

// ── Generate correlated time series for all commodities ──
export function generateCommodityTimeSeries(days: number): CommodityTimeSeries[] {
  const now = new Date();
  const names = Object.keys(COMMODITIES);
  const prices: Record<string, number> = {};

  for (const name of names) {
    prices[name] = COMMODITIES[name].base;
  }

  const series: CommodityTimeSeries[] = [];

  // Shared random factor to create correlations
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    // Global market shock (shared across correlated commodities)
    const globalShock = (Math.random() - 0.5) * 2;

    const dayPrices: Record<string, number> = {};
    for (const name of names) {
      const c = COMMODITIES[name];
      const idiosyncratic = (Math.random() + c.drift) * c.vol;
      // Blend global shock with idiosyncratic move
      const corrWeight = name === "Cacao" || name === "Sucre" || name === "Huile de palme" ? 0.4 : 0.2;
      const move = idiosyncratic + globalShock * c.vol * corrWeight;
      prices[name] = Math.max(c.base * 0.6, Math.min(c.base * 1.5, prices[name] + move));
      dayPrices[name] = Math.round(prices[name]);
    }

    series.push({ date: d.toISOString().split("T")[0], prices: dayPrices });
  }

  return series;
}

// ── Pearson correlation between two arrays ──
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 5) return 0;

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ── Compute full NxN correlation matrix from time series ──
export function computeCorrelationMatrix(series: CommodityTimeSeries[]): CorrelationPair[] {
  const names = Object.keys(COMMODITIES);
  const pairs: CorrelationPair[] = [];

  // Also compute "previous period" for trend detection
  const midpoint = Math.floor(series.length / 2);
  const recentSeries = series.slice(midpoint);
  const olderSeries = series.slice(0, midpoint);

  for (const a of names) {
    for (const b of names) {
      if (a === b) {
        pairs.push({ x: a, y: b, value: 1, significance: "strong", trend: "stable", prevValue: 1 });
        continue;
      }

      const xRecent = recentSeries.map((s) => s.prices[a]);
      const yRecent = recentSeries.map((s) => s.prices[b]);
      const value = +pearsonCorrelation(xRecent, yRecent).toFixed(3);

      const xOlder = olderSeries.map((s) => s.prices[a]);
      const yOlder = olderSeries.map((s) => s.prices[b]);
      const prevValue = +pearsonCorrelation(xOlder, yOlder).toFixed(3);

      const absVal = Math.abs(value);
      const significance: CorrelationPair["significance"] =
        absVal >= 0.7 ? "strong" : absVal >= 0.4 ? "moderate" : absVal >= 0.2 ? "weak" : "none";

      const diff = value - prevValue;
      const trend: CorrelationPair["trend"] =
        diff > 0.05 ? "rising" : diff < -0.05 ? "falling" : "stable";

      pairs.push({ x: a, y: b, value, significance, trend, prevValue });
    }
  }

  return pairs;
}

// ── Rolling correlation (30-day window) for top pairs ──
export function computeRollingCorrelations(series: CommodityTimeSeries[]): RollingCorrelation[] {
  const keyPairs = [
    ["Cacao", "Caroube"],
    ["Cacao", "Sucre"],
    ["Huile de palme", "Lécithine soja"],
    ["Gomme guar", "Lécithine soja"],
  ];

  const windowSize = 30;
  const results: RollingCorrelation[] = [];

  for (let i = windowSize; i < series.length; i += 3) { // every 3 days for lighter data
    for (const [a, b] of keyPairs) {
      const window = series.slice(i - windowSize, i);
      const xArr = window.map((s) => s.prices[a]);
      const yArr = window.map((s) => s.prices[b]);
      const corr = +pearsonCorrelation(xArr, yArr).toFixed(3);

      results.push({
        date: series[i].date,
        pair: `${a} / ${b}`,
        value: corr,
      });
    }
  }

  return results;
}

// ── Generate insights from correlation data ──
export function generateCorrelationInsights(pairs: CorrelationPair[]): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // Filter out diagonal
  const offDiag = pairs.filter((p) => p.x !== p.y);

  // Unique pairs only (avoid A-B and B-A duplicates)
  const seen = new Set<string>();
  const unique = offDiag.filter((p) => {
    const key = [p.x, p.y].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by absolute value
  const sorted = [...unique].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Strongest correlation
  if (sorted[0]) {
    const s = sorted[0];
    insights.push({
      type: "strongest",
      title: "Corrélation la plus forte",
      description: `${s.x} et ${s.y} montrent une corrélation de ${s.value.toFixed(2)} — ces prix bougent ensemble. Surveiller pour opportunités de hedging croisé.`,
      pairs: [s.x, s.y],
      value: s.value,
    });
  }

  // Weakest (most independent)
  const weakest = sorted[sorted.length - 1];
  if (weakest && Math.abs(weakest.value) < 0.2) {
    insights.push({
      type: "weakest",
      title: "Diversification maximale",
      description: `${weakest.x} et ${weakest.y} sont quasi-indépendants (r=${weakest.value.toFixed(2)}). Idéal pour diversifier le portefeuille produits.`,
      pairs: [weakest.x, weakest.y],
      value: weakest.value,
    });
  }

  // Biggest divergence (trend falling)
  const diverging = unique.filter((p) => p.trend === "falling").sort((a, b) => (a.value - a.prevValue) - (b.value - b.prevValue));
  if (diverging[0]) {
    const d = diverging[0];
    insights.push({
      type: "divergence",
      title: "Divergence détectée",
      description: `La corrélation ${d.x}/${d.y} est passée de ${d.prevValue.toFixed(2)} à ${d.value.toFixed(2)} — les marchés divergent. Vérifier les fondamentaux.`,
      pairs: [d.x, d.y],
      value: d.value - d.prevValue,
    });
  }

  // Opportunity: caroube decoupling from cocoa
  const caroubeCocoa = unique.find((p) => (p.x === "Cacao" && p.y === "Caroube") || (p.x === "Caroube" && p.y === "Cacao"));
  if (caroubeCocoa && caroubeCocoa.value < 0.5) {
    insights.push({
      type: "opportunity",
      title: "Découplage caroube/cacao",
      description: `La corrélation caroube-cacao est à ${caroubeCocoa.value.toFixed(2)} — la caroube s'affranchit du cacao. Renforcer le positionnement alternatif auprès des clients.`,
      pairs: ["Caroube", "Cacao"],
      value: caroubeCocoa.value,
    });
  }

  return insights;
}

// ── Legacy functions (updated) ──
export function generateSpreadHistory(days: number): SpreadPoint[] {
  const points: SpreadPoint[] = [];
  const now = new Date();
  let cocoa = 8800;
  let carob = 4200;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    cocoa = Math.max(5000, Math.min(12000, cocoa + (Math.random() - 0.47) * 120));
    carob = Math.max(2000, Math.min(6000, carob + (Math.random() - 0.49) * 40));
    points.push({
      date: d.toISOString().split("T")[0],
      cocoa: Math.round(cocoa),
      carob: Math.round(carob),
      spread: Math.round(cocoa - carob),
    });
  }
  return points;
}

// Keep backward compat — but prefer computeCorrelationMatrix
export function generateCorrelationMatrix(): CorrelationPair[] {
  const series = generateCommodityTimeSeries(180);
  return computeCorrelationMatrix(series);
}

export function generateMarketSignals(spreads: SpreadPoint[]): MarketSignal[] {
  const signals: MarketSignal[] = [];
  const latest = spreads[spreads.length - 1];
  const avg30 = spreads.slice(-30).reduce((s, p) => s + p.spread, 0) / 30;
  const avg90 = spreads.slice(-90).reduce((s, p) => s + p.spread, 0) / Math.min(90, spreads.length);

  if (latest.spread > avg30 * 1.15) {
    signals.push({
      id: "spread-high", type: "buy", commodity: "Caroube",
      message: `Spread cacao/caroube à $${latest.spread}/t — supérieur de 15% à la moyenne 30j. Opportunité commerciale forte.`,
      strength: 0.85, timestamp: new Date().toISOString(),
    });
  }

  if (latest.cocoa > 9500) {
    signals.push({
      id: "cocoa-high", type: "buy", commodity: "Caroube",
      message: `Cacao à $${latest.cocoa}/t — niveau historiquement haut. Les industriels cherchent activement des substituts.`,
      strength: 0.9, timestamp: new Date().toISOString(),
    });
  }

  if (avg30 > avg90 * 1.1) {
    signals.push({
      id: "trend-up", type: "hold", commodity: "Spread",
      message: `Tendance haussière du spread confirmée. Moyenne 30j ($${Math.round(avg30)}) > moyenne 90j ($${Math.round(avg90)}).`,
      strength: 0.7, timestamp: new Date().toISOString(),
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "neutral", type: "hold", commodity: "Marché",
      message: "Marché stable. Pas de signal fort détecté. Maintenir les positions actuelles.",
      strength: 0.5, timestamp: new Date().toISOString(),
    });
  }

  return signals;
}
