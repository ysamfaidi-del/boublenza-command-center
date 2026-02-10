"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis,
} from "recharts";
import {
  Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Lightbulb, Target, Shuffle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommodityData, CorrelationPair, CorrelationInsight } from "@/types/premium";

const INSIGHT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strongest: Target,
  weakest: Shuffle,
  divergence: AlertTriangle,
  opportunity: Zap,
};
const INSIGHT_COLORS: Record<string, string> = {
  strongest: "border-l-blue-400 bg-blue-50/50",
  weakest: "border-l-purple-400 bg-purple-50/50",
  divergence: "border-l-amber-400 bg-amber-50/50",
  opportunity: "border-l-green-400 bg-green-50/50",
};

function corrColor(val: number): string {
  if (val === 1) return "rgb(22, 101, 52)";  // green-800
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
  return Math.abs(val) > 0.6 || val === 1 ? "text-white" : "text-gray-800";
}

const ROLLING_COLORS = ["#3a9348", "#3b82f6", "#f59e0b", "#8b5cf6"];

export default function CommoditiesPage() {
  const [data, setData] = useState<CommodityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CorrelationPair | null>(null);

  useEffect(() => {
    fetch("/api/commodities").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  // Scatter data for selected pair
  const scatterData = useMemo(() => {
    if (!data?.timeSeries || !selectedPair) return [];
    return data.timeSeries.map((s) => ({
      x: s.prices[selectedPair[0]],
      y: s.prices[selectedPair[1]],
      date: s.date,
    }));
  }, [data, selectedPair]);

  // Selected pair correlation value
  const selectedCorr = useMemo(() => {
    if (!data?.correlations || !selectedPair) return null;
    return data.correlations.find((c) => c.x === selectedPair[0] && c.y === selectedPair[1]) || null;
  }, [data, selectedPair]);

  // Rolling chart data: pivot by date
  const rollingChartData = useMemo(() => {
    if (!data?.rollingCorrelations) return [];
    const dateMap: Record<string, Record<string, number>> = {};
    for (const rc of data.rollingCorrelations) {
      if (!dateMap[rc.date]) dateMap[rc.date] = { _date: 0 };
      dateMap[rc.date][rc.pair] = rc.value;
    }
    return Object.entries(dateMap).map(([date, vals]) => ({ date, ...vals }));
  }, [data]);

  const rollingPairs = useMemo(() => {
    if (!data?.rollingCorrelations) return [];
    return [...new Set(data.rollingCorrelations.map((r) => r.pair))];
  }, [data]);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  const latest = data.spreads[data.spreads.length - 1];
  const prev = data.spreads[data.spreads.length - 30];
  const spreadChange = prev ? ((latest.spread - prev.spread) / prev.spread * 100).toFixed(1) : "0";
  const commodities = data.commodityList || [...new Set(data.correlations.map((c) => c.x))];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {data.fundamentals.map((f) => (
          <div key={f.label} className="card">
            <p className="text-xs text-gray-500">{f.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{f.value}</p>
            <div className={cn("mt-1 flex items-center gap-1 text-xs", f.trend > 0 ? "text-green-600" : f.trend < 0 ? "text-red-600" : "text-gray-500")}>
              {f.trend > 0 ? <TrendingUp className="h-3 w-3" /> : f.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {f.trend > 0 ? "+" : ""}{f.trend}%
            </div>
          </div>
        ))}
      </div>

      {/* Spread Chart */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="card-header">Spread Cacao / Caroube — 6 mois</h3>
          <div className={cn("rounded-full px-3 py-1 text-sm font-medium", Number(spreadChange) > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            Spread : ${latest.spread}/t ({spreadChange}%)
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.spreads.filter((_, i) => i % 3 === 0)} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a9348" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3a9348" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number, n: string) => [`$${v.toLocaleString()}/t`, n === "cocoa" ? "Cacao" : n === "carob" ? "Caroube" : "Spread"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Legend formatter={(v) => v === "cocoa" ? "Cacao" : v === "carob" ? "Caroube" : "Spread"} />
              <Line type="monotone" dataKey="cocoa" stroke="#b07a3b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="carob" stroke="#3a9348" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="spread" stroke="#3a9348" fill="url(#spreadGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CORRELATION MATRIX — ADVANCED SECTION
          ═══════════════════════════════════════════════════════ */}

      {/* Heatmap + Tooltip */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="card-header">
            <Target className="mr-2 inline h-4 w-4" />
            Matrice de corrélation — 8 commodités (Pearson, 180j)
          </h3>
          <span className="text-xs text-gray-400">Cliquer sur une cellule pour explorer</span>
        </div>

        {/* Hovered cell tooltip */}
        {hoveredCell && hoveredCell.x !== hoveredCell.y && (
          <div className="mb-3 flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-xs">
            <span className="font-bold text-gray-900">{hoveredCell.x} ↔ {hoveredCell.y}</span>
            <span className={cn("font-mono text-lg font-black", hoveredCell.value >= 0 ? "text-green-700" : "text-red-700")}>
              {hoveredCell.value.toFixed(3)}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
              hoveredCell.significance === "strong" ? "bg-green-100 text-green-800" :
              hoveredCell.significance === "moderate" ? "bg-blue-100 text-blue-800" :
              hoveredCell.significance === "weak" ? "bg-gray-100 text-gray-600" :
              "bg-gray-50 text-gray-400"
            )}>
              {hoveredCell.significance}
            </span>
            <span className="flex items-center gap-0.5">
              {hoveredCell.trend === "rising" ? <ArrowUpRight className="h-3 w-3 text-green-600" /> :
               hoveredCell.trend === "falling" ? <ArrowDownRight className="h-3 w-3 text-red-600" /> :
               <Minus className="h-3 w-3 text-gray-400" />}
              <span className="text-gray-500">
                Avant : {hoveredCell.prevValue.toFixed(3)}
              </span>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr>
                <th className="p-1 min-w-[90px]" />
                {commodities.map((c) => (
                  <th key={c} className="p-1 text-center font-medium text-gray-500 min-w-[70px]" style={{ writingMode: "vertical-rl", textOrientation: "mixed", height: 80 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commodities.map((row) => (
                <tr key={row}>
                  <td className="p-1 font-medium text-gray-700 whitespace-nowrap text-xs">{row}</td>
                  {commodities.map((col) => {
                    const pair = data.correlations.find((c) => c.x === row && c.y === col);
                    const val = pair?.value || 0;
                    const isSelected = selectedPair && selectedPair[0] === row && selectedPair[1] === col;
                    const isDiag = row === col;

                    return (
                      <td
                        key={col}
                        className={cn(
                          "p-1 text-center cursor-pointer transition-all font-mono text-[11px] font-semibold",
                          corrTextColor(val),
                          isSelected ? "ring-2 ring-wr-green ring-offset-1" : "",
                          !isDiag ? "hover:ring-2 hover:ring-gray-300" : ""
                        )}
                        style={{
                          backgroundColor: corrColor(val),
                          borderRadius: 4,
                        }}
                        onClick={() => !isDiag && setSelectedPair([row, col])}
                        onMouseEnter={() => pair && setHoveredCell(pair)}
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
        </div>

        {/* Color legend */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-500">
          <span>Corrélation négative</span>
          <div className="flex h-3 w-40 overflow-hidden rounded-full">
            <div className="flex-1" style={{ background: "linear-gradient(to right, rgb(205,75,75), rgb(255,255,255), rgb(22,101,52))" }} />
          </div>
          <span>Corrélation positive</span>
        </div>
      </div>

      {/* Scatter Plot + Insights side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Scatter Plot for selected pair */}
        <div className="card">
          <h3 className="card-header">
            <Shuffle className="mr-2 inline h-4 w-4" />
            Nuage de points {selectedPair ? `— ${selectedPair[0]} vs ${selectedPair[1]}` : "— Sélectionner une paire"}
          </h3>
          {selectedPair && scatterData.length > 0 ? (
            <>
              <div className="mb-2 flex items-center gap-3 text-xs">
                <span className="font-medium text-gray-700">Pearson r = </span>
                <span className={cn("font-mono text-lg font-black", (selectedCorr?.value || 0) >= 0 ? "text-green-700" : "text-red-700")}>
                  {selectedCorr?.value.toFixed(3)}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                  selectedCorr?.significance === "strong" ? "bg-green-100 text-green-800" :
                  selectedCorr?.significance === "moderate" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {selectedCorr?.significance}
                </span>
                <span className="text-gray-400">R² = {((selectedCorr?.value || 0) ** 2).toFixed(3)}</span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number" dataKey="x" name={selectedPair[0]}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`}
                      label={{ value: selectedPair[0], position: "insideBottom", offset: -5, fontSize: 11, fill: "#6b7280" }}
                    />
                    <YAxis
                      type="number" dataKey="y" name={selectedPair[1]}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`}
                      label={{ value: selectedPair[1], angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#6b7280" }}
                    />
                    <ZAxis range={[20, 20]} />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow">
                            <p className="text-gray-500">{d.date}</p>
                            <p className="font-medium">{selectedPair[0]}: ${d.x?.toLocaleString()}</p>
                            <p className="font-medium">{selectedPair[1]}: ${d.y?.toLocaleString()}</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} fill="#3a9348" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex h-[340px] flex-col items-center justify-center text-gray-400">
              <Shuffle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Cliquer sur une cellule de la matrice</p>
              <p className="text-xs">pour afficher le nuage de points</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card">
          <h3 className="card-header">
            <Lightbulb className="mr-2 inline h-4 w-4 text-amber-500" />
            Insights automatiques
          </h3>
          <div className="space-y-3">
            {(data.insights || []).map((insight: CorrelationInsight, i: number) => {
              const Icon = INSIGHT_ICONS[insight.type] || Lightbulb;
              return (
                <div
                  key={i}
                  className={cn("rounded-lg border-l-4 p-4 cursor-pointer hover:shadow-md transition-shadow", INSIGHT_COLORS[insight.type] || "border-l-gray-300 bg-gray-50")}
                  onClick={() => setSelectedPair(insight.pairs)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0 text-gray-600" />
                    <span className="text-sm font-bold text-gray-900">{insight.title}</span>
                    <span className="ml-auto font-mono text-xs font-bold text-gray-500">
                      {insight.value >= -1 && insight.value <= 1 ? `r=${insight.value.toFixed(2)}` : `Δ${insight.value.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                </div>
              );
            })}
            {(!data.insights || data.insights.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">Aucun insight détecté</p>
            )}
          </div>
        </div>
      </div>

      {/* Rolling Correlation Chart */}
      <div className="card">
        <h3 className="card-header">
          <TrendingUp className="mr-2 inline h-4 w-4" />
          Corrélation glissante 30 jours — Paires clés
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
                interval={Math.floor(rollingChartData.length / 8)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                domain={[-0.5, 1]}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [value.toFixed(3), name]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                labelFormatter={(label) => { const d = new Date(label); return d.toLocaleDateString("fr-FR"); }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* Zero line */}
              <Line type="monotone" dataKey={() => 0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} dot={false} legendType="none" />
              {rollingPairs.map((pair, idx) => (
                <Line
                  key={pair}
                  type="monotone"
                  dataKey={pair}
                  stroke={ROLLING_COLORS[idx % ROLLING_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Signals */}
      <div className="card">
        <h3 className="card-header">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Signaux de marché
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.signals.map((s) => (
            <div key={s.id} className={cn("flex items-start gap-3 rounded-lg border p-4", s.type === "buy" ? "border-green-200 bg-green-50" : s.type === "sell" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50")}>
              <AlertTriangle className={cn("mt-0.5 h-5 w-5 flex-shrink-0", s.type === "buy" ? "text-green-600" : s.type === "sell" ? "text-red-600" : "text-yellow-600")} />
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", s.type === "buy" ? "bg-green-200 text-green-800" : s.type === "sell" ? "bg-red-200 text-red-800" : "bg-yellow-200 text-yellow-800")}>
                    {s.type}
                  </span>
                  <span className="text-xs text-gray-500">{s.commodity}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{s.message}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className={cn("h-full rounded-full", s.type === "buy" ? "bg-green-500" : s.type === "sell" ? "bg-red-500" : "bg-yellow-500")} style={{ width: `${s.strength * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
