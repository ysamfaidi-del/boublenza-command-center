"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { cn, formatNumber, formatDate, PRODUCT_COLORS } from "@/lib/utils";
import type { StockData } from "@/types";

export default function StocksPage() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stocks")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement des stocks...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusConfig = {
    ok: { label: "Normal", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle },
    warning: { label: "Attention", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", icon: AlertTriangle },
    critical: { label: "Critique", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  };

  return (
    <div className="space-y-8">
      {/* Current Stock Levels */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {data.current.map((item) => {
          const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.ok;
          const Icon = config.icon;
          const percentage = Math.round((item.quantity / (item.minThreshold * 3)) * 100);

          return (
            <div key={item.product} className={cn("card border", config.bg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: PRODUCT_COLORS[item.product] || "#888" }}
                  />
                  <h3 className="font-semibold text-gray-900">{item.product}</h3>
                </div>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(item.quantity)} <span className="text-sm font-normal text-gray-500">kg</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Seuil minimum : {formatNumber(item.minThreshold)} kg
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      item.status === "critical"
                        ? "bg-red-500"
                        : item.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>0</span>
                  <span>{formatNumber(item.minThreshold * 3)} kg</span>
                </div>
              </div>

              <div className="mt-2">
                <span className={cn("badge", config.bg, config.color)}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Trends */}
      <div className="card">
        <h3 className="card-header">Évolution des stocks (12 mois)</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${formatNumber(value)} kg`,
                  name,
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="CARUMA"
                stackId="1"
                stroke={PRODUCT_COLORS.CARUMA}
                fill={PRODUCT_COLORS.CARUMA}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="CARANI"
                stackId="1"
                stroke={PRODUCT_COLORS.CARANI}
                fill={PRODUCT_COLORS.CARANI}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="CAROB EXTRACT"
                stackId="1"
                stroke={PRODUCT_COLORS["CAROB EXTRACT"]}
                fill={PRODUCT_COLORS["CAROB EXTRACT"]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="card">
        <h3 className="card-header">Derniers mouvements de stock</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left font-medium text-gray-500">Date</th>
                <th className="pb-3 text-left font-medium text-gray-500">Produit</th>
                <th className="pb-3 text-left font-medium text-gray-500">Type</th>
                <th className="pb-3 text-right font-medium text-gray-500">Quantité</th>
                <th className="pb-3 text-left font-medium text-gray-500">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.movements.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 text-gray-500">{formatDate(m.date)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PRODUCT_COLORS[m.product] || "#888" }}
                      />
                      <span className="font-medium text-gray-900">{m.product}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "badge",
                        m.type === "in"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {m.type === "in" ? "Entrée" : "Sortie"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {m.type === "in" ? "+" : "-"}{formatNumber(m.quantity)} kg
                  </td>
                  <td className="py-3 text-gray-500 capitalize">
                    {m.reason === "production" ? "Production" : m.reason === "sale" ? "Vente" : m.reason}
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
