"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart,
} from "recharts";
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { cn, PRODUCT_COLORS } from "@/lib/utils";
import type { DemandForecast as DemandForecastType } from "@/types";

export default function DemandForecast() {
  const [forecasts, setForecasts] = useState<DemandForecastType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/previsions/demand")
      .then((r) => r.json())
      .then((d) => setForecasts(d.forecasts || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card flex h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {forecasts.map((f) => {
        const color = PRODUCT_COLORS[f.product] || "#3a9348";
        return (
          <div key={f.product} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <h4 className="text-base font-semibold text-gray-900">{f.product}</h4>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  f.trend.includes("haussière")
                    ? "bg-green-50 text-green-700"
                    : f.trend.includes("baissière")
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {f.trend}
              </span>
            </div>

            {/* Chart */}
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={f.forecasts} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-${f.product}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} kg`,
                      name === "predicted" ? "Prévision" : name === "upper" ? "Max" : "Min",
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill={`url(#grad-${f.product})`}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#ffffff"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: color }}
                  />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lower"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendation */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              {f.trend.includes("haussière") ? (
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              )}
              <p className="text-sm text-gray-700">{f.recommendation}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
