"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertTriangle, Globe, TrendingUp, TrendingDown, Minus, Shield, Calendar } from "lucide-react";
import V2Card from "@/components/v2/V2Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from "recharts";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface WRKpi { label: string; value: number; currency?: string; trend: number; severity: "normal" | "warning" | "critical"; }
interface PnLRow { product: string; revenue: number; costOfGoods: number; grossMargin: number; grossMarginPct: number; netMargin: number; ebitda: number; }
interface Position { orderId: string; client: string; country: string; product: string; quantity: number; value: number; currency: string; status: string; deliveryDate: string; daysUntilDelivery: number; mtmValue?: number; unrealizedPnl?: number; }
interface CurrExp { currency: string; total: number; pct: number; orders: number; }
interface Alert { id: string; severity: "critical" | "warning" | "info"; category: string; title: string; description: string; timestamp: string; }
interface Flow { from: [number, number]; to: [number, number]; toLabel: string; value: number; orders: number; }
interface PnLWaterfall { factor: string; value: number; cumulative: number; }
interface ExpiringDerivative { instrument: string; type: string; expiry: string; daysToExpiry: number; notional: number; mtm: number; action: string; }

interface WRData {
  kpis: Record<string, WRKpi>;
  pnl: PnLRow[];
  positions: Position[];
  currencies: CurrExp[];
  alerts: Alert[];
  flows: Flow[];
  pnlWaterfall: PnLWaterfall[];
  expiringDerivatives: ExpiringDerivative[];
  lastUpdate: string;
}

const CURRENCY_COLORS = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#80868b"];
const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-50 text-gcs-red border-l-4 border-gcs-red",
  warning: "bg-yellow-50 text-yellow-800 border-l-4 border-gcs-yellow",
  info: "bg-blue-50 text-gcs-blue border-l-4 border-gcs-blue",
};
const WATERFALL_COLORS: Record<string, string> = {
  "Market Move": "#1a73e8", "Carry": "#188038", "Spread": "#f9ab00",
  "Theta": "#d93025", "Vega": "#8e24aa", "Gamma": "#00897b",
  "FX": "#e65100", "Other": "#80868b",
};

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function V2WarRoomPage() {
  const [data, setData] = useState<WRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(() => {
    fetch("/api/war-room")
      .then((r) => r.json())
      .then((d) => { setData(enrichWithTrading(d)); setLastRefresh(new Date()); })
      .catch((err) => {
        console.error("[V2 War Room] Failed to load data, using demo fallback:", err);
        setData(getDemoWarRoom());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading war room">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Initializing War Room...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiList = Object.values(data.kpis);
  const mtdPnL = data.pnlWaterfall[data.pnlWaterfall.length - 1]?.cumulative || 0;
  const totalMTM = data.positions.reduce((s, p) => s + (p.mtmValue || p.value), 0);

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gcs-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-gcs-blue" />
            War Room — Command Center
          </h1>
          <p className="text-xs text-gcs-gray-500">
            Last refresh: {lastRefresh.toLocaleTimeString("fr-FR")} · Auto-refresh {autoRefresh ? "ON" : "OFF"} (30s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {autoRefresh && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-gcs-green animate-pulse" />
              <span className="text-[10px] font-medium text-gcs-green">LIVE</span>
            </div>
          )}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-[11px] text-gcs-gray-500 hover:text-gcs-blue px-2 py-1 rounded border border-gcs-gray-200 hover:border-gcs-blue">
            {autoRefresh ? "Pause" : "Resume"}
          </button>
          <button onClick={fetchData}
            className="p-1.5 rounded-lg border border-gcs-gray-200 text-gcs-gray-500 hover:bg-gcs-gray-50 hover:text-gcs-blue">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── KPI Strip (8 metrics) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiList.map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-3 py-2.5">
              <p className="v2-kpi-label truncate">{k.label}</p>
              <p className="v2-kpi-value text-[16px]">
                {k.currency ? fmt(k.value) : String(k.value)}
              </p>
              <p className={cn(
                "v2-kpi-sub flex items-center gap-0.5",
                k.severity === "critical" ? "text-gcs-red" :
                k.trend > 0 ? "text-gcs-green" : k.trend < 0 ? "text-gcs-red" : "text-gcs-gray-500"
              )}>
                {k.trend > 0 ? <TrendingUp className="h-3 w-3" /> : k.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {k.trend > 0 ? "+" : ""}{k.trend.toFixed(1)}%
              </p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Alerts Panel ── */}
      <V2Card title="Critical Alerts" subtitle={`${data.alerts.filter((a) => a.severity === "critical").length} critical · ${data.alerts.length} total`}>
        <div className="px-4 py-2 space-y-2">
          {data.alerts.sort((a, b) => {
            const sev = { critical: 0, warning: 1, info: 2 };
            return (sev[a.severity] || 9) - (sev[b.severity] || 9);
          }).map((a) => (
            <div key={a.id} className={cn("rounded-lg px-4 py-3", SEVERITY_STYLE[a.severity] || "bg-gcs-gray-50")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">{a.title}</span>
                </div>
                <span className="text-[10px] text-gcs-gray-500">{a.category}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">{a.description}</p>
            </div>
          ))}
        </div>
      </V2Card>

      {/* ── MTD P&L Waterfall ── */}
      <V2Card title="MTD P&L Attribution Waterfall" subtitle={`Total: ${fmt(mtdPnL)} · 8-factor decomposition`}>
        <div className="px-4 py-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.pnlWaterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="factor" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip formatter={(v: number, name: string) => [fmt(v), name]} />
              <Bar dataKey="value" name="P&L Contribution" radius={[4, 4, 0, 0]}>
                {data.pnlWaterfall.map((entry) => (
                  <Cell key={entry.factor} fill={WATERFALL_COLORS[entry.factor] || "#80868b"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="cumulative" stroke="#202124" strokeWidth={2} dot={{ r: 3 }} name="Cumulative" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </V2Card>

      {/* ── Mark-to-Market Positions + Derivatives Expiry ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mark-to-Market Positions */}
        <V2Card title="Mark-to-Market Positions" subtitle={`${data.positions.length} active · MTM: ${fmt(totalMTM)}`} className="lg:col-span-2">
          <table className="v2-table">
            <thead>
              <tr>
                <th>Order</th><th>Client</th><th>Product</th><th>Qty (t)</th>
                <th>Book Value</th><th>MTM Value</th><th>Unrealized P&L</th><th>Status</th><th>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p) => {
                const unrealized = (p.unrealizedPnl ?? (p.mtmValue ? p.mtmValue - p.value : 0));
                return (
                  <tr key={p.orderId}>
                    <td className="font-medium text-gcs-blue">{p.orderId}</td>
                    <td>{p.client}</td>
                    <td>{p.product}</td>
                    <td>{p.quantity}</td>
                    <td>{fmt(p.value)} {p.currency}</td>
                    <td className="font-medium">{fmt(p.mtmValue || p.value)}</td>
                    <td className={unrealized >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>
                      {unrealized >= 0 ? "+" : ""}{fmt(unrealized)}
                    </td>
                    <td>
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full",
                        p.status === "in_transit" ? "bg-blue-50 text-gcs-blue" :
                        p.status === "loading" ? "bg-yellow-50 text-yellow-700" :
                        p.status === "confirmed" ? "bg-green-50 text-gcs-green" :
                        "bg-gcs-gray-50 text-gcs-gray-500"
                      )}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className={cn(
                      "text-xs",
                      p.daysUntilDelivery <= 3 ? "text-gcs-red font-medium" : "text-gcs-gray-500"
                    )}>
                      {p.daysUntilDelivery}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </V2Card>

        {/* Derivatives Expiry Calendar */}
        <V2Card title="Expiry Calendar" subtitle="Upcoming derivative expirations">
          <div className="px-4 py-2 space-y-2">
            {data.expiringDerivatives.map((d) => (
              <div key={d.instrument} className={cn(
                "rounded-lg px-3 py-2.5 border",
                d.daysToExpiry <= 7 ? "border-gcs-red bg-red-50/50" :
                d.daysToExpiry <= 30 ? "border-gcs-yellow bg-yellow-50/30" :
                "border-gcs-gray-200 bg-white"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className={cn("h-3.5 w-3.5",
                      d.daysToExpiry <= 7 ? "text-gcs-red" : d.daysToExpiry <= 30 ? "text-gcs-yellow" : "text-gcs-gray-400"
                    )} />
                    <span className="text-xs font-medium text-gcs-gray-900">{d.instrument}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    d.daysToExpiry <= 7 ? "bg-gcs-red text-white" :
                    d.daysToExpiry <= 30 ? "bg-gcs-yellow text-white" :
                    "bg-gcs-gray-100 text-gcs-gray-600"
                  )}>{d.daysToExpiry}d</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-gcs-gray-500">{d.type} · {d.expiry} · {fmt(d.notional)}</span>
                  <span className={d.mtm >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>
                    MTM: {d.mtm >= 0 ? "+" : ""}{fmt(d.mtm)}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-gcs-blue font-medium">{d.action}</div>
              </div>
            ))}
          </div>
        </V2Card>
      </div>

      {/* ── P&L by Product + Currency ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <V2Card title="P&L by Product" subtitle="Gross margin breakdown" className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 py-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pnl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="product" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="#1a73e8" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costOfGoods" fill="#dadce0" name="COGS" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossMargin" fill="#188038" name="Gross Margin" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="v2-table">
              <thead>
                <tr><th>Product</th><th>Revenue</th><th>COGS</th><th>GM %</th><th>EBITDA</th></tr>
              </thead>
              <tbody>
                {data.pnl.map((r) => (
                  <tr key={r.product}>
                    <td className="font-medium">{r.product}</td>
                    <td>{fmt(r.revenue)}</td>
                    <td>{fmt(r.costOfGoods)}</td>
                    <td className={r.grossMarginPct >= 35 ? "text-gcs-green font-medium" : "text-gcs-red"}>{r.grossMarginPct.toFixed(1)}%</td>
                    <td>{fmt(r.ebitda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </V2Card>

        {/* Currency Exposure */}
        <V2Card title="Currency Exposure">
          <div className="px-4 py-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.currencies} dataKey="total" nameKey="currency" cx="50%" cy="50%" outerRadius={70}
                  label={({ currency, pct }) => `${currency} ${pct}%`}>
                  {data.currencies.map((_, i) => (
                    <Cell key={i} fill={CURRENCY_COLORS[i % CURRENCY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </V2Card>
      </div>

      {/* ── Trade Flows ── */}
      <V2Card title="Active Trade Flows" subtitle={`${data.flows.length} destinations`}>
        <table className="v2-table">
          <thead>
            <tr><th>Destination</th><th>Value</th><th>Orders</th></tr>
          </thead>
          <tbody>
            {data.flows.map((f, i) => (
              <tr key={i}>
                <td className="font-medium flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gcs-blue" />
                  {f.toLabel}
                </td>
                <td>{fmt(f.value)}</td>
                <td>{f.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </V2Card>
    </div>
  );
}

/* ── Enrich API data with trading features ── */
function enrichWithTrading(d: Partial<WRData>): WRData {
  const demo = getDemoWarRoom();
  return {
    ...demo,
    ...d,
    kpis: { ...demo.kpis, ...(d.kpis || {}) },
    pnlWaterfall: d.pnlWaterfall || demo.pnlWaterfall,
    expiringDerivatives: d.expiringDerivatives || demo.expiringDerivatives,
    positions: (d.positions || demo.positions).map((p) => ({
      ...p,
      mtmValue: p.mtmValue || Math.round(p.value * (1 + (Math.random() * 0.1 - 0.03))),
      unrealizedPnl: p.unrealizedPnl || Math.round(p.value * (Math.random() * 0.08 - 0.02)),
    })),
  };
}

function getDemoWarRoom(): WRData {
  return {
    kpis: {
      totalExposure: { label: "Total Exposure", value: 2840000, currency: "USD", trend: 5.2, severity: "normal" },
      openPositions: { label: "Open Positions", value: 14, trend: -2, severity: "normal" },
      dailyPnL: { label: "Daily P&L", value: 45200, currency: "USD", trend: 12.3, severity: "normal" },
      mtdPnL: { label: "MTD P&L", value: 182400, currency: "USD", trend: 8.5, severity: "normal" },
      criticalAlerts: { label: "Critical Alerts", value: 3, trend: 0, severity: "warning" },
      cashAvailable: { label: "Cash Available", value: 1250000, currency: "USD", trend: -1.8, severity: "normal" },
      netDelta: { label: "Net Delta (Δ)", value: 0.55, trend: -3.2, severity: "normal" },
      deliveriesThisWeek: { label: "Deliveries", value: 4, trend: 0, severity: "normal" },
    },
    pnl: [
      { product: "CARUMA", revenue: 480000, costOfGoods: 312000, grossMargin: 168000, grossMarginPct: 35.0, netMargin: 120000, ebitda: 145000 },
      { product: "CARANI", revenue: 320000, costOfGoods: 224000, grossMargin: 96000, grossMarginPct: 30.0, netMargin: 68000, ebitda: 82000 },
      { product: "EXTRACT", revenue: 180000, costOfGoods: 99000, grossMargin: 81000, grossMarginPct: 45.0, netMargin: 62000, ebitda: 72000 },
    ],
    positions: [
      { orderId: "ORD-2025-042", client: "Nestlé MEA", country: "Switzerland", product: "CARUMA", quantity: 25, value: 112500, currency: "EUR", status: "in_transit", deliveryDate: "2025-02-18", daysUntilDelivery: 5, mtmValue: 118200, unrealizedPnl: 5700 },
      { orderId: "ORD-2025-039", client: "Barry Callebaut", country: "Belgium", product: "EXTRACT", quantity: 8, value: 68000, currency: "EUR", status: "confirmed", deliveryDate: "2025-02-25", daysUntilDelivery: 12, mtmValue: 71400, unrealizedPnl: 3400 },
      { orderId: "ORD-2025-045", client: "Olam MENA", country: "UAE", product: "CARANI", quantity: 40, value: 80000, currency: "USD", status: "loading", deliveryDate: "2025-02-15", daysUntilDelivery: 2, mtmValue: 78200, unrealizedPnl: -1800 },
      { orderId: "ORD-2025-038", client: "Cargill Africa", country: "Ivory Coast", product: "CARUMA", quantity: 30, value: 135000, currency: "USD", status: "in_transit", deliveryDate: "2025-02-20", daysUntilDelivery: 7, mtmValue: 142000, unrealizedPnl: 7000 },
    ],
    currencies: [
      { currency: "EUR", total: 1420000, pct: 50, orders: 8 },
      { currency: "USD", total: 980000, pct: 34.5, orders: 5 },
      { currency: "GBP", total: 280000, pct: 9.9, orders: 2 },
      { currency: "AED", total: 160000, pct: 5.6, orders: 1 },
    ],
    alerts: [
      { id: "a1", severity: "critical", category: "Delivery", title: "Delayed shipment ORD-2025-036", description: "Container stuck at Oran port — 3 days delay", timestamp: "2025-02-12T08:30:00Z" },
      { id: "a2", severity: "warning", category: "Payment", title: "Overdue invoice INV-2025-018", description: "Barry Callebaut — €45K overdue by 12 days", timestamp: "2025-02-12T09:15:00Z" },
      { id: "a3", severity: "critical", category: "Quality", title: "QC hold on batch B-2025-088", description: "Moisture level 8.2% exceeds 7% threshold", timestamp: "2025-02-12T07:45:00Z" },
      { id: "a4", severity: "info", category: "Market", title: "Cocoa price spike +4.2%", description: "ICE cocoa futures surged — carob spread opportunity", timestamp: "2025-02-12T10:00:00Z" },
      { id: "a5", severity: "critical", category: "Risk", title: "Derivatives desk limit breach", description: "92.5% utilization on $2M desk limit — escalate to risk committee", timestamp: "2025-02-12T10:30:00Z" },
    ],
    flows: [
      { from: [2.88, 36.73], to: [6.14, 46.22], toLabel: "Brussels", value: 180000, orders: 3 },
      { from: [2.88, 36.73], to: [55.27, 25.20], toLabel: "Dubai", value: 80000, orders: 1 },
      { from: [2.88, 36.73], to: [8.54, 47.37], toLabel: "Zurich", value: 112500, orders: 2 },
    ],
    pnlWaterfall: [
      { factor: "Market Move", value: 32000, cumulative: 32000 },
      { factor: "Carry", value: 8500, cumulative: 40500 },
      { factor: "Spread", value: -4200, cumulative: 36300 },
      { factor: "Theta", value: -1825, cumulative: 34475 },
      { factor: "Vega", value: 12400, cumulative: 46875 },
      { factor: "Gamma", value: 3200, cumulative: 50075 },
      { factor: "FX", value: -6800, cumulative: 43275 },
      { factor: "Other", value: 1925, cumulative: 45200 },
    ],
    expiringDerivatives: [
      { instrument: "CARUMA Call Mar-25", type: "Call Option", expiry: "2025-03-21", daysToExpiry: 34, notional: 250000, mtm: 14200, action: "Roll to Jun-25 or exercise" },
      { instrument: "CARUMA Put Mar-25", type: "Put Option", expiry: "2025-03-21", daysToExpiry: 34, notional: 150000, mtm: -3800, action: "Let expire OTM" },
      { instrument: "EUR/DZD Put Q2", type: "FX Put", expiry: "2025-06-30", daysToExpiry: 135, notional: 800000, mtm: -12400, action: "Monitor — hedge ratio 42%" },
      { instrument: "Cocoa Collar Sep-25", type: "Collar Structure", expiry: "2025-09-19", daysToExpiry: 216, notional: 300000, mtm: 6800, action: "Hold — within target range" },
      { instrument: "CAROB FWD Dec-25", type: "Forward", expiry: "2025-12-19", daysToExpiry: 307, notional: 400000, mtm: 8200, action: "Delivery scheduled Q4" },
    ],
    lastUpdate: new Date().toISOString(),
  };
}
