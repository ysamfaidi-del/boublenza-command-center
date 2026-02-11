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
}
