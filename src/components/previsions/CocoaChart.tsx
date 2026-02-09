"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CocoaPricePoint } from "@/types";

const PERIODS = [
  { key: "1m", label: "1 mois" },
  { key: "3m", label: "3 mois" },
  { key: "1y", label: "1 an" },
];

export default function CocoaChart() {
  const [period, setPeriod] = useState("3m");
  const [data, setData] = useState<CocoaPricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/cocoa?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d.prices || []))
      .finally(() => setLoading(false));
  }, [period]);

  const current = data[data.length - 1]?.price || 0;
  const prev = data[0]?.price || 0;
  const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="card-header">Cours du Cacao</h3>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === p.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="mt-4 flex items-center gap-6">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(current, "USD")}/t
          </p>
          <p className="text-xs text-gray-500">Prix spot cacao</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
            change > 0
              ? "bg-red-50 text-red-700"
              : change < 0
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-700"
          )}
        >
          {change > 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : change < 0 ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </div>
        <div className="ml-auto rounded-lg bg-forest-50 px-3 py-2">
          <p className="text-xs text-forest-600">
            Caroube = substitut naturel du cacao, prix 3-5× inférieur
          </p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex h-[280px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="cocoaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b07a3b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#b07a3b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}/t`, "Cacao"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#b07a3b"
                strokeWidth={2}
                fill="url(#cocoaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
