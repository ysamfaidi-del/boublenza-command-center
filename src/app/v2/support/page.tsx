"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ComposedChart, Area, Line, LineChart,
  Cell,
} from "recharts";

/* ───────────── Types ───────────── */
interface VaRData { method: string; confidence: string; horizon: string; value: number; }
interface StressScenario { name: string; description: string; pnlImpact: number; probability: string; }
interface Counterparty { name: string; exposure: number; limit: number; utilization: number; rating: string; }
interface VaRBacktest { date: string; predicted: number; actual: number; breach: boolean; }

interface Greek { instrument: string; type: string; expiry: string; notional: number; delta: number; gamma: number; vega: number; theta: number; rho: number; mtm: number; }
interface FuturesCurvePoint { month: string; settlement: number; bid: number; ask: number; basis: number; oi: number; volume: number; }
interface PnLWaterfall { factor: string; value: number; cumulative: number; }
interface HedgeStrategy { name: string; type: string; cost: number; maxLoss: number; maxGain: string; effectiveness: number; recommended: boolean; }
interface TradingLimit { entity: string; level: string; limit: number; used: number; utilization: number; breach: boolean; }
interface Position { product: string; direction: string; quantity: number; entryPrice: number; currentPrice: number; pnl: number; delta: number; }
interface PnLPoint { date: string; realized: number; unrealized: number; total: number; }

interface SupportData {
  var: VaRData[];
  stressScenarios: StressScenario[];
  counterparties: Counterparty[];
  varBacktest: VaRBacktest[];
  greeks: Greek[];
  futuresCurve: FuturesCurvePoint[];
  pnlWaterfall: PnLWaterfall[];
  hedgeStrategies: HedgeStrategy[];
  tradingLimits: TradingLimit[];
  positions: Position[];
  pnlAttribution: PnLPoint[];
  portfolioVaR: number;
  totalExposure: number;
  activePositions: number;
  breachCount: number;
  netDelta: number;
  portfolioGamma: number;
  mtmPnL: number;
  dailyTheta: number;
}

type TabKey = "risk" | "trading" | "greeks" | "futures" | "hedging";

/* ───────────── Helpers ───────────── */
function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

/* ───────────── Demo Data ───────────── */
function getDemoTradingData() {
  const greeks: Greek[] = [
    { instrument: "CARUMA Call Mar-25", type: "Call", expiry: "2025-03-21", notional: 250000, delta: 0.62, gamma: 0.045, vega: 18500, theta: -420, rho: 125, mtm: 14200 },
    { instrument: "CARUMA Put Mar-25", type: "Put", expiry: "2025-03-21", notional: 150000, delta: -0.38, gamma: 0.038, vega: 12200, theta: -310, rho: -82, mtm: -3800 },
    { instrument: "Cocoa Call Jun-25", type: "Call", expiry: "2025-06-20", notional: 500000, delta: 0.55, gamma: 0.028, vega: 32000, theta: -580, rho: 245, mtm: 28500 },
    { instrument: "EUR/DZD Put Q2", type: "Put", expiry: "2025-06-30", notional: 800000, delta: -0.42, gamma: 0.015, vega: 8400, theta: -190, rho: -320, mtm: -12400 },
    { instrument: "Cocoa Collar Sep-25", type: "Collar", expiry: "2025-09-19", notional: 300000, delta: 0.18, gamma: 0.022, vega: 15800, theta: -280, rho: 95, mtm: 6800 },
    { instrument: "CAROB FWD Dec-25", type: "Forward", expiry: "2025-12-19", notional: 400000, delta: 1.0, gamma: 0, vega: 0, theta: -45, rho: 180, mtm: 8200 },
  ];

  const futuresCurve: FuturesCurvePoint[] = [
    { month: "Feb-25", settlement: 4.52, bid: 4.50, ask: 4.54, basis: 0, oi: 12500, volume: 3200 },
    { month: "Mar-25", settlement: 4.58, bid: 4.56, ask: 4.60, basis: 0.06, oi: 18200, volume: 5100 },
    { month: "Apr-25", settlement: 4.63, bid: 4.61, ask: 4.66, basis: 0.11, oi: 14800, volume: 2800 },
    { month: "May-25", settlement: 4.67, bid: 4.64, ask: 4.70, basis: 0.15, oi: 9600, volume: 1900 },
    { month: "Jun-25", settlement: 4.71, bid: 4.68, ask: 4.74, basis: 0.19, oi: 11200, volume: 2400 },
    { month: "Jul-25", settlement: 4.74, bid: 4.71, ask: 4.77, basis: 0.22, oi: 7800, volume: 1500 },
    { month: "Sep-25", settlement: 4.78, bid: 4.75, ask: 4.82, basis: 0.26, oi: 6200, volume: 1100 },
    { month: "Dec-25", settlement: 4.85, bid: 4.82, ask: 4.89, basis: 0.33, oi: 4500, volume: 800 },
  ];

  const pnlWaterfall: PnLWaterfall[] = [
    { factor: "Market Move", value: 32000, cumulative: 32000 },
    { factor: "Carry", value: 8500, cumulative: 40500 },
    { factor: "Spread", value: -4200, cumulative: 36300 },
    { factor: "Theta", value: -1825, cumulative: 34475 },
    { factor: "Vega", value: 12400, cumulative: 46875 },
    { factor: "Gamma", value: 3200, cumulative: 50075 },
    { factor: "FX", value: -6800, cumulative: 43275 },
    { factor: "Other", value: 1925, cumulative: 45200 },
  ];

  const hedgeStrategies: HedgeStrategy[] = [
    { name: "No Hedge", type: "None", cost: 0, maxLoss: -180000, maxGain: "Unlimited", effectiveness: 0, recommended: false },
    { name: "Vanilla Put", type: "Option", cost: 12500, maxLoss: -12500, maxGain: "Unlimited", effectiveness: 78, recommended: false },
    { name: "Zero-Cost Collar", type: "Structure", cost: 0, maxLoss: -45000, maxGain: "$62,000", effectiveness: 92, recommended: true },
    { name: "Full Forward", type: "Forward", cost: 800, maxLoss: -800, maxGain: "$0", effectiveness: 100, recommended: false },
    { name: "Seagull Spread", type: "Structure", cost: 3200, maxLoss: -28000, maxGain: "$85,000", effectiveness: 85, recommended: false },
  ];

  const tradingLimits: TradingLimit[] = [
    { entity: "Cargill EMEA", level: "Counterparty", limit: 500000, used: 180000, utilization: 36, breach: false },
    { entity: "CARUMA Portfolio", level: "Product", limit: 800000, used: 620000, utilization: 77.5, breach: false },
    { entity: "Derivatives Desk", level: "Desk", limit: 2000000, used: 1850000, utilization: 92.5, breach: true },
    { entity: "Amine Boukhelfa", level: "Trader", limit: 300000, used: 245000, utilization: 81.7, breach: false },
    { entity: "Sarah Medjdoub", level: "Trader", limit: 200000, used: 178000, utilization: 89, breach: false },
    { entity: "Barry Callebaut", level: "Counterparty", limit: 300000, used: 85000, utilization: 28.3, breach: false },
    { entity: "Olam Intl", level: "Counterparty", limit: 250000, used: 200000, utilization: 80, breach: false },
    { entity: "EXTRACT Portfolio", level: "Product", limit: 400000, used: 180000, utilization: 45, breach: false },
  ];

  return { greeks, futuresCurve, pnlWaterfall, hedgeStrategies, tradingLimits };
}

function getFullDemoData(): SupportData {
  const t = getDemoTradingData();
  const netDelta = t.greeks.reduce((s, g) => s + g.delta * g.notional / 100000, 0);
  const portfolioGamma = t.greeks.reduce((s, g) => s + g.gamma * g.notional / 100000, 0);
  const dailyTheta = t.greeks.reduce((s, g) => s + g.theta, 0);
  const mtmPnL = t.greeks.reduce((s, g) => s + g.mtm, 0);

  return {
    var: [
      { method: "Historical", confidence: "95%", horizon: "1-day", value: 45000 },
      { method: "Monte Carlo", confidence: "99%", horizon: "1-day", value: 72000 },
      { method: "Parametric", confidence: "95%", horizon: "10-day", value: 142000 },
    ],
    stressScenarios: [
      { name: "Cocoa Price Crash -30%", description: "Major cocoa market correction impacts carob substitution demand", pnlImpact: -180000, probability: "Low (5%)" },
      { name: "EUR/DZD Devaluation", description: "Algerian Dinar 15% devaluation against Euro", pnlImpact: -95000, probability: "Medium (15%)" },
      { name: "Supply Chain Disruption", description: "Mediterranean shipping routes blocked 3+ weeks", pnlImpact: -120000, probability: "Low (8%)" },
      { name: "Carob Demand Surge +40%", description: "Health food trend accelerates carob adoption", pnlImpact: 220000, probability: "Medium (20%)" },
    ],
    counterparties: [
      { name: "Cargill EMEA", exposure: 180000, limit: 500000, utilization: 36, rating: "A+" },
      { name: "Barry Callebaut", exposure: 85000, limit: 300000, utilization: 28, rating: "A" },
      { name: "Olam Intl", exposure: 200000, limit: 250000, utilization: 80, rating: "BBB+" },
      { name: "SunOpta", exposure: 45000, limit: 150000, utilization: 30, rating: "BBB" },
    ],
    varBacktest: [
      { date: "Mon", predicted: 45000, actual: 28000, breach: false },
      { date: "Tue", predicted: 45000, actual: 52000, breach: true },
      { date: "Wed", predicted: 45000, actual: 31000, breach: false },
      { date: "Thu", predicted: 45000, actual: 19000, breach: false },
      { date: "Fri", predicted: 45000, actual: 38000, breach: false },
    ],
    positions: [
      { product: "CARUMA Futures Q2", direction: "Long", quantity: 30, entryPrice: 4.35, currentPrice: 4.52, pnl: 5100, delta: 0.92 },
      { product: "Cocoa Hedge Oct", direction: "Short", quantity: 5, entryPrice: 3180, currentPrice: 3220, pnl: -200, delta: -0.78 },
      { product: "EUR/DZD Forward", direction: "Long", quantity: 500000, entryPrice: 148.5, currentPrice: 147.8, pnl: -350, delta: 0.65 },
      { product: "CARANI Physical Q1", direction: "Long", quantity: 80, entryPrice: 1.95, currentPrice: 2.05, pnl: 8000, delta: 1.0 },
    ],
    pnlAttribution: [
      { date: "Week 1", realized: 12000, unrealized: 5000, total: 17000 },
      { date: "Week 2", realized: 8000, unrealized: -3000, total: 5000 },
      { date: "Week 3", realized: 15000, unrealized: 8500, total: 23500 },
      { date: "Week 4", realized: 6000, unrealized: -1200, total: 4800 },
    ],
    ...t,
    portfolioVaR: 45000,
    totalExposure: 523550,
    activePositions: 4,
    breachCount: 1,
    netDelta: Math.round(netDelta * 100) / 100,
    portfolioGamma: Math.round(portfolioGamma * 1000) / 1000,
    mtmPnL: mtmPnL,
    dailyTheta: dailyTheta,
  };
}

/* ───────────── WATERFALL COLORS ───────────── */
const WATERFALL_COLORS: Record<string, string> = {
  "Market Move": "#1a73e8",
  "Carry": "#188038",
  "Spread": "#f9ab00",
  "Theta": "#d93025",
  "Vega": "#8e24aa",
  "Gamma": "#00897b",
  "FX": "#e65100",
  "Other": "#80868b",
};

/* ═══════════════════ COMPONENT ═══════════════════ */
export default function SupportPage() {
  const [data, setData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("risk");
  const [limitFilter, setLimitFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/risk").then((r) => r.json()),
      fetch("/api/trading").then((r) => r.json()),
    ])
      .then(([risk, trading]) => {
        const varData: VaRData[] = (risk.var ? (Array.isArray(risk.var) ? risk.var : [risk.var]) : []).map((v: Record<string, unknown>) => ({
          method: String(v.method || "Historical"),
          confidence: String(v.confidence || "95%"),
          horizon: String(v.horizon || "1-day"),
          value: Number(v.value || v.amount || 0),
        }));
        const stressScenarios: StressScenario[] = (risk.stressScenarios || []).map((s: Record<string, unknown>) => ({
          name: String(s.name || ""),
          description: String(s.description || s.desc || ""),
          pnlImpact: Number(s.pnlImpact || s.impact || 0),
          probability: String(s.probability || s.prob || ""),
        }));
        const counterparties: Counterparty[] = (risk.counterparties || []).map((c: Record<string, unknown>) => ({
          name: String(c.name || ""),
          exposure: Number(c.exposure || 0),
          limit: Number(c.limit || 0),
          utilization: Number(c.utilization || (Number(c.limit || 1) > 0 ? Number(c.exposure || 0) / Number(c.limit || 1) * 100 : 0)),
          rating: String(c.rating || ""),
        }));
        const positions: Position[] = (trading.positions || []).map((p: Record<string, unknown>) => ({
          product: String(p.product || p.instrument || ""),
          direction: String(p.direction || p.side || ""),
          quantity: Number(p.quantity || p.qty || 0),
          entryPrice: Number(p.entryPrice || p.entry || 0),
          currentPrice: Number(p.currentPrice || p.current || p.mark || 0),
          pnl: Number(p.pnl || p.unrealizedPnl || 0),
          delta: Number(p.delta || 0),
        }));
        const pnlAttribution: PnLPoint[] = (trading.pnlAttribution || []).map((p: Record<string, unknown>) => ({
          date: String(p.date || p.period || ""),
          realized: Number(p.realized || 0),
          unrealized: Number(p.unrealized || 0),
          total: Number(p.total || (Number(p.realized || 0) + Number(p.unrealized || 0))),
        }));
        const varBacktest: VaRBacktest[] = (trading.varBacktest || []).map((v: Record<string, unknown>) => ({
          date: String(v.date || ""),
          predicted: Number(v.predicted || v.var || 0),
          actual: Number(v.actual || v.loss || 0),
          breach: Boolean(v.breach || (Number(v.actual || 0) > Number(v.predicted || 0))),
        }));

        const demoTrading = getDemoTradingData();

        const netDelta = demoTrading.greeks.reduce((s, g) => s + g.delta * g.notional / 100000, 0);
        const portfolioGamma = demoTrading.greeks.reduce((s, g) => s + g.gamma * g.notional / 100000, 0);
        const dailyTheta = demoTrading.greeks.reduce((s, g) => s + g.theta, 0);
        const mtmPnL = demoTrading.greeks.reduce((s, g) => s + g.mtm, 0);

        setData({
          var: varData,
          stressScenarios,
          counterparties,
          varBacktest,
          positions,
          pnlAttribution,
          ...demoTrading,
          portfolioVaR: varData.length ? varData[0].value : 45000,
          totalExposure: positions.reduce((s, p) => s + Math.abs(p.pnl), 0) + counterparties.reduce((s, c) => s + c.exposure, 0),
          activePositions: positions.length,
          breachCount: varBacktest.filter((v) => v.breach).length,
          netDelta: Math.round(netDelta * 100) / 100,
          portfolioGamma: Math.round(portfolioGamma * 1000) / 1000,
          mtmPnL,
          dailyTheta,
        });
      })
      .catch((err) => {
        console.error("[V2 Support] Failed to load data, using demo fallback:", err);
        setData(getFullDemoData());
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading support">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading support...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  /* ── Portfolio Greeks totals ── */
  const greeksTotal = {
    delta: data.greeks.reduce((s, g) => s + g.delta * g.notional / 100000, 0),
    gamma: data.greeks.reduce((s, g) => s + g.gamma * g.notional / 100000, 0),
    vega: data.greeks.reduce((s, g) => s + g.vega, 0),
    theta: data.greeks.reduce((s, g) => s + g.theta, 0),
    rho: data.greeks.reduce((s, g) => s + g.rho, 0),
    notional: data.greeks.reduce((s, g) => s + g.notional, 0),
    mtm: data.greeks.reduce((s, g) => s + g.mtm, 0),
  };

  /* ── Futures curve shape ── */
  const curveShape = data.futuresCurve.length >= 2
    ? data.futuresCurve[data.futuresCurve.length - 1].settlement > data.futuresCurve[0].settlement
      ? "Contango"
      : "Backwardation"
    : "Flat";
  const avgSpread = data.futuresCurve.length
    ? (data.futuresCurve.reduce((s, p) => s + (p.ask - p.bid), 0) / data.futuresCurve.length).toFixed(3)
    : "0";
  const totalOI = data.futuresCurve.reduce((s, p) => s + p.oi, 0);

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip (8 metrics) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Portfolio VaR (95%)", value: fmt(data.portfolioVaR), sub: "1-day horizon" },
          { label: "Total Exposure", value: fmt(data.totalExposure), sub: "all counterparties" },
          { label: "Active Positions", value: String(data.activePositions), sub: "open trades" },
          { label: "VaR Breaches", value: `${data.breachCount}/5`, sub: "last 5 days", alert: data.breachCount > 1 },
          { label: "Net Delta (Δ)", value: data.netDelta.toFixed(2), sub: "portfolio delta" },
          { label: "Portfolio Γ", value: data.portfolioGamma.toFixed(3), sub: "gamma exposure" },
          { label: "MTM P&L", value: fmt(data.mtmPnL), sub: "mark-to-market", positive: data.mtmPnL > 0 },
          { label: "Daily Θ", value: fmt(data.dailyTheta), sub: "theta decay", alert: true },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-3 py-2.5">
              <p className="v2-kpi-label truncate">{k.label}</p>
              <p className={`v2-kpi-value text-[16px] ${
                "positive" in k && k.positive ? "text-gcs-green" :
                "alert" in k && k.alert ? "text-gcs-red" : ""
              }`}>{k.value}</p>
              <p className="v2-kpi-sub truncate">{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs (5) ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200 overflow-x-auto">
        {([
          { key: "risk" as TabKey, label: "Risk Management" },
          { key: "trading" as TabKey, label: "Trading Book" },
          { key: "greeks" as TabKey, label: "Greeks & Derivatives" },
          { key: "futures" as TabKey, label: "Futures Curve" },
          { key: "hedging" as TabKey, label: "Hedging Optimizer" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap ${tab === t.key ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab 1: Risk Management ═══ */}
      {tab === "risk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <V2Card title="Value at Risk (VaR)" subtitle="Multiple methodologies">
              <table className="v2-table">
                <thead><tr><th>Method</th><th>Confidence</th><th>Horizon</th><th>VaR</th></tr></thead>
                <tbody>
                  {data.var.map((v) => (
                    <tr key={v.method + v.confidence}>
                      <td className="font-medium">{v.method}</td>
                      <td>{v.confidence}</td>
                      <td>{v.horizon}</td>
                      <td className="text-gcs-red font-medium">{fmt(v.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </V2Card>
            <V2Card title="VaR Backtesting" subtitle="Predicted vs actual losses">
              <div className="px-4 py-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.varBacktest}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area dataKey="predicted" fill="#fce8e6" stroke="#d93025" strokeDasharray="5 5" name="VaR Limit" />
                    <Bar dataKey="actual" name="Actual Loss" radius={[4, 4, 0, 0]} fill="#1a73e8" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </V2Card>
          </div>

          <V2Card title="Counterparty Exposure" subtitle={`${data.counterparties.length} active counterparties`}>
            <table className="v2-table">
              <thead><tr><th>Counterparty</th><th>Exposure</th><th>Limit</th><th>Utilization</th><th>Rating</th><th>Status</th></tr></thead>
              <tbody>
                {data.counterparties.map((c) => (
                  <tr key={c.name}>
                    <td className="font-medium">{c.name}</td>
                    <td>{fmt(c.exposure)}</td>
                    <td>{fmt(c.limit)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-20 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${c.utilization > 75 ? "bg-gcs-red" : c.utilization > 50 ? "bg-gcs-yellow" : "bg-gcs-green"}`}
                            style={{ width: `${Math.min(c.utilization, 100)}%` }} />
                        </div>
                        <span className="text-[11px]">{c.utilization}%</span>
                      </div>
                    </td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      c.rating.startsWith("A") ? "bg-green-50 text-gcs-green" : "bg-yellow-50 text-gcs-yellow"
                    }`}>{c.rating}</span></td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      c.utilization > 75 ? "bg-red-50 text-gcs-red" : "bg-green-50 text-gcs-green"
                    }`}>{c.utilization > 75 ? "Near Limit" : "OK"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>

          {/* Trading Limits by Level */}
          <V2Card title="Trading Limits" subtitle="Granular limits: counterparty / product / desk / trader">
            <div className="px-4 pb-3">
              <FilterDropdown label="Level:" value={limitFilter} options={[
                { label: "All", value: "all" },
                { label: "Counterparty", value: "Counterparty" },
                { label: "Product", value: "Product" },
                { label: "Desk", value: "Desk" },
                { label: "Trader", value: "Trader" },
              ]} onChange={setLimitFilter} />
            </div>
            <table className="v2-table">
              <thead><tr><th>Entity</th><th>Level</th><th>Limit</th><th>Used</th><th>Utilization</th><th>Status</th></tr></thead>
              <tbody>
                {data.tradingLimits
                  .filter((l) => limitFilter === "all" || l.level === limitFilter)
                  .map((l) => (
                  <tr key={l.entity} className={l.breach ? "bg-red-50/50" : ""}>
                    <td className="font-medium">{l.entity}</td>
                    <td><span className="text-[11px] px-2 py-0.5 rounded-full bg-gcs-gray-50 text-gcs-gray-600">{l.level}</span></td>
                    <td>{fmt(l.limit)}</td>
                    <td>{fmt(l.used)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-20 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${l.breach ? "bg-gcs-red animate-pulse" : l.utilization > 80 ? "bg-gcs-yellow" : "bg-gcs-green"}`}
                            style={{ width: `${Math.min(l.utilization, 100)}%` }} />
                        </div>
                        <span className={`text-[11px] ${l.breach ? "text-gcs-red font-bold" : ""}`}>{l.utilization.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      {l.breach ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-gcs-red font-bold animate-pulse">BREACH</span>
                      ) : l.utilization > 80 ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 text-gcs-yellow">Warning</span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-gcs-green">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>

          {/* Stress Scenarios */}
          <V2Card title="Stress Test Scenarios" subtitle={`${data.stressScenarios.length} scenarios`}>
            <table className="v2-table">
              <thead><tr><th>Scenario</th><th>Description</th><th>P&L Impact</th><th>Probability</th><th>Severity</th></tr></thead>
              <tbody>
                {data.stressScenarios.map((s) => (
                  <tr key={s.name}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-gcs-gray-500 max-w-xs">{s.description}</td>
                    <td className={s.pnlImpact >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>
                      {s.pnlImpact >= 0 ? "+" : ""}{fmt(s.pnlImpact)}
                    </td>
                    <td>{s.probability}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      Math.abs(s.pnlImpact) > 150000 ? "bg-red-50 text-gcs-red" :
                      Math.abs(s.pnlImpact) > 80000 ? "bg-yellow-50 text-gcs-yellow" :
                      "bg-green-50 text-gcs-green"
                    }`}>{Math.abs(s.pnlImpact) > 150000 ? "Critical" : Math.abs(s.pnlImpact) > 80000 ? "High" : "Moderate"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ═══ Tab 2: Trading Book ═══ */}
      {tab === "trading" && (
        <div className="space-y-4">
          <V2Card title="Open Positions" subtitle={`${data.positions.length} active`}>
            <table className="v2-table">
              <thead><tr><th>Instrument</th><th>Direction</th><th>Qty</th><th>Entry</th><th>Current</th><th>P&L</th><th>Delta</th></tr></thead>
              <tbody>
                {data.positions.map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium">{p.product}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${p.direction === "Long" ? "bg-green-50 text-gcs-green" : "bg-red-50 text-gcs-red"}`}>{p.direction}</span></td>
                    <td>{fmtNum(p.quantity)}</td>
                    <td>${p.entryPrice.toFixed(2)}</td>
                    <td>${p.currentPrice.toFixed(2)}</td>
                    <td className={p.pnl >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>{p.pnl >= 0 ? "+" : ""}{fmt(p.pnl)}</td>
                    <td>{p.delta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>

          {/* P&L Waterfall (8 factors) */}
          <V2Card title="P&L Attribution Waterfall" subtitle="8-factor risk decomposition · MTD">
            <div className="px-4 py-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pnlWaterfall}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="factor" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmt(v), name]}
                    labelFormatter={(label) => `Factor: ${label}`}
                  />
                  <Bar dataKey="value" name="P&L Contribution" radius={[4, 4, 0, 0]}>
                    {data.pnlWaterfall.map((entry) => (
                      <Cell key={entry.factor} fill={WATERFALL_COLORS[entry.factor] || "#80868b"} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="cumulative" stroke="#202124" strokeWidth={2} dot={{ r: 3 }} name="Cumulative" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="v2-table">
              <thead><tr><th>Factor</th><th>Contribution</th><th>Cumulative</th><th>% of Total</th></tr></thead>
              <tbody>
                {data.pnlWaterfall.map((w) => {
                  const totalPnl = data.pnlWaterfall[data.pnlWaterfall.length - 1]?.cumulative || 1;
                  return (
                    <tr key={w.factor}>
                      <td className="font-medium flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WATERFALL_COLORS[w.factor] || "#80868b" }} />
                        {w.factor}
                      </td>
                      <td className={w.value >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>
                        {w.value >= 0 ? "+" : ""}{fmt(w.value)}
                      </td>
                      <td>{fmt(w.cumulative)}</td>
                      <td>{((w.value / totalPnl) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </V2Card>

          {/* Weekly P&L */}
          <V2Card title="Weekly P&L" subtitle="Realized vs unrealized">
            <div className="px-4 py-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pnlAttribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="realized" fill="#188038" name="Realized" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="unrealized" fill="#1a73e8" name="Unrealized" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>
      )}

      {/* ═══ Tab 3: Greeks & Derivatives ═══ */}
      {tab === "greeks" && (
        <div className="space-y-4">
          {/* Portfolio Greeks Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Net Delta (Δ)", value: greeksTotal.delta.toFixed(2), color: "text-gcs-blue" },
              { label: "Portfolio Gamma (Γ)", value: greeksTotal.gamma.toFixed(3), color: "text-purple-600" },
              { label: "Total Vega (ν)", value: fmt(greeksTotal.vega), color: "text-gcs-green" },
              { label: "Daily Theta (Θ)", value: fmt(greeksTotal.theta), color: "text-gcs-red" },
              { label: "Total Rho (ρ)", value: fmt(greeksTotal.rho), color: "text-orange-600" },
            ].map((g) => (
              <V2Card key={g.label} menu={false}>
                <div className="px-3 py-2.5 text-center">
                  <p className="v2-kpi-label">{g.label}</p>
                  <p className={`text-xl font-semibold ${g.color}`}>{g.value}</p>
                </div>
              </V2Card>
            ))}
          </div>

          {/* Derivatives Book */}
          <V2Card title="Derivatives Book" subtitle={`${data.greeks.length} instruments · Notional: ${fmt(greeksTotal.notional)}`}>
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Instrument</th><th>Type</th><th>Expiry</th><th>Notional</th>
                    <th className="text-gcs-blue">Δ Delta</th>
                    <th className="text-purple-600">Γ Gamma</th>
                    <th className="text-gcs-green">ν Vega</th>
                    <th className="text-gcs-red">Θ Theta</th>
                    <th className="text-orange-600">ρ Rho</th>
                    <th>MTM P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.greeks.map((g) => (
                    <tr key={g.instrument}>
                      <td className="font-medium">{g.instrument}</td>
                      <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        g.type === "Call" ? "bg-green-50 text-gcs-green" :
                        g.type === "Put" ? "bg-red-50 text-gcs-red" :
                        g.type === "Forward" ? "bg-blue-50 text-gcs-blue" :
                        "bg-purple-50 text-purple-600"
                      }`}>{g.type}</span></td>
                      <td className="text-gcs-gray-500">{g.expiry}</td>
                      <td>{fmt(g.notional)}</td>
                      <td className="text-gcs-blue font-medium">{g.delta.toFixed(2)}</td>
                      <td className="text-purple-600">{g.gamma.toFixed(3)}</td>
                      <td className="text-gcs-green">{fmtNum(g.vega)}</td>
                      <td className="text-gcs-red">{fmt(g.theta)}</td>
                      <td className="text-orange-600">{g.rho > 0 ? "+" : ""}{g.rho}</td>
                      <td className={g.mtm >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>
                        {g.mtm >= 0 ? "+" : ""}{fmt(g.mtm)}
                      </td>
                    </tr>
                  ))}
                  {/* Portfolio Total Row */}
                  <tr className="bg-gcs-gray-50 font-bold border-t-2 border-gcs-gray-300">
                    <td>PORTFOLIO TOTAL</td>
                    <td></td>
                    <td></td>
                    <td>{fmt(greeksTotal.notional)}</td>
                    <td className="text-gcs-blue">{greeksTotal.delta.toFixed(2)}</td>
                    <td className="text-purple-600">{greeksTotal.gamma.toFixed(3)}</td>
                    <td className="text-gcs-green">{fmtNum(greeksTotal.vega)}</td>
                    <td className="text-gcs-red">{fmt(greeksTotal.theta)}</td>
                    <td className="text-orange-600">{greeksTotal.rho > 0 ? "+" : ""}{greeksTotal.rho}</td>
                    <td className={greeksTotal.mtm >= 0 ? "text-gcs-green" : "text-gcs-red"}>
                      {greeksTotal.mtm >= 0 ? "+" : ""}{fmt(greeksTotal.mtm)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </V2Card>

          {/* Greeks Distribution Chart */}
          <V2Card title="Greeks by Instrument" subtitle="Delta & Gamma exposure distribution">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.greeks.map((g) => ({
                  name: g.instrument.split(" ")[0] + " " + g.type,
                  delta: g.delta,
                  gamma: g.gamma * 10,
                  vega: g.vega / 1000,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="delta" fill="#1a73e8" name="Delta" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gamma" fill="#8e24aa" name="Gamma ×10" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="vega" stroke="#188038" name="Vega (K)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>
      )}

      {/* ═══ Tab 4: Futures Curve ═══ */}
      {tab === "futures" && (
        <div className="space-y-4">
          {/* Curve Header KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Curve Shape", value: curveShape, color: curveShape === "Contango" ? "text-gcs-blue" : "text-gcs-red" },
              { label: "Front Month", value: `$${data.futuresCurve[0]?.settlement.toFixed(2) || "0"}/kg`, color: "text-gcs-gray-900" },
              { label: "Avg Bid/Ask Spread", value: `$${avgSpread}`, color: "text-gcs-gray-900" },
              { label: "Total Open Interest", value: fmtNum(totalOI), color: "text-gcs-gray-900" },
            ].map((k) => (
              <V2Card key={k.label} menu={false}>
                <div className="px-3 py-2.5 text-center">
                  <p className="v2-kpi-label">{k.label}</p>
                  <p className={`text-lg font-semibold ${k.color}`}>{k.value}</p>
                </div>
              </V2Card>
            ))}
          </div>

          {/* Futures Curve Chart */}
          <V2Card title="CARUMA Futures Curve" subtitle={`${curveShape} structure · ${data.futuresCurve.length} tenors`}>
            <div className="px-4 py-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.futuresCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="price" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} domain={["auto", "auto"]} />
                  <YAxis yAxisId="oi" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip formatter={(v: number, name: string) => [
                    name.includes("OI") ? fmtNum(v) : `$${v.toFixed(3)}`,
                    name,
                  ]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="oi" dataKey="oi" fill="#e8eaed" name="Open Interest" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="price" type="monotone" dataKey="settlement" stroke="#1a73e8" strokeWidth={2.5} dot={{ r: 4 }} name="Settlement" />
                  <Line yAxisId="price" type="monotone" dataKey="bid" stroke="#188038" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Bid" />
                  <Line yAxisId="price" type="monotone" dataKey="ask" stroke="#d93025" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Ask" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </V2Card>

          {/* Curve Details Table */}
          <V2Card title="Curve Details" subtitle="Price, spread, basis & open interest">
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Tenor</th><th>Settlement</th><th>Bid</th><th>Ask</th>
                    <th>Spread</th><th>Basis</th><th>Open Interest</th><th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.futuresCurve.map((p) => (
                    <tr key={p.month}>
                      <td className="font-medium">{p.month}</td>
                      <td className="font-medium">${p.settlement.toFixed(3)}</td>
                      <td className="text-gcs-green">${p.bid.toFixed(3)}</td>
                      <td className="text-gcs-red">${p.ask.toFixed(3)}</td>
                      <td>${(p.ask - p.bid).toFixed(3)}</td>
                      <td className={p.basis > 0 ? "text-gcs-blue" : "text-gcs-red"}>
                        {p.basis > 0 ? "+" : ""}{p.basis.toFixed(3)}
                      </td>
                      <td>{fmtNum(p.oi)}</td>
                      <td className="text-gcs-gray-500">{fmtNum(p.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V2Card>
        </div>
      )}

      {/* ═══ Tab 5: Hedging Optimizer ═══ */}
      {tab === "hedging" && (
        <div className="space-y-4">
          {/* Strategy Comparison */}
          <V2Card title="Hedging Strategy Comparison" subtitle="Cost/benefit analysis for CARUMA Q2 exposure ($400K)">
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Strategy</th><th>Type</th><th>Cost</th><th>Max Loss</th>
                    <th>Max Gain</th><th>Effectiveness</th><th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hedgeStrategies.map((s) => (
                    <tr key={s.name} className={s.recommended ? "bg-blue-50/50" : ""}>
                      <td className="font-medium flex items-center gap-2">
                        {s.recommended && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gcs-blue text-white font-bold">REC</span>}
                        {s.name}
                      </td>
                      <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        s.type === "Option" ? "bg-purple-50 text-purple-600" :
                        s.type === "Forward" ? "bg-blue-50 text-gcs-blue" :
                        s.type === "Structure" ? "bg-green-50 text-gcs-green" :
                        "bg-gcs-gray-50 text-gcs-gray-500"
                      }`}>{s.type}</span></td>
                      <td className={s.cost > 0 ? "text-gcs-red" : "text-gcs-green font-medium"}>
                        {s.cost > 0 ? fmt(s.cost) : "Zero Cost"}
                      </td>
                      <td className="text-gcs-red font-medium">{fmt(s.maxLoss)}</td>
                      <td className="text-gcs-green">{s.maxGain}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-16 rounded-full bg-gcs-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${
                              s.effectiveness >= 90 ? "bg-gcs-green" :
                              s.effectiveness >= 70 ? "bg-gcs-blue" :
                              s.effectiveness >= 40 ? "bg-gcs-yellow" : "bg-gcs-red"
                            }`} style={{ width: `${s.effectiveness}%` }} />
                          </div>
                          <span className="text-[11px]">{s.effectiveness}%</span>
                        </div>
                      </td>
                      <td>
                        {s.recommended ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gcs-blue text-white font-medium">Recommended</span>
                        ) : (
                          <span className="text-[11px] text-gcs-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V2Card>

          {/* Effectiveness Chart */}
          <V2Card title="Strategy Effectiveness vs Cost" subtitle="Optimal frontier analysis">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hedgeStrategies} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="effectiveness" name="Hedge Effectiveness" radius={[0, 4, 4, 0]}>
                    {data.hedgeStrategies.map((s) => (
                      <Cell key={s.name} fill={s.recommended ? "#1a73e8" : s.effectiveness >= 80 ? "#188038" : s.effectiveness >= 50 ? "#f9ab00" : "#d93025"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>

          {/* Recommendation Box */}
          {data.hedgeStrategies.filter((s) => s.recommended).map((s) => (
            <V2Card key={s.name} menu={false}>
              <div className="px-5 py-4 border-l-4 border-gcs-blue bg-blue-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gcs-blue">AI Recommendation: {s.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gcs-blue text-white">OPTIMAL</span>
                </div>
                <p className="text-xs text-gcs-gray-600 leading-relaxed">
                  The {s.name} strategy provides the best risk-adjusted protection for Boublenza&apos;s CARUMA Q2 exposure.
                  At zero premium cost, it caps downside at {fmt(Math.abs(s.maxLoss))} while retaining upside to {s.maxGain}.
                  Hedge effectiveness of {s.effectiveness}% exceeds the 85% internal threshold.
                  This structure is widely used by Glencore, Trafigura, and Vitol for commodity portfolios of this size.
                </p>
              </div>
            </V2Card>
          ))}
        </div>
      )}
    </div>
  );
}
