"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from "recharts";
import {
  Loader2, TrendingUp, TrendingDown, Activity, Shield, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, BookOpen, LineChart as LineChartIcon,
  BarChart3, Gauge, Scale, Zap,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import DemoBadge from "@/components/ui/DemoBadge";
import type { TradingBookData } from "@/types/premium";

const TABS = ["Position Book", "P&L Attribution", "Futures & Greeks", "Limites & VaR"] as const;
type Tab = (typeof TABS)[number];

export default function TradingPage() {
  const [data, setData] = useState<TradingBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Position Book");

  useEffect(() => {
    fetch("/api/trading").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data || !data.summary) return <div className="p-8 text-center text-gray-500">Aucune donnée trading disponible</div>;

  const { summary } = data;

  return (
    <div className="space-y-6">
      <DemoBadge label="Trading book avec données simulées — MTM rafraîchi à chaque chargement" />
      {/* Header KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard icon={<BookOpen className="h-4 w-4" />} label="Positions ouvertes" value={String(summary.openPositionCount)} color="forest" />
        <KPICard icon={<Activity className="h-4 w-4" />} label="MTM total" value={formatCurrency(summary.totalMTM)} color="blue" />
        <KPICard
          icon={summary.totalUnrealizedPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          label="P&L non réalisé"
          value={`${summary.totalUnrealizedPnl >= 0 ? "+" : ""}${formatCurrency(summary.totalUnrealizedPnl)}`}
          color={summary.totalUnrealizedPnl >= 0 ? "green" : "red"}
        />
        <KPICard
          icon={<Shield className="h-4 w-4" />}
          label="Limites en breach"
          value={String(summary.limitsBreached)}
          color={summary.limitsBreached > 0 ? "red" : "green"}
          subtitle={summary.limitsBreached > 0 ? "ACTION REQUISE" : "Tout conforme"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        <MiniKPI label="P&L réalisé" value={formatCurrency(summary.totalRealizedPnl)} positive={summary.totalRealizedPnl >= 0} />
        <MiniKPI label="Net Delta" value={formatCurrency(summary.netDelta)} positive={summary.netDelta >= 0} />
        <MiniKPI label="Net Gamma" value={formatCurrency(summary.netGamma)} positive={summary.netGamma >= 0} />
        <MiniKPI label="Net Vega" value={formatCurrency(summary.netVega)} positive />
        <MiniKPI label="Dérivés actifs" value={String(data.derivatives.length)} />
        <MiniKPI label="Futures curve" value={`${data.futuresCurve.length} pts`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
            activeTab === tab ? "bg-white text-forest-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Position Book" && <PositionBookTab data={data} />}
      {activeTab === "P&L Attribution" && <PnLAttributionTab data={data} />}
      {activeTab === "Futures & Greeks" && <FuturesGreeksTab data={data} />}
      {activeTab === "Limites & VaR" && <LimitsVaRTab data={data} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: Position Book
// ═══════════════════════════════════════════════════════
function PositionBookTab({ data }: { data: TradingBookData }) {
  return (
    <div className="space-y-6">
      {/* Position table */}
      <div className="card">
        <h3 className="card-header"><BookOpen className="mr-2 inline h-4 w-4" />Position Book — Mark-to-Market</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-2 pr-3">Instrument</th>
                <th className="pb-2 pr-3">Side</th>
                <th className="pb-2 pr-3 text-right">Qty</th>
                <th className="pb-2 pr-3 text-right">Avg Price</th>
                <th className="pb-2 pr-3 text-right">Mark Price</th>
                <th className="pb-2 pr-3 text-right">P&L Unrealized</th>
                <th className="pb-2 pr-3 text-right">Delta Exposure</th>
                <th className="pb-2 pr-3">Ccy</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-3 font-medium text-gray-900">{p.instrument}</td>
                  <td className="py-2 pr-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      p.side === "long" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {p.side === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {p.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-gray-700">{p.quantity.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono text-gray-700">{p.avgPrice.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono text-gray-900 font-medium">{p.markPrice.toFixed(2)}</td>
                  <td className={cn("py-2 pr-3 text-right font-mono font-bold", p.unrealizedPnl >= 0 ? "text-green-700" : "text-red-700")}>
                    {p.unrealizedPnl >= 0 ? "+" : ""}{formatCurrency(p.unrealizedPnl)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-gray-600">{formatCurrency(p.deltaExposure)}</td>
                  <td className="py-2 pr-3 text-gray-500">{p.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <h3 className="card-header"><Zap className="mr-2 inline h-4 w-4" />Dernières opérations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-2 pr-3">Ref</th>
                <th className="pb-2 pr-3">Contrepartie</th>
                <th className="pb-2 pr-3">Instrument</th>
                <th className="pb-2 pr-3">Side</th>
                <th className="pb-2 pr-3 text-right">Qty</th>
                <th className="pb-2 pr-3 text-right">Prix</th>
                <th className="pb-2 pr-3">Méthode</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trades.slice(0, 15).map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-3 font-mono text-xs text-gray-500">{t.tradeRef}</td>
                  <td className="py-2 pr-3 text-gray-900">{t.counterparty}</td>
                  <td className="py-2 pr-3 font-medium">{t.instrument}</td>
                  <td className="py-2 pr-3">
                    <span className={cn("text-xs font-bold", t.side === "buy" ? "text-green-600" : "text-red-600")}>
                      {t.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{t.quantity.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono">{t.price.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500">{t.method}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500">{t.tradeDate}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: P&L Attribution
// ═══════════════════════════════════════════════════════
function PnLAttributionTab({ data }: { data: TradingBookData }) {
  const attr = data.pnlAttribution;
  const cumulative = attr.reduce<Array<{ date: string; cumTotal: number; cumMarket: number; cumCarry: number; cumFx: number }>>((acc, a) => {
    const prev = acc[acc.length - 1] ?? { cumTotal: 0, cumMarket: 0, cumCarry: 0, cumFx: 0 };
    acc.push({
      date: a.date,
      cumTotal: prev.cumTotal + a.total,
      cumMarket: prev.cumMarket + a.marketMove,
      cumCarry: prev.cumCarry + a.carry,
      cumFx: prev.cumFx + a.fx,
    });
    return acc;
  }, []);

  const totalPnL = attr.reduce((s, a) => s + a.total, 0);
  const totalMarket = attr.reduce((s, a) => s + a.marketMove, 0);
  const totalCarry = attr.reduce((s, a) => s + a.carry, 0);
  const totalSpread = attr.reduce((s, a) => s + a.spread, 0);
  const totalTheta = attr.reduce((s, a) => s + a.theta, 0);
  const totalFx = attr.reduce((s, a) => s + a.fx, 0);

  return (
    <div className="space-y-6">
      {/* Decomposition summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <PnLBox label="Total P&L" value={totalPnL} />
        <PnLBox label="Market Move" value={totalMarket} />
        <PnLBox label="Carry" value={totalCarry} />
        <PnLBox label="Spread" value={totalSpread} />
        <PnLBox label="Theta" value={totalTheta} />
        <PnLBox label="FX" value={totalFx} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily P&L waterfall */}
        <div className="card">
          <h3 className="card-header"><BarChart3 className="mr-2 inline h-4 w-4" />P&L journalier — Attribution</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attr} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#999" />
                <Bar dataKey="marketMove" name="Marché" stackId="a" fill="#3a9348" />
                <Bar dataKey="carry" name="Carry" stackId="a" fill="#60a5fa" />
                <Bar dataKey="spread" name="Spread" stackId="a" fill="#a78bfa" />
                <Bar dataKey="theta" name="Theta" stackId="a" fill="#f59e0b" />
                <Bar dataKey="fx" name="FX" stackId="a" fill="#ef4444" />
                <Bar dataKey="other" name="Autre" stackId="a" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative P&L */}
        <div className="card">
          <h3 className="card-header"><LineChartIcon className="mr-2 inline h-4 w-4" />P&L cumulé</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulative} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a9348" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3a9348" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#999" />
                <Area type="monotone" dataKey="cumTotal" stroke="#3a9348" strokeWidth={2.5} fill="url(#cumGrad)" name="Total" />
                <Area type="monotone" dataKey="cumMarket" stroke="#60a5fa" strokeWidth={1} fill="none" strokeDasharray="4 4" name="Marché" />
                <Area type="monotone" dataKey="cumFx" stroke="#ef4444" strokeWidth={1} fill="none" strokeDasharray="4 4" name="FX" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: Futures & Greeks
// ═══════════════════════════════════════════════════════
function FuturesGreeksTab({ data }: { data: TradingBookData }) {
  return (
    <div className="space-y-6">
      {/* Futures Curve */}
      <div className="card">
        <h3 className="card-header"><LineChartIcon className="mr-2 inline h-4 w-4" />Courbe Forward — Cacao (ICE)</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.futuresCurve} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="contractMonth" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="volume" name="Volume" fill="#e5e7eb" yAxisId={0} />
                <Line type="monotone" dataKey="settlement" name="Settlement" stroke="#3a9348" strokeWidth={2.5} dot={{ r: 4 }} yAxisId={0} />
                <Line type="monotone" dataKey="bid" name="Bid" stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 4" yAxisId={0} />
                <Line type="monotone" dataKey="ask" name="Ask" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" yAxisId={0} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-3">Mois</th>
                  <th className="pb-2 pr-3 text-right">Bid</th>
                  <th className="pb-2 pr-3 text-right">Ask</th>
                  <th className="pb-2 pr-3 text-right">Settlement</th>
                  <th className="pb-2 pr-3 text-right">Basis</th>
                  <th className="pb-2 pr-3 text-right">OI</th>
                </tr>
              </thead>
              <tbody>
                {data.futuresCurve.map((f) => (
                  <tr key={f.contractMonth} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium">{f.contractMonth}</td>
                    <td className="py-2 pr-3 text-right font-mono">{f.bid.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{f.ask.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-mono font-bold">{f.settlement.toFixed(2)}</td>
                    <td className={cn("py-2 pr-3 text-right font-mono", f.basis >= 0 ? "text-green-600" : "text-red-600")}>
                      {f.basis >= 0 ? "+" : ""}{f.basis.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-500">{f.openInterest.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-400">
              {data.futuresCurve.length > 0 && data.futuresCurve[data.futuresCurve.length - 1].basis > 0
                ? "📈 Structure en contango — coût de stockage intégré dans les prix forward"
                : "📉 Structure en backwardation — prime de livraison immédiate"}
            </p>
          </div>
        </div>
      </div>

      {/* Derivatives Greeks */}
      <div className="card">
        <h3 className="card-header"><Scale className="mr-2 inline h-4 w-4" />Portefeuille Dérivés — Greeks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3">Sous-jacent</th>
                <th className="pb-2 pr-3">Side</th>
                <th className="pb-2 pr-3 text-right">Strike</th>
                <th className="pb-2 pr-3 text-right">Expiry</th>
                <th className="pb-2 pr-3 text-right">Δ Delta</th>
                <th className="pb-2 pr-3 text-right">Γ Gamma</th>
                <th className="pb-2 pr-3 text-right">ν Vega</th>
                <th className="pb-2 pr-3 text-right">Θ Theta</th>
                <th className="pb-2 pr-3 text-right">Notional</th>
                <th className="pb-2 pr-3 text-right">MTM</th>
              </tr>
            </thead>
            <tbody>
              {data.derivatives.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase",
                      d.type === "call" ? "bg-green-50 text-green-700" :
                      d.type === "put" ? "bg-red-50 text-red-700" :
                      d.type === "forward" ? "bg-blue-50 text-blue-700" :
                      "bg-purple-50 text-purple-700"
                    )}>{d.type}</span>
                  </td>
                  <td className="py-2 pr-3 font-medium">{d.underlying}</td>
                  <td className="py-2 pr-3 text-xs">{d.side.toUpperCase()}</td>
                  <td className="py-2 pr-3 text-right font-mono">{d.strike ? d.strike.toFixed(2) : "—"}</td>
                  <td className="py-2 pr-3 text-right text-xs">{d.expiry} <span className="text-gray-400">({(d as any).daysToExpiry}j)</span></td>
                  <td className={cn("py-2 pr-3 text-right font-mono font-bold", d.delta >= 0 ? "text-green-700" : "text-red-700")}>{d.delta.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono text-gray-600">{d.gamma.toFixed(4)}</td>
                  <td className="py-2 pr-3 text-right font-mono text-purple-600">{d.vega.toFixed(1)}</td>
                  <td className={cn("py-2 pr-3 text-right font-mono", d.theta >= 0 ? "text-green-600" : "text-amber-600")}>{d.theta.toFixed(1)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{formatCurrency(d.notional)}</td>
                  <td className={cn("py-2 pr-3 text-right font-mono font-bold", d.markToMarket >= 0 ? "text-green-700" : "text-red-700")}>
                    {formatCurrency(d.markToMarket)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <span><strong>Net Delta:</strong> {formatCurrency(data.summary.netDelta)}</span>
          <span><strong>Net Gamma:</strong> {formatCurrency(data.summary.netGamma)}</span>
          <span><strong>Net Vega:</strong> {formatCurrency(data.summary.netVega)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: Limits & VaR
// ═══════════════════════════════════════════════════════
function LimitsVaRTab({ data }: { data: TradingBookData }) {
  const breachCount = data.varBacktest.filter((v) => v.breach).length;
  const breachRate = data.varBacktest.length > 0 ? (breachCount / data.varBacktest.length * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* VaR Backtest Chart */}
      <div className="card">
        <h3 className="card-header"><Gauge className="mr-2 inline h-4 w-4" />VaR Backtest (95%) — {data.varBacktest.length} jours</h3>
        <div className="mb-3 flex gap-4 text-xs">
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">Breaches: {breachCount}/{data.varBacktest.length} ({breachRate}%)</span>
          <span className={cn("rounded px-2 py-1", Number(breachRate) <= 7 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {Number(breachRate) <= 7 ? "✓ Modèle calibré" : "⚠ Modèle à recalibrer"}
          </span>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.varBacktest} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v: number) => [formatCurrency(v), ""]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="realizedPnl" name="P&L réalisé">
                {data.varBacktest.map((entry, index) => (
                  <Cell key={index} fill={entry.breach ? "#ef4444" : entry.realizedPnl >= 0 ? "#3a9348" : "#f59e0b"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="varForecast" name="VaR 95%" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trading Limits */}
      <div className="card">
        <h3 className="card-header"><Shield className="mr-2 inline h-4 w-4" />Limites de trading</h3>
        <div className="space-y-3">
          {data.limits.map((lim, i) => {
            const pct = lim.utilizationPct;
            const color = pct >= 90 ? "red" : pct >= 75 ? "amber" : "green";
            return (
              <div key={i} className={cn("rounded-lg border p-3", lim.breached ? "border-red-200 bg-red-50/50" : "border-gray-100")}>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{lim.entityRef}</span>
                    <span className="ml-2 text-xs text-gray-500">{lim.entity} • {lim.riskType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{formatCurrency(lim.currentUsage)} / {formatCurrency(lim.limitAmount)}</span>
                    <span className={cn("font-bold", `text-${color}-700`)}>{pct}%</span>
                    {lim.breached && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={cn("h-full rounded-full transition-all", color === "red" ? "bg-red-500" : color === "amber" ? "bg-amber-500" : "bg-green-500")}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════
function KPICard({ icon, label, value, color, subtitle }: { icon: React.ReactNode; label: string; value: string; color: string; subtitle?: string }) {
  const bgMap: Record<string, string> = { forest: "bg-forest-50", blue: "bg-blue-50", green: "bg-green-50", red: "bg-red-50", amber: "bg-amber-50" };
  const textMap: Record<string, string> = { forest: "text-forest-600", blue: "text-blue-600", green: "text-green-600", red: "text-red-600", amber: "text-amber-600" };
  return (
    <div className="card flex items-center gap-3 !p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bgMap[color] ?? "bg-gray-50")}>
        <span className={textMap[color] ?? "text-gray-600"}>{icon}</span>
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {subtitle && <p className={cn("text-[10px] font-medium", color === "red" ? "text-red-500" : "text-green-500")}>{subtitle}</p>}
      </div>
    </div>
  );
}

function MiniKPI({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 p-2.5 text-center">
      <p className={cn("text-sm font-bold", positive === undefined ? "text-gray-900" : positive ? "text-green-700" : "text-red-700")}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function PnLBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center">
      <p className={cn("text-lg font-bold", value >= 0 ? "text-green-700" : "text-red-700")}>
        {value >= 0 ? "+" : ""}{formatCurrency(value)}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-50 text-blue-700",
    closed: "bg-gray-100 text-gray-700",
    settled: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-500",
    partially_filled: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status] ?? "bg-gray-100 text-gray-600")}>
      {status}
    </span>
  );
}
