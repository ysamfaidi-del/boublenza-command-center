"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommodityData, SpreadPoint, CorrelationPair, MarketSignal } from "@/types/premium";

export default function CommoditiesPage() {
  const [data, setData] = useState<CommodityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/commodities").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  const latest = data.spreads[data.spreads.length - 1];
  const prev = data.spreads[data.spreads.length - 30];
  const spreadChange = prev ? ((latest.spread - prev.spread) / prev.spread * 100).toFixed(1) : "0";

  // Build correlation grid
  const commodities = [...new Set(data.correlations.map((c) => c.x))];

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Correlation Matrix */}
        <div className="card">
          <h3 className="card-header">Matrice de corrélation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr><th className="p-1" />{commodities.map((c) => <th key={c} className="p-1 text-center font-medium text-gray-500">{c}</th>)}</tr>
              </thead>
              <tbody>
                {commodities.map((row) => (
                  <tr key={row}>
                    <td className="p-1 font-medium text-gray-700">{row}</td>
                    {commodities.map((col) => {
                      const val = data.correlations.find((c) => c.x === row && c.y === col)?.value || 0;
                      const intensity = Math.abs(val);
                      const bg = val === 1 ? "bg-forest-600" : intensity > 0.5 ? "bg-forest-400" : intensity > 0.3 ? "bg-forest-200" : "bg-gray-100";
                      const text = intensity > 0.5 ? "text-white" : "text-gray-700";
                      return <td key={col} className={cn("p-1.5 text-center rounded", bg, text)}>{val.toFixed(2)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Signals */}
        <div className="card">
          <h3 className="card-header">Signaux de marché</h3>
          <div className="space-y-3">
            {data.signals.map((s) => (
              <div key={s.id} className={cn("flex items-start gap-3 rounded-lg border p-4", s.type === "buy" ? "border-green-200 bg-green-50" : s.type === "sell" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50")}>
                <AlertTriangle className={cn("mt-0.5 h-5 w-5 flex-shrink-0", s.type === "buy" ? "text-green-600" : s.type === "sell" ? "text-red-600" : "text-yellow-600")} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", s.type === "buy" ? "bg-green-200 text-green-800" : s.type === "sell" ? "bg-red-200 text-red-800" : "bg-yellow-200 text-yellow-800")}>
                      {s.type}
                    </span>
                    <span className="text-xs text-gray-500">{s.commodity}</span>
                    <span className="ml-auto text-xs text-gray-400">Force : {Math.round(s.strength * 100)}%</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{s.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
