"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar, ComposedChart, Area
} from "recharts";

interface TimeSeriesPoint { date: string; carob: number; cocoa: number; sugar: number; }
interface Correlation { pair: string; coefficient: number; strength: string; }
interface Signal { indicator: string; signal: string; strength: string; timeframe: string; }
interface ForwardPoint { month: string; price: number; spot: number; }
interface Fundamental { metric: string; value: string; change: string; trend: string; }

interface ResourcesData {
  timeSeries: TimeSeriesPoint[];
  correlations: Correlation[];
  signals: Signal[];
  forwardCurve: ForwardPoint[];
  fundamentals: Fundamental[];
  carobSpot: number;
  carobChange: number;
  cocoaSpot: number;
  sugarSpot: number;
}

export default function ResourcesPage() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"market" | "correlations" | "signals">("market");
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    fetch("/api/commodities")
      .then((r) => r.json())
      .then((comm) => {
        const timeSeries: TimeSeriesPoint[] = (comm.timeSeries || []).map((t: Record<string, unknown>) => ({
          date: String(t.date || t.month || ""),
          carob: Number(t.carob || t.carobPrice || 0),
          cocoa: Number(t.cocoa || t.cocoaPrice || 0),
          sugar: Number(t.sugar || t.sugarPrice || 0),
        }));
        const correlations: Correlation[] = (comm.correlations || comm.rollingCorrelations || []).map((c: Record<string, unknown>) => ({
          pair: String(c.pair || c.name || ""),
          coefficient: Number(c.coefficient || c.value || c.corr || 0),
          strength: String(c.strength || (Math.abs(Number(c.coefficient || 0)) > 0.7 ? "Strong" : Math.abs(Number(c.coefficient || 0)) > 0.4 ? "Moderate" : "Weak")),
        }));
        const signals: Signal[] = (comm.signals || []).map((s: Record<string, unknown>) => ({
          indicator: String(s.indicator || s.name || ""),
          signal: String(s.signal || s.direction || ""),
          strength: String(s.strength || "medium"),
          timeframe: String(s.timeframe || s.period || ""),
        }));
        const forwardCurve: ForwardPoint[] = (comm.forwardCurve || []).map((f: Record<string, unknown>) => ({
          month: String(f.month || f.date || ""),
          price: Number(f.price || f.forward || 0),
          spot: Number(f.spot || 0),
        }));
        const fundamentals: Fundamental[] = (comm.fundamentals || []).map((f: Record<string, unknown>) => ({
          metric: String(f.metric || f.name || ""),
          value: String(f.value || ""),
          change: String(f.change || ""),
          trend: String(f.trend || "stable"),
        }));
        const lastTs = timeSeries.length ? timeSeries[timeSeries.length - 1] : null;
        const prevTs = timeSeries.length > 1 ? timeSeries[timeSeries.length - 2] : null;

        setData({
          timeSeries, correlations, signals, forwardCurve, fundamentals,
          carobSpot: lastTs?.carob || 4.5,
          carobChange: lastTs && prevTs ? ((lastTs.carob - prevTs.carob) / prevTs.carob * 100) : 2.3,
          cocoaSpot: lastTs?.cocoa || 3200,
          sugarSpot: lastTs?.sugar || 0.28,
        });
      })
      .catch((err) => {
        console.error("[V2 Resources] Failed to load data, using demo fallback:", err);
        setData({
          timeSeries: [
            { date: "Jul", carob: 4.20, cocoa: 3050, sugar: 0.26 },
            { date: "Aug", carob: 4.35, cocoa: 3120, sugar: 0.27 },
            { date: "Sep", carob: 4.28, cocoa: 3080, sugar: 0.26 },
            { date: "Oct", carob: 4.42, cocoa: 3200, sugar: 0.28 },
            { date: "Nov", carob: 4.38, cocoa: 3150, sugar: 0.27 },
            { date: "Dec", carob: 4.50, cocoa: 3220, sugar: 0.28 },
          ],
          correlations: [
            { pair: "Carob / Cocoa", coefficient: 0.82, strength: "Strong" },
            { pair: "Carob / Sugar", coefficient: 0.45, strength: "Moderate" },
            { pair: "Carob / Palm Oil", coefficient: 0.31, strength: "Weak" },
            { pair: "Cocoa / Sugar", coefficient: 0.67, strength: "Moderate" },
          ],
          signals: [
            { indicator: "RSI (14d)", signal: "Buy", strength: "strong", timeframe: "Short-term" },
            { indicator: "MACD", signal: "Bullish", strength: "medium", timeframe: "Medium-term" },
            { indicator: "200-day MA", signal: "Above", strength: "strong", timeframe: "Long-term" },
            { indicator: "Bollinger Bands", signal: "Neutral", strength: "weak", timeframe: "Short-term" },
            { indicator: "Volume Trend", signal: "Increasing", strength: "medium", timeframe: "Short-term" },
          ],
          forwardCurve: [
            { month: "Jan 25", price: 4.50, spot: 4.50 },
            { month: "Apr 25", price: 4.62, spot: 4.50 },
            { month: "Jul 25", price: 4.78, spot: 4.50 },
            { month: "Oct 25", price: 4.85, spot: 4.50 },
            { month: "Jan 26", price: 4.92, spot: 4.50 },
          ],
          fundamentals: [
            { metric: "Global Carob Production", value: "320K tons/yr", change: "+3.2%", trend: "up" },
            { metric: "Mediterranean Harvest", value: "Good", change: "vs Avg", trend: "stable" },
            { metric: "Cocoa Premium vs Carob", value: "711x", change: "-2%", trend: "down" },
            { metric: "EU Import Demand", value: "45K tons", change: "+8%", trend: "up" },
            { metric: "Algeria Export Quota", value: "12K tons", change: "unchanged", trend: "stable" },
          ],
          carobSpot: 4.50, carobChange: 2.3, cocoaSpot: 3220, sugarSpot: 0.28,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading resources">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Carob Spot", value: `$${data.carobSpot.toFixed(2)}/kg`, sub: `${data.carobChange >= 0 ? "+" : ""}${data.carobChange.toFixed(1)}% MoM`, positive: data.carobChange >= 0 },
          { label: "Cocoa (ICE)", value: `$${data.cocoaSpot.toFixed(0)}/t`, sub: "benchmark", positive: true },
          { label: "Sugar (ICE)", value: `$${data.sugarSpot.toFixed(2)}/lb`, sub: "reference", positive: true },
          { label: "Signals", value: `${data.signals.filter((s) => s.signal.toLowerCase().includes("buy") || s.signal.toLowerCase().includes("bullish")).length}/${data.signals.length}`, sub: "bullish indicators" },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-4 py-3">
              <p className="v2-kpi-label">{k.label}</p>
              <p className="v2-kpi-value">{k.value}</p>
              <p className={`v2-kpi-sub ${k.positive ? "text-gcs-green" : "text-gcs-red"}`}>{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200">
        {(["market", "correlations", "signals"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize ${tab === t ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t === "market" ? "Market Data" : t === "correlations" ? "Correlations" : "Trading Signals"}
          </button>
        ))}
        <div className="ml-auto">
          <FilterDropdown label="Period:" value={period} options={[
            { label: "3 Months", value: "3m" },
            { label: "6 Months", value: "6m" },
            { label: "1 Year", value: "1y" },
          ]} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Tab: Market Data ── */}
      {tab === "market" && (
        <div className="space-y-4">
          <V2Card title="Commodity Price Trends" subtitle="Carob vs benchmarks">
            <div className="px-4 py-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="carob" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <YAxis yAxisId="cocoa" orientation="right" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="carob" dataKey="carob" stroke="#1a73e8" strokeWidth={2} name="Carob ($/kg)" dot={{ r: 3 }} />
                  <Line yAxisId="cocoa" dataKey="cocoa" stroke="#d93025" strokeWidth={1.5} name="Cocoa ($/t)" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <V2Card title="Forward Curve" subtitle="Carob futures curve">
              <div className="px-4 py-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.forwardCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area dataKey="spot" fill="#e8f0fe" stroke="none" name="Spot" />
                    <Line dataKey="price" stroke="#1a73e8" strokeWidth={2} name="Forward" dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </V2Card>
            <V2Card title="Market Fundamentals">
              <table className="v2-table">
                <thead><tr><th>Metric</th><th>Value</th><th>Change</th><th>Trend</th></tr></thead>
                <tbody>
                  {data.fundamentals.map((f) => (
                    <tr key={f.metric}>
                      <td className="font-medium">{f.metric}</td>
                      <td>{f.value}</td>
                      <td className={f.trend === "up" ? "text-gcs-green" : f.trend === "down" ? "text-gcs-red" : "text-gcs-gray-500"}>{f.change}</td>
                      <td>{f.trend === "up" ? "↑" : f.trend === "down" ? "↓" : "→"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </V2Card>
          </div>
        </div>
      )}

      {/* ── Tab: Correlations ── */}
      {tab === "correlations" && (
        <div className="space-y-4">
          <V2Card title="Cross-Commodity Correlations" subtitle="Rolling 90-day correlation matrix">
            <table className="v2-table">
              <thead><tr><th>Pair</th><th>Coefficient</th><th>Strength</th><th>Visual</th></tr></thead>
              <tbody>
                {data.correlations.map((c) => (
                  <tr key={c.pair}>
                    <td className="font-medium">{c.pair}</td>
                    <td className={c.coefficient > 0.7 ? "text-gcs-blue font-medium" : ""}>{c.coefficient.toFixed(2)}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      c.strength === "Strong" ? "bg-blue-50 text-gcs-blue" :
                      c.strength === "Moderate" ? "bg-yellow-50 text-gcs-yellow" :
                      "bg-gcs-gray-50 text-gcs-gray-500"
                    }`}>{c.strength}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-24 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${c.coefficient > 0.7 ? "bg-gcs-blue" : c.coefficient > 0.4 ? "bg-gcs-yellow" : "bg-gcs-gray-300"}`}
                            style={{ width: `${Math.abs(c.coefficient) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Trading Signals ── */}
      {tab === "signals" && (
        <div className="space-y-4">
          <V2Card title="Technical Indicators" subtitle="Carob commodity signals">
            <table className="v2-table">
              <thead><tr><th>Indicator</th><th>Signal</th><th>Strength</th><th>Timeframe</th></tr></thead>
              <tbody>
                {data.signals.map((s) => {
                  const isBullish = s.signal.toLowerCase().includes("buy") || s.signal.toLowerCase().includes("bullish") || s.signal.toLowerCase().includes("above") || s.signal.toLowerCase().includes("increas");
                  return (
                    <tr key={s.indicator}>
                      <td className="font-medium">{s.indicator}</td>
                      <td className={isBullish ? "text-gcs-green font-medium" : s.signal === "Neutral" ? "text-gcs-gray-500" : "text-gcs-red font-medium"}>{s.signal}</td>
                      <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        s.strength === "strong" ? "bg-blue-50 text-gcs-blue" :
                        s.strength === "medium" ? "bg-yellow-50 text-gcs-yellow" :
                        "bg-gcs-gray-50 text-gcs-gray-500"
                      }`}>{s.strength}</span></td>
                      <td className="text-gcs-gray-500">{s.timeframe}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}
    </div>
  );
}
