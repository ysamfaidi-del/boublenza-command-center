export interface KpiData {
  label: string;
  value: string;
  change: number;
  icon: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface ProductSales {
  name: string;
  value: number;
  color: string;
}

export interface ProductionVsTarget {
  month: string;
  production: number;
  target: number;
}

export interface TopClient {
  name: string;
  country: string;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  client: string;
  country: string;
  product: string;
  quantity: number;
  total: number;
  status: string;
  date: string;
}

export interface DashboardData {
  kpis: {
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    totalProduction: number;
    productionChange: number;
    activeOrders: number;
    ordersChange: number;
    capacityRate: number;
    grossMarginPct: number;
    budgetRevenue: number;
    actualRevenue: number;
    cashPosition: number;
  };
  monthlyRevenue: MonthlyRevenue[];
  productSales: ProductSales[];
  productionVsTarget: ProductionVsTarget[];
  topClients: TopClient[];
  recentOrders: RecentOrder[];
}

export interface ProductionData {
  monthly: {
    month: string;
    CARUMA: number;
    CARANI: number;
    "CAROB EXTRACT": number;
  }[];
  byQuality: { quality: string; count: number }[];
  byShift: { shift: string; quantity: number }[];
  total: number;
  totalChange: number;
  productionVsTarget: { month: string; target: number; actual: number }[];
  costPerKg: {
    product: string;
    cost: number;
    breakdown: { raw: number; labor: number; energy: number; packaging: number; overhead: number };
  }[];
  yieldRate: { product: string; yieldPct: number }[];
  qualityRate: number;
}

export interface Reseller {
  id: string;
  name: string;
  country: string;
  type: "distributeur" | "grossiste" | "agent";
  status: "actif" | "onboarding" | "inactif";
  since: string;
  contactName: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  lastOrderDate: string;
  growthRate: number;
  paymentScore: number;
  productsHandled: string[];
  monthlyRevenue: { month: string; revenue: number }[];
  target: number;
}

export interface RecentOrder {
  id: string;
  client: string;
  country: string;
  date: string;
  status: string;
  totalAmount: number;
  margin: number;
  marginPct: number;
  paymentStatus: "received" | "pending" | "overdue" | "partial";
  paidAmount: number;
  products: string[];
}

export interface SalesData {
  byCountry: { country: string; revenue: number; orders: number }[];
  byProduct: { name: string; revenue: number; quantity: number; margin?: number; marginPct?: number }[];
  pipeline: { status: string; count: number; amount: number }[];
  monthly: { month: string; revenue: number; orders: number }[];
  resellers: Reseller[];
  recentOrders?: RecentOrder[];
}

export interface StockData {
  current: { product: string; quantity: number; minThreshold: number; status: string }[];
  movements: { date: string; product: string; type: string; quantity: number; reason: string }[];
  trends: { month: string; CARUMA: number; CARANI: number; "CAROB EXTRACT": number }[];
}

// ── Slides IA ──────────────────────────────────────────

export interface AIProviderInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  note?: string;
  chartType?: "bar" | "pie" | "line" | "table";
  chartData?: Record<string, unknown>[];
}

export interface SlidesGenerateRequest {
  providerId: string;
  templateType: "monthly_report" | "client_presentation" | "export_review" | "custom";
  customPrompt?: string;
  period?: string;
  language?: "fr" | "en";
}

export interface SlidesGenerateResponse {
  slides: SlideContent[];
  title: string;
  generatedBy: string;
}

// ── Import Excel ───────────────────────────────────────

export interface ColumnMapping {
  excelColumn: string;
  dbField: string;
  sampleValues: string[];
  confidence: number;
}

export interface ImportParseResult {
  dataType: "clients" | "orders" | "production" | "stocks";
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  mapping: ColumnMapping[];
}

export interface ImportExecuteResult {
  imported: number;
  errors: number;
  skipped: number;
  details: string[];
}

// ── Prévisions & Marchés ──────────────────────────────

export interface CocoaPricePoint {
  date: string;
  price: number;
  volume?: number;
}

export interface MarketData {
  currentPrice: number;
  change24h: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  history: CocoaPricePoint[];
}

export interface MarketTrend {
  sector: string;
  demandGrowth: number;
  volume: number;
  growth: number;
  marketSize: string;
  topCountries: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  url?: string;
}

export interface DemandForecast {
  product: string;
  forecasts: { month: string; predicted: number; lower: number; upper: number }[];
  trend: string;
  recommendation: string;
}

// ── Marché Mondial ──────────────────────────────────

export interface ForexRate {
  pair: string;
  rate: number;
  change24h: number;
  changePercent: number;
}

export interface MarketMondialData {
  cocoa: {
    currentPrice: number;
    change: number;
    changePercent: number;
    history: CocoaPricePoint[];
  };
  forex: ForexRate[];
  forexHistory: { date: string; USD: number; GBP: number; DZD: number }[];
  trends: MarketTrend[];
  news: NewsItem[];
  carobVsCocoa: {
    carobPrice: number;
    cocoaPrice: number;
    spread: number;
    spreadPercent: number;
  };
}
