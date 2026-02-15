"use client";

import { useEffect, useState, useMemo } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ComposedChart, Area,
  ScatterChart, Scatter, ZAxis, AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Target, Shuffle, Lightbulb, Zap, AlertTriangle } from "lucide-react";

/* ── Types ── */
interface TimeSeriesPoint { date: string; carob: number; cocoa: number; sugar: number; }
interface Correlation { pair: string; coefficient: number; strength: string; }
interface Signal { id?: string; indicator: string; signal: string; strength: string; timeframe: string; commodity?: string; message?: string; type?: string; }
interface ForwardPoint { month: string; price: number; spot: number; }
interface Fundamental { metric: string; value: string; change: string; trend: string; }
interface SpreadPoint { date: string; cocoa: number; carob: number; spread: number; }
interface HeatmapCell { x: string; y: string; value: number; significance?: string; trend?: string; prevValue?: number; }
interface RollingCorr { date: string; pair: string; value: number; }
interface Insight { type: string; title: string; description: string; pairs: [string, string]; value: number; }

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
  /* New fields from V1 commodities */
  spreads: SpreadPoint[];
  heatmapCells: HeatmapCell[];
  commodityList: string[];
  rollingCorrelations: RollingCorr[];
  insights: Insight[];
}

const ROLLING_COLORS = ["#1a73e8", "#188038", "#f9ab00", "#8b5cf6"];
const INSIGHT_STYLE: Record<string, string> = {
  strongest: "border-l-gcs-blue bg-blue-50/50",
  weakest: "border-l-purple-400 bg-purple-50/50",
  divergence: "border-l-gcs-yellow bg-amber-50/50",
  opportunity: "border-l-gcs-green bg-green-50/50",
};
const INSIGHT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strongest: Target,
  weakest: Shuffle,
  divergence: AlertTriangle,
  opportunity: Zap,
};

function corrColor(val: number): string {
  if (val === 1) return "rgb(22, 101, 52)";
  const abs = Math.abs(val);
  if (val > 0) {
    const r = Math.round(255 - abs * 200);
    const g = Math.round(255 - abs * 80);
    const b = Math.round(255 - abs * 200);
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round(255 - abs * 50);
    const g = Math.round(255 - abs * 180);
    const b = Math.round(255 - abs * 180);
    return `rgb(${r},${g},${b})`;
  }
}

function corrTextColor(val: number): string {
  return Math.abs(val) > 0.6 || val === 1 ? "text-white" : "text-gcs-gray-700";
}

/* ── Demo data generators ── */
function generateDemoHeatmap(): { cells: HeatmapCell[]; commodities: string[] } {
  const commodities = ["Carob", "Cocoa", "Sugar", "Palm Oil", "Wheat", "Coffee", "Soy", "Corn"];
  const cells: HeatmapCell[] = [];
  for (const x of commodities) {
    for (const y of commodities) {
      const val = x === y ? 1 : parseFloat((Math.random() * 1.6 - 0.3).toFixed(2));
      const clamped = Math.max(-1, Math.min(1, val));
      cells.push({
        x, y, value: x === y ? 1 : clamped,
        significance: Math.abs(clamped) > 0.7 ? "strong" : Math.abs(clamped) > 0.4 ? "moderate" : "weak",
        trend: Math.random() > 0.5 ? "rising" : "falling",
        prevValue: parseFloat((clamped - (Math.random() * 0.2 - 0.1)).toFixed(2)),
      });
    }
  }
  return { cells, commodities };
}

function generateDemoRolling(): RollingCorr[] {
  const pairs = ["Carob/Cocoa", "Carob/Sugar", "Cocoa/Coffee", "Sugar/Corn"];
  const data: RollingCorr[] = [];
  for (let d = 0; d < 60; d++) {
    const date = new Date(2024, 6, 1 + d).toISOString().slice(0, 10);
    for (const pair of pairs) {
      data.push({ date, pair, value: parseFloat((0.3 + Math.random() * 0.5 + Math.sin(d / 10) * 0.15).toFixed(3)) });
    }
  }
  return data;
}

function generateDemoSpreads(): SpreadPoint[] {
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date(2024, 6, 1 + i).toISOString().slice(0, 10);
    const cocoa = 3000 + Math.random() * 400 + Math.sin(i / 15) * 200;
    const carob = 4.2 + Math.random() * 0.5 + Math.sin(i / 12) * 0.2;
    return { date, cocoa: Math.round(cocoa), carob: parseFloat(carob.toFixed(2)), spread: Math.round(cocoa - carob * 700) };
  });
}

export default function ResourcesPage() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"market" | "heatmap" | "signals">("market");
  const [period, setPeriod] = useState("6m");
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    fetch("/api/commodities")
      .then((r) => r.json())
      .then((comm) => {
        const timeSeries: TimeSeriesPoint[] = (comm.timeSeries || []).map((t: Record<string, unknown>) => ({
          date: String(t.date || t.month || ""),
          carob: Number(t.carob || t.carobPrice || (t.prices as Record<string, number>)?.Carob || 0),
          cocoa: Number(t.cocoa || t.cocoaPrice || (t.prices as Record<string, number>)?.Cocoa || 0),
          sugar: Number(t.sugar || t.sugarPrice || (t.prices as Record<string, number>)?.Sugar || 0),
        }));
        const correlations: Correlation[] = (comm.correlations || []).slice(0, 20).map((c: Record<string, unknown>) => ({
          pair: c.pair ? String(c.pair) : `${c.x}/${c.y}`,
          coefficient: Number(c.coefficient || c.value || c.corr || 0),
          strength: String(c.strength || c.significance || (Math.abs(Number(c.coefficient || c.value || 0)) > 0.7 ? "Strong" : Math.abs(Number(c.coefficient || c.value || 0)) > 0.4 ? "Moderate" : "Weak")),
        }));
        const signals: Signal[] = (comm.signals || []).map((s: Record<string, unknown>) => ({
          id: String(s.id || ""),
          indicator: String(s.indicator || s.name || s.commodity || ""),
          signal: String(s.signal || s.direction || s.type || ""),
          strength: String(s.strength || "medium"),
          timeframe: String(s.timeframe || s.period || ""),
          commodity: String(s.commodity || ""),
          message: String(s.message || ""),
          type: String(s.type || s.signal || ""),
        }));
        const forwardCurve: ForwardPoint[] = (comm.forwardCurve || []).map((f: Record<string, unknown>) => ({
          month: String(f.month || f.date || ""),
          price: Number(f.price || f.forward || 0),
          spot: Number(f.spot || 0),
        }));
        const fundamentals: Fundamental[] = (comm.fundamentals || []).map((f: Record<string, unknown>) => ({
          metric: String(f.metric || f.name || f.label || ""),
          value: String(f.value || ""),
          change: String(f.change || ""),
          trend: String(f.trend || "stable"),
        }));

        // Advanced data from V1 commodities API
        const heatmapRaw: HeatmapCell[] = (comm.correlations || []).map((c: Record<string, unknown>) => ({
          x: String(c.x || ""), y: String(c.y || ""),
          value: Number(c.value || c.coefficient || 0),
          significance: String(c.significance || ""),
          trend: String(c.trend || "stable"),
          prevValue: Number(c.prevValue || 0),
        }));
        const commodityList: string[] = comm.commodityList || [...new Set(heatmapRaw.map((c) => c.x))];
        const rollingRaw: RollingCorr[] = (comm.rollingCorrelations || []).map((r: Record<string, unknown>) => ({
          date: String(r.date || ""), pair: String(r.pair || ""), value: Number(r.value || 0),
        }));
        const spreads: SpreadPoint[] = (comm.spreads || []).map((s: Record<string, unknown>) => ({
          date: String(s.date || ""), cocoa: Number(s.cocoa || 0), carob: Number(s.carob || 0), spread: Number(s.spread || 0),
        }));
        const insights: Insight[] = (comm.insights || []).map((ins: Record<string, unknown>) => ({
          type: String(ins.type || ""), title: String(ins.title || ""),
          description: String(ins.description || ""),
          pairs: (ins.pairs as [string, string]) || ["", ""],
          value: Number(ins.value || 0),
        }));

        // Use demo data for heatmap/rolling/spreads if API doesn't provide them
        const demoHeatmap = heatmapRaw.length > 0 && commodityList.length > 0 ? { cells: heatmapRaw, commodities: commodityList } : generateDemoHeatmap();
        const demoRolling = rollingRaw.length > 0 ? rollingRaw : generateDemoRolling();
        const demoSpreads = spreads.length > 0 ? spreads : generateDemoSpreads();

        const lastTs = timeSeries.length ? timeSeries[timeSeries.length - 1] : null;
        const prevTs = timeSeries.length > 1 ? timeSeries[timeSeries.length - 2] : null;

        setData({
          timeSeries, correlations, signals, forwardCurve, fundamentals,
          carobSpot: lastTs?.carob || 4.5,
          carobChange: lastTs && prevTs ? ((lastTs.carob - prevTs.carob) / prevTs.carob * 100) : 2.3,
          cocoaSpot: lastTs?.cocoa || 3200,
          sugarSpot: lastTs?.sugar || 0.28,
          spreads: demoSpreads,
          heatmapCells: demoHeatmap.cells,
          commodityList: demoHeatmap.commodities,
          rollingCorrelations: demoRolling,
          insights: insights.length > 0 ? insights : [
            { type: "strongest", title: "Carob-Cocoa strongest link", description: "These commodities show the strongest positive correlation over 180 days, suggesting price movements track closely.", pairs: ["Carob", "Cocoa"], value: 0.82 },
            { type: "opportunity", title: "Cocoa spike = carob opportunity", description: "When cocoa spikes, carob becomes an attractive substitute. The spread premium creates pricing advantage.", pairs: ["Cocoa", "Carob"], value: 0.78 },
            { type: "divergence", title: "Sugar diverging from carob", description: "The sugar-carob correlation has weakened significantly in the last 30 days, indicating decoupling.", pairs: ["Sugar", "Carob"], value: -0.15 },
          ],
        });
      })
      .catch((err) => {
        console.error("[V2 Resources] Failed to load data, using demo fallback:", err);
        const demoHeatmap = generateDemoHeatmap();
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
            { indicator: "RSI (14d)", signal: "Buy", strength: "strong", timeframe: "Short-term", type: "buy", commodity: "Carob", message: "RSI at 32 — oversold territory, buy signal", id: "s1" },
            { indicator: "MACD", signal: "Bullish", strength: "medium", timeframe: "Medium-term", type: "buy", commodity: "Carob", message: "MACD crossover detected — bullish momentum", id: "s2" },
            { indicator: "200-day MA", signal: "Above", strength: "strong", timeframe: "Long-term", type: "hold", commodity: "Carob", message: "Price above 200-day MA — long-term uptrend intact", id: "s3" },
            { indicator: "Bollinger Bands", signal: "Neutral", strength: "weak", timeframe: "Short-term", type: "hold", commodity: "Cocoa", message: "Price within bands — no clear signal", id: "s4" },
            { indicator: "Volume Trend", signal: "Increasing", strength: "medium", timeframe: "Short-term", type: "buy", commodity: "Carob", message: "Volume rising with price — confirms trend", id: "s5" },
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
          spreads: generateDemoSpreads(),
          heatmapCells: demoHeatmap.cells,
          commodityList: demoHeatmap.commodities,
          rollingCorrelations: generateDemoRolling(),
          insights: [
            { type: "strongest", title: "Carob-Cocoa strongest link", description: "Strongest positive correlation over 180 days.", pairs: ["Carob", "Cocoa"], value: 0.82 },
            { type: "opportunity", title: "Cocoa spike = carob opportunity", description: "Carob becomes attractive substitute when cocoa spikes.", pairs: ["Cocoa", "Carob"], value: 0.78 },
            { type: "divergence", title: "Sugar diverging", description: "Sugar-carob correlation has weakened, indicating decoupling.", pairs: ["Sugar", "Carob"], value: -0.15 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Scatter data for selected heatmap pair ── */
  const scatterData = useMemo(() => {
    if (!data?.timeSeries || !selectedPair) return [];
    return data.timeSeries.map((t) => {
      const xKey = selectedPair[0].toLowerCase() as keyof TimeSeriesPoint;
      const yKey = selectedPair[1].toLowerCase() as keyof TimeSeriesPoint;
      return { x: Number(t[xKey] || 0), y: Number(t[yKey] || 0), date: t.date };
    });
  }, [data, selectedPair]);

  const selectedCorr = useMemo(() => {
    if (!data?.heatmapCells || !selectedPair) return null;
    return data.heatmapCells.find((c) => c.x === selectedPair[0] && c.y === selectedPair[1]) || null;
  }, [data, selectedPair]);

  /* ── Rolling chart pivot ── */
  const rollingChartData = useMemo(() => {
    if (!data?.rollingCorrelations) return [];
    const dateMap: Record<string, Record<string, number>> = {};
    for (const rc of data.rollingCorrelations) {
      if (!dateMap[rc.date]) dateMap[rc.date] = {};
      dateMap[rc.date][rc.pair] = rc.value;
    }
    return Object.entries(dateMap).map(([date, vals]) => ({ date, ...vals }));
  }, [data]);

  const rollingPairs = useMemo(() => {
    if (!data?.rollingCorrelations) return [];
    return [...new Set(data.rollingCorrelations.map((r) => r.pair))];
  }, [data]);

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

  const latestSpread = data.spreads.length ? data.spreads[data.spreads.length - 1] : null;
  const prevSpread = data.spreads.length > 30 ? data.spreads[data.spreads.length - 30] : null;
  const spreadChange = latestSpread && prevSpread ? ((latestSpread.spread - prevSpread.spread) / Math.abs(prevSpread.spread) * 100).toFixed(1) : "0";

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Carob Spot", value: `$${data.carobSpot.toFixed(2)}/kg`, sub: `${data.carobChange >= 0 ? "+" : ""}${data.carobChange.toFixed(1)}% MoM`, positive: data.carobChange >= 0 },
          { label: "Cocoa (ICE)", value: `$${data.cocoaSpot.toFixed(0)}/t`, sub: "benchmark", positive: true },
          { label: "Sugar (ICE)", value: `$${data.sugarSpot.toFixed(2)}/lb`, sub: "reference", positive: true },
          { label: "Spread", value: latestSpread ? `$${latestSpread.spread}/t` : "—", sub: `${Number(spreadChange) >= 0 ? "+" : ""}${spreadChange}%`, positive: Number(spreadChange) >= 0 },
          { label: "Signals", value: `${data.signals.filter((s) => (s.type || s.signal).toLowerCase().match(/buy|bullish/)).length}/${data.signals.length}`, sub: "bullish", positive: true },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-3 py-2.5">
              <p className="v2-kpi-label">{k.label}</p>
              <p className="v2-kpi-value text-[18px]">{k.value}</p>
              <p className={`v2-kpi-sub ${k.positive ? "text-gcs-green" : "text-gcs-red"}`}>{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200">
        {(["market", "heatmap", "signals"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium ${tab === t ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t === "market" ? "Market Data" : t === "heatmap" ? "Correlation Matrix" : "Trading Signals"}
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

      {/* ══════════ Tab: Market Data ══════════ */}
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

          {/* Spread Chart (from V1) */}
          <V2Card title="Cocoa / Carob Spread" subtitle={`Current spread: $${latestSpread?.spread || 0}/t (${spreadChange}%)`}>
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spreads.filter((_, i) => i % 2 === 0)}>
                  <defs>
                    <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cocoa" stroke="#d93025" strokeWidth={1.5} dot={false} name="Cocoa" />
                  <Line type="monotone" dataKey="carob" stroke="#1a73e8" strokeWidth={1.5} dot={false} name="Carob (×700)" />
                  <Area type="monotone" dataKey="spread" stroke="#188038" fill="url(#spreadGrad)" strokeWidth={1.5} dot={false} name="Spread" />
                </AreaChart>
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

      {/* ══════════ Tab: Correlation Matrix (from V1 commodities) ══════════ */}
      {tab === "heatmap" && (
        <div className="space-y-4">
          {/* Interactive Heatmap */}
          <V2Card title="Correlation Heatmap" subtitle={`${data.commodityList.length}×${data.commodityList.length} matrix — Pearson, 180d · Click to explore`}>
            {/* Hovered cell tooltip */}
            {hoveredCell && hoveredCell.x !== hoveredCell.y && (
              <div className="mx-4 mb-2 flex items-center gap-4 rounded-lg border border-gcs-gray-100 bg-gcs-gray-50 px-4 py-2 text-xs">
                <span className="font-bold text-gcs-gray-900">{hoveredCell.x} ↔ {hoveredCell.y}</span>
                <span className={cn("font-mono text-lg font-black", hoveredCell.value >= 0 ? "text-gcs-green" : "text-gcs-red")}>
                  {hoveredCell.value.toFixed(3)}
                </span>
                {hoveredCell.significance && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                    hoveredCell.significance === "strong" ? "bg-blue-50 text-gcs-blue" :
                    hoveredCell.significance === "moderate" ? "bg-yellow-50 text-gcs-yellow" :
                    "bg-gcs-gray-100 text-gcs-gray-500"
                  )}>{hoveredCell.significance}</span>
                )}
                {hoveredCell.prevValue !== undefined && (
                  <span className="flex items-center gap-0.5 text-gcs-gray-500">
                    {hoveredCell.trend === "rising" ? <TrendingUp className="h-3 w-3 text-gcs-green" /> : <TrendingDown className="h-3 w-3 text-gcs-red" />}
                    Prev: {hoveredCell.prevValue.toFixed(3)}
                  </span>
                )}
              </div>
            )}

            <div className="px-4 py-2 overflow-x-auto">
              <table className="text-[11px]">
                <thead>
                  <tr>
                    <th className="p-1 min-w-[80px]" />
                    {data.commodityList.map((c) => (
                      <th key={c} className="p-1 text-center font-medium text-gcs-gray-500 min-w-[60px]" style={{ writingMode: "vertical-rl", textOrientation: "mixed", height: 70 }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.commodityList.map((row) => (
                    <tr key={row}>
                      <td className="p-1 font-medium text-gcs-gray-700 whitespace-nowrap text-xs">{row}</td>
                      {data.commodityList.map((col) => {
                        const cell = data.heatmapCells.find((c) => c.x === row && c.y === col);
                        const val = cell?.value || 0;
                        const isSelected = selectedPair && selectedPair[0] === row && selectedPair[1] === col;
                        const isDiag = row === col;
                        return (
                          <td
                            key={col}
                            className={cn(
                              "p-1 text-center cursor-pointer transition-all font-mono text-[11px] font-semibold",
                              corrTextColor(val),
                              isSelected ? "ring-2 ring-gcs-blue ring-offset-1" : "",
                              !isDiag ? "hover:ring-2 hover:ring-gcs-gray-300" : ""
                            )}
                            style={{ backgroundColor: corrColor(val), borderRadius: 4 }}
                            onClick={() => !isDiag && setSelectedPair([row, col])}
                            onMouseEnter={() => cell && setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Color legend */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gcs-gray-500">
                <span>Negative</span>
                <div className="flex h-3 w-40 overflow-hidden rounded-full">
                  <div className="flex-1" style={{ background: "linear-gradient(to right, rgb(205,75,75), rgb(255,255,255), rgb(22,101,52))" }} />
                </div>
                <span>Positive</span>
              </div>
            </div>
          </V2Card>

          {/* Scatter Plot + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <V2Card title={selectedPair ? `Scatter: ${selectedPair[0]} vs ${selectedPair[1]}` : "Scatter Plot"} subtitle="Click a heatmap cell to explore">
              {selectedPair && scatterData.length > 0 ? (
                <div className="px-4 py-2">
                  <div className="mb-2 flex items-center gap-3 text-xs">
                    <span className="font-medium text-gcs-gray-700">Pearson r =</span>
                    <span className={cn("font-mono text-lg font-black", (selectedCorr?.value || 0) >= 0 ? "text-gcs-green" : "text-gcs-red")}>
                      {selectedCorr?.value.toFixed(3)}
                    </span>
                    <span className="text-gcs-gray-400">R² = {((selectedCorr?.value || 0) ** 2).toFixed(3)}</span>
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                        <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} name={selectedPair[0]}
                          label={{ value: selectedPair[0], position: "insideBottom", offset: -5, fontSize: 11, fill: "#80868b" }} />
                        <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} name={selectedPair[1]}
                          label={{ value: selectedPair[1], angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#80868b" }} />
                        <ZAxis range={[20, 20]} />
                        <Tooltip content={({ payload }) => {
                          if (!payload?.[0]) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-gcs-gray-200 bg-white p-2 text-xs shadow">
                              <p className="text-gcs-gray-500">{d.date}</p>
                              <p className="font-medium">{selectedPair[0]}: {d.x}</p>
                              <p className="font-medium">{selectedPair[1]}: {d.y}</p>
                            </div>
                          );
                        }} />
                        <Scatter data={scatterData} fill="#1a73e8" fillOpacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center text-gcs-gray-400">
                  <Shuffle className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-xs">Click a heatmap cell to view scatter plot</p>
                </div>
              )}
            </V2Card>

            {/* Insights */}
            <V2Card title="Insights" subtitle="Auto-detected correlation patterns">
              <div className="px-4 py-2 space-y-2">
                {data.insights.map((ins, i) => {
                  const Icon = INSIGHT_ICONS[ins.type] || Lightbulb;
                  return (
                    <div
                      key={i}
                      className={cn("rounded-lg border-l-4 p-3 cursor-pointer hover:shadow-sm transition-shadow", INSIGHT_STYLE[ins.type] || "border-l-gcs-gray-300 bg-gcs-gray-50")}
                      onClick={() => setSelectedPair(ins.pairs)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gcs-gray-500" />
                        <span className="text-xs font-medium text-gcs-gray-900">{ins.title}</span>
                        <span className="ml-auto font-mono text-[10px] font-bold text-gcs-gray-500">
                          r={ins.value.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-gcs-gray-500 leading-relaxed">{ins.description}</p>
                    </div>
                  );
                })}
              </div>
            </V2Card>
          </div>

          {/* Rolling Correlation Chart */}
          <V2Card title="Rolling 30-Day Correlation" subtitle="Key pair correlations over time">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rollingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                    interval={Math.floor(rollingChartData.length / 8)} />
                  <YAxis tick={{ fontSize: 10 }} domain={[-0.5, 1]} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip formatter={(value: number, name: string) => [value.toFixed(3), name]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e8eaed", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {rollingPairs.map((pair, idx) => (
                    <Line key={pair} type="monotone" dataKey={pair}
                      stroke={ROLLING_COLORS[idx % ROLLING_COLORS.length]}
                      strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>
      )}

      {/* ══════════ Tab: Trading Signals ══════════ */}
      {tab === "signals" && (
        <div className="space-y-4">
          {/* Signal Cards (V1 style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.signals.map((s) => {
              const sigType = (s.type || s.signal || "").toLowerCase();
              const isBuy = sigType.includes("buy") || sigType.includes("bullish") || sigType.includes("above") || sigType.includes("increas");
              const isSell = sigType.includes("sell") || sigType.includes("bearish") || sigType.includes("below") || sigType.includes("decreas");
              return (
                <div key={s.id || s.indicator} className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  isBuy ? "border-green-200 bg-green-50" : isSell ? "border-red-200 bg-red-50" : "border-gcs-gray-200 bg-gcs-gray-50"
                )}>
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4 flex-shrink-0",
                    isBuy ? "text-gcs-green" : isSell ? "text-gcs-red" : "text-gcs-yellow"
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        isBuy ? "bg-green-200 text-green-800" : isSell ? "bg-red-200 text-red-800" : "bg-gcs-gray-200 text-gcs-gray-700"
                      )}>
                        {isBuy ? "buy" : isSell ? "sell" : "hold"}
                      </span>
                      <span className="text-[10px] text-gcs-gray-500">{s.commodity || s.indicator}</span>
                      <span className="text-[10px] text-gcs-gray-400 ml-auto">{s.timeframe}</span>
                    </div>
                    <p className="text-xs font-medium text-gcs-gray-900">{s.indicator}</p>
                    {s.message && <p className="text-[10px] text-gcs-gray-500 mt-0.5">{s.message}</p>}
                    {/* Strength bar */}
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gcs-gray-200">
                      <div className={cn("h-full rounded-full",
                        isBuy ? "bg-gcs-green" : isSell ? "bg-gcs-red" : "bg-gcs-yellow"
                      )} style={{ width: s.strength === "strong" ? "90%" : s.strength === "medium" ? "60%" : "30%" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table view */}
          <V2Card title="Technical Indicators" subtitle="Summary table">
            <table className="v2-table">
              <thead><tr><th>Indicator</th><th>Signal</th><th>Strength</th><th>Timeframe</th></tr></thead>
              <tbody>
                {data.signals.map((s) => {
                  const isBullish = (s.type || s.signal).toLowerCase().match(/buy|bullish|above|increas/);
                  return (
                    <tr key={s.id || s.indicator}>
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
