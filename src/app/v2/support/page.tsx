"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ComposedChart, Area
} from "recharts";

interface VaRData { method: string; confidence: string; horizon: string; value: number; }
interface StressScenario { name: string; description: string; pnlImpact: number; probability: string; }
interface Position { product: string; direction: string; quantity: number; entryPrice: number; currentPrice: number; pnl: number; delta: number; }
interface Counterparty { name: string; exposure: number; limit: number; utilization: number; rating: string; }
interface PnLPoint { date: string; realized: number; unrealized: number; total: number; }
interface VaRBacktest { date: string; predicted: number; actual: number; breach: boolean; }

interface SupportData {
  var: VaRData[];
  stressScenarios: StressScenario[];
  positions: Position[];
  counterparties: Counterparty[];
  pnlAttribution: PnLPoint[];
  varBacktest: VaRBacktest[];
  totalExposure: number;
  portfolioVaR: number;
  activePositions: number;
  breachCount: number;
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function SupportPage() {
  const [data, setData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"risk" | "trading" | "stress">("risk");

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
        const positions: Position[] = (trading.positions || []).map((p: Record<string, unknown>) => ({
          product: String(p.product || p.instrument || ""),
          direction: String(p.direction || p.side || ""),
          quantity: Number(p.quantity || p.qty || 0),
          entryPrice: Number(p.entryPrice || p.entry || 0),
          currentPrice: Number(p.currentPrice || p.current || p.mark || 0),
          pnl: Number(p.pnl || p.unrealizedPnl || 0),
          delta: Number(p.delta || 0),
        }));
        const counterparties: Counterparty[] = (risk.counterparties || []).map((c: Record<string, unknown>) => ({
          name: String(c.name || ""),
          exposure: Number(c.exposure || 0),
          limit: Number(c.limit || 0),
          utilization: Number(c.utilization || (Number(c.limit || 1) > 0 ? Number(c.exposure || 0) / Number(c.limit || 1) * 100 : 0)),
          rating: String(c.rating || ""),
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
        setData({
          var: varData, stressScenarios, positions, counterparties, pnlAttribution, varBacktest,
          totalExposure: positions.reduce((s, p) => s + Math.abs(p.pnl), 0) + (counterparties.reduce((s, c) => s + c.exposure, 0)),
          portfolioVaR: varData.length ? varData[0].value : 45000,
          activePositions: positions.length,
          breachCount: varBacktest.filter((v) => v.breach).length,
        });
      })
      .catch(() => {
        setData({
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
          positions: [
            { product: "CARUMA Futures Q2", direction: "Long", quantity: 30, entryPrice: 4.35, currentPrice: 4.52, pnl: 5100, delta: 0.92 },
            { product: "Cocoa Hedge Oct", direction: "Short", quantity: 5, entryPrice: 3180, currentPrice: 3220, pnl: -200, delta: -0.78 },
            { product: "EUR/DZD Forward", direction: "Long", quantity: 500000, entryPrice: 148.5, currentPrice: 147.8, pnl: -350, delta: 0.65 },
            { product: "CARANI Physical Q1", direction: "Long", quantity: 80, entryPrice: 1.95, currentPrice: 2.05, pnl: 8000, delta: 1.0 },
          ],
          counterparties: [
            { name: "Cargill EMEA", exposure: 180000, limit: 500000, utilization: 36, rating: "A+" },
            { name: "Barry Callebaut", exposure: 85000, limit: 300000, utilization: 28, rating: "A" },
            { name: "Olam Intl", exposure: 200000, limit: 250000, utilization: 80, rating: "BBB+" },
            { name: "SunOpta", exposure: 45000, limit: 150000, utilization: 30, rating: "BBB" },
          ],
          pnlAttribution: [
            { date: "Week 1", realized: 12000, unrealized: 5000, total: 17000 },
            { date: "Week 2", realized: 8000, unrealized: -3000, total: 5000 },
            { date: "Week 3", realized: 15000, unrealized: 8500, total: 23500 },
            { date: "Week 4", realized: 6000, unrealized: -1200, total: 4800 },
          ],
          varBacktest: [
            { date: "Mon", predicted: 45000, actual: 28000, breach: false },
            { date: "Tue", predicted: 45000, actual: 52000, breach: true },
            { date: "Wed", predicted: 45000, actual: 31000, breach: false },
            { date: "Thu", predicted: 45000, actual: 19000, breach: false },
            { date: "Fri", predicted: 45000, actual: 38000, breach: false },
          ],
          totalExposure: 523550,
          portfolioVaR: 45000,
          activePositions: 4,
          breachCount: 1,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading support...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Portfolio VaR (95%)", value: fmt(data.portfolioVaR), sub: "1-day horizon" },
          { label: "Total Exposure", value: fmt(data.totalExposure), sub: "all counterparties" },
          { label: "Active Positions", value: String(data.activePositions), sub: "open trades" },
          { label: "VaR Breaches", value: `${data.breachCount}/5`, sub: "last 5 days", alert: data.breachCount > 1 },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-4 py-3">
              <p className="v2-kpi-label">{k.label}</p>
              <p className={`v2-kpi-value ${"alert" in k && k.alert ? "text-gcs-red" : ""}`}>{k.value}</p>
              <p className="v2-kpi-sub">{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200">
        {(["risk", "trading", "stress"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize ${tab === t ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t === "risk" ? "Risk Management" : t === "trading" ? "Trading Book" : "Stress Testing"}
          </button>
        ))}
      </div>

      {/* ── Tab: Risk Management ── */}
      {tab === "risk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                    <Bar dataKey="actual" name="Actual Loss" radius={[4, 4, 0, 0]}>
                      {data.varBacktest.map((v, i) => (
                        <rect key={i} fill={v.breach ? "#d93025" : "#1a73e8"} />
                      ))}
                    </Bar>
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
        </div>
      )}

      {/* ── Tab: Trading Book ── */}
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
                    <td>{p.quantity}</td>
                    <td>${p.entryPrice.toFixed(2)}</td>
                    <td>${p.currentPrice.toFixed(2)}</td>
                    <td className={p.pnl >= 0 ? "text-gcs-green font-medium" : "text-gcs-red font-medium"}>{p.pnl >= 0 ? "+" : ""}{fmt(p.pnl)}</td>
                    <td>{p.delta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
          <V2Card title="P&L Attribution" subtitle="Weekly breakdown">
            <div className="px-4 py-2 h-64">
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

      {/* ── Tab: Stress Testing ── */}
      {tab === "stress" && (
        <div className="space-y-4">
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
          <V2Card title="Stress Impact Visualization">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stressScenarios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="pnlImpact" name="P&L Impact" radius={[0, 4, 4, 0]}>
                    {data.stressScenarios.map((s, i) => (
                      <rect key={i} fill={s.pnlImpact >= 0 ? "#188038" : "#d93025"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>
      )}
    </div>
  );
}
