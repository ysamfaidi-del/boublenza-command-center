// ── War Room ──────────────────────────────────────────
export interface WarRoomKPI {
  label: string;
  value: number;
  currency?: string;
  trend: number;
  severity: "normal" | "warning" | "critical";
}

export interface PnLBreakdown {
  product: string;
  revenue: number;
  costOfGoods: number;
  grossMargin: number;
  grossMarginPct: number;
  netMargin: number;
  ebitda: number;
}

export interface OpenPosition {
  orderId: string;
  client: string;
  country: string;
  product: string;
  quantity: number;
  value: number;
  currency: string;
  status: string;
  deliveryDate: string;
  daysUntilDelivery: number;
}

export interface CurrencyExposure {
  currency: string;
  total: number;
  pct: number;
  orders: number;
}

export interface CriticalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface ExportFlow {
  from: [number, number];
  to: [number, number];
  toLabel: string;
  value: number;
  orders: number;
}

export interface WarRoomData {
  kpis: Record<string, WarRoomKPI>;
  pnl: PnLBreakdown[];
  positions: OpenPosition[];
  currencies: CurrencyExposure[];
  alerts: CriticalAlert[];
  flows: ExportFlow[];
  lastUpdate: string;
}

// ── Commodity Intelligence ────────────────────────────
export interface SpreadPoint {
  date: string;
  cocoa: number;
  carob: number;
  spread: number;
}

export interface CorrelationPair {
  x: string;
  y: string;
  value: number;
  significance: "strong" | "moderate" | "weak" | "none";
  trend: "rising" | "falling" | "stable";
  prevValue: number;
}

export interface CorrelationInsight {
  type: "strongest" | "weakest" | "divergence" | "opportunity";
  title: string;
  description: string;
  pairs: [string, string];
  value: number;
}

export interface CommodityTimeSeries {
  date: string;
  prices: Record<string, number>;
}

export interface RollingCorrelation {
  date: string;
  pair: string;
  value: number;
}

export interface MarketSignal {
  id: string;
  type: "buy" | "sell" | "hold";
  commodity: string;
  message: string;
  strength: number;
  timestamp: string;
}

export interface CommodityData {
  spreads: SpreadPoint[];
  correlations: CorrelationPair[];
  signals: MarketSignal[];
  fundamentals: { label: string; value: string; trend: number }[];
  timeSeries: CommodityTimeSeries[];
  rollingCorrelations: RollingCorrelation[];
  insights: CorrelationInsight[];
  commodityList: string[];
}

// ── Risk Management ───────────────────────────────────
export interface VaRResult {
  var95: number;
  var99: number;
  expectedShortfall: number;
  exposureByType: { type: string; amount: number; pct: number }[];
}

export interface StressScenario {
  name: string;
  cocoaChange: number;
  fxChange: number;
  impactRevenue: number;
  impactMargin: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface HedgeScenario {
  strategy: string;
  cost: number;
  protection: number;
  netBenefit: number;
  recommendation: boolean;
}

export interface CounterpartyScore {
  clientId: string;
  client: string;
  country: string;
  paymentScore: number;
  volumeScore: number;
  riskRating: "A" | "B" | "C" | "D";
  totalExposure: number;
  avgPaymentDays: number;
}

// ── Supply Chain ──────────────────────────────────────
export interface Shipment {
  id: string;
  client: string;
  destination: string;
  product: string;
  quantity: number;
  status: "preparing" | "in_transit" | "customs" | "delivered" | "delayed";
  departureDate: string;
  eta: string;
  daysRemaining: number;
}

export interface LeadTimeData {
  destination: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  onTimeRate: number;
  shipments: number;
}

export interface Bottleneck {
  stage: string;
  severity: "low" | "medium" | "high";
  description: string;
  impact: string;
  avgDelay: number;
}

export interface QualityLot {
  lotId: string;
  product: string;
  date: string;
  quantity: number;
  quality: string;
  destination: string;
  status: string;
}

// ── Commercial Intelligence ───────────────────────────
export interface Deal {
  id: string;
  client: string;
  country: string;
  product: string;
  value: number;
  probability: number;
  weightedValue: number;
  stage: string;
  expectedClose: string;
}

export interface ClientScore {
  clientId: string;
  client: string;
  country: string;
  ltv: number;
  churnRisk: number;
  upsellPotential: number;
  overallScore: number;
  tier: "platinum" | "gold" | "silver" | "bronze";
}

export interface PricingRecommendation {
  product: string;
  currentPrice: number;
  recommendedPrice: number;
  marketAvg: number;
  competitorRange: [number, number];
  confidence: number;
  rationale: string;
}

export interface RFQ {
  id: string;
  client: string;
  product: string;
  quantity: number;
  requestedPrice: number;
  date: string;
  status: "pending" | "quoted" | "accepted" | "rejected";
  suggestedPrice: number;
}

// ── Executive Reporting ───────────────────────────────
export interface ExecutiveSummary {
  period: string;
  revenue: number;
  revenuePrev: number;
  grossMargin: number;
  grossMarginPrev: number;
  topProduct: string;
  topMarket: string;
  keyHighlights: string[];
  keyRisks: string[];
}

export interface BenchmarkData {
  metric: string;
  boublenza: number;
  industryAvg: number;
  topPerformer: number;
  unit: string;
}

export interface ScenarioProjection {
  year: number;
  pessimistic: number;
  baseline: number;
  optimistic: number;
  p10: number;
  p90: number;
}

export interface YoYMetric {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePct: number;
}
