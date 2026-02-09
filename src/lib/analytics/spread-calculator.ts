import type { SpreadPoint, CorrelationPair, MarketSignal } from "@/types/premium";

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

export function generateCorrelationMatrix(): CorrelationPair[] {
  const commodities = ["Cacao", "Caroube", "Sucre", "Gomme guar", "Vanille"];
  const matrix: number[][] = [
    [1.00, 0.35, 0.62, 0.18, 0.25],
    [0.35, 1.00, 0.22, 0.45, 0.12],
    [0.62, 0.22, 1.00, 0.15, 0.55],
    [0.18, 0.45, 0.15, 1.00, 0.08],
    [0.25, 0.12, 0.55, 0.08, 1.00],
  ];

  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < commodities.length; i++) {
    for (let j = 0; j < commodities.length; j++) {
      pairs.push({ x: commodities[i], y: commodities[j], value: matrix[i][j] });
    }
  }
  return pairs;
}

export function generateMarketSignals(spreads: SpreadPoint[]): MarketSignal[] {
  const signals: MarketSignal[] = [];
  const latest = spreads[spreads.length - 1];
  const avg30 = spreads.slice(-30).reduce((s, p) => s + p.spread, 0) / 30;
  const avg90 = spreads.slice(-90).reduce((s, p) => s + p.spread, 0) / Math.min(90, spreads.length);

  if (latest.spread > avg30 * 1.15) {
    signals.push({
      id: "spread-high",
      type: "buy",
      commodity: "Caroube",
      message: `Spread cacao/caroube à $${latest.spread}/t — supérieur de 15% à la moyenne 30j. Opportunité commerciale forte.`,
      strength: 0.85,
      timestamp: new Date().toISOString(),
    });
  }

  if (latest.cocoa > 9500) {
    signals.push({
      id: "cocoa-high",
      type: "buy",
      commodity: "Caroube",
      message: `Cacao à $${latest.cocoa}/t — niveau historiquement haut. Les industriels cherchent activement des substituts.`,
      strength: 0.9,
      timestamp: new Date().toISOString(),
    });
  }

  if (avg30 > avg90 * 1.1) {
    signals.push({
      id: "trend-up",
      type: "hold",
      commodity: "Spread",
      message: `Tendance haussière du spread confirmée. Moyenne 30j ($${Math.round(avg30)}) > moyenne 90j ($${Math.round(avg90)}).`,
      strength: 0.7,
      timestamp: new Date().toISOString(),
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "neutral",
      type: "hold",
      commodity: "Marché",
      message: "Marché stable. Pas de signal fort détecté. Maintenir les positions actuelles.",
      strength: 0.5,
      timestamp: new Date().toISOString(),
    });
  }

  return signals;
}
