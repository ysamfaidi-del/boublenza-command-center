/* ── V2 Google Connect Sales Types ── */

export interface V2RevenueSummary {
  quarterTarget: number;
  qtdRevenue: number;
  gapToTarget: number;
  financeOutlook: number;
  financeOutlookPct: number;
  salesOutlook: number;
  salesOutlookAmount: number;
  weekOverWeek: number;
  weekOverWeekAmount: number;
  qtdYearOverYear: number;
  qtdYearOverYearAmount: number;
  quarterProgress: number;
  targetAttainment: number;
}

export interface V2TrendPoint {
  date: string;
  revenue: number;
  target: number;
  lastYear: number;
  outlook: number;
}

export interface V2Mover {
  name: string;
  change7d: number;
  wow: number;
  wowInsight?: string;
  accts: number;
}

export interface V2Account {
  account: string;
  accountId?: string;
  change1d: number;
  dd: number;
  trend7d: number[];
}

export interface V2Todo {
  id: string;
  label: string;
  icon: string;
  value?: string;
  count?: number;
  severity: "critical" | "warning" | "info";
}

export interface V2NewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface V2ProductSales {
  name: string;
  revenue: number;
  quantity: number;
  margin?: number;
  marginPct?: number;
}

export interface V2TopClient {
  name: string;
  country: string;
  revenue: number;
  orders: number;
  trend: "up" | "stable" | "down";
}

export interface V2RecentOrder {
  id: string;
  client: string;
  product: string;
  amount: number;
  status: string;
  date: string;
  paymentStatus: string;
}

export interface V2ProductionPoint {
  month: string;
  actual: number;
  target: number;
}

/* ── Sales CRM Types ── */

export interface V2SalesRep {
  id: string;
  name: string;
  email: string;
  role: string;
  territory: string;
  quota: number;
  avatar?: string;
  phone?: string;
  dealsWon: number;
  dealsLost: number;
  pipelineValue: number;
  quotaAttainment: number;
  activitiesCount: number;
  googleConnected: boolean;
}

export interface V2Lead {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source: "website" | "referral" | "linkedin" | "trade_show";
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes?: string;
  repId: string;
  repName: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage = "prospection" | "qualification" | "proposition" | "negociation" | "closing" | "won" | "lost";

export interface V2Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  product: string;
  quantity?: number;
  repId: string;
  repName: string;
  leadCompany?: string;
  expectedClose?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface V2Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  subject: string;
  body?: string;
  repName: string;
  leadCompany?: string;
  dealTitle?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface V2PipelineSummary {
  totalPipeline: number;
  weightedValue: number;
  winRate: number;
  avgDealSize: number;
  avgCycleDays: number;
  dealsByStage: { stage: DealStage; count: number; value: number }[];
}

export interface V2SalesForecast {
  period: string;
  weighted: number;
  bestCase: number;
  worstCase: number;
  aiAdjusted?: number;
  repId?: string;
  repName?: string;
}

export interface V2GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

export interface V2CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  location?: string;
  description?: string;
}

export interface V2SalesData {
  reps: V2SalesRep[];
  deals: V2Deal[];
  leads: V2Lead[];
  activities: V2Activity[];
  pipeline: V2PipelineSummary;
  forecasts: V2SalesForecast[];
}

export interface V2OverviewData {
  revenueSummary: V2RevenueSummary;
  revenueTrend: V2TrendPoint[];
  topMovers: {
    companies: {
      decliners: V2Mover[];
      risers: V2Mover[];
    };
    accounts: {
      decliners: V2Account[];
      risers: V2Account[];
    };
  };
  todos: V2Todo[];
  anomaliesCount: number;
  news: V2NewsItem[];
  recentLinks: { title: string; subtitle?: string; type: string }[];
  productSales: V2ProductSales[];
  topClients: V2TopClient[];
  recentOrders: V2RecentOrder[];
  productionVsTarget: V2ProductionPoint[];
  kpis: {
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    totalProduction: number;
    productionChange: number;
    activeOrders: number;
    capacityRate: number;
    grossMarginPct: number;
    cashPosition: number;
    ebitda: number;
  };
}
