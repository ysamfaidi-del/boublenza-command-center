"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { DollarSign, ShoppingCart, Globe } from "lucide-react";
import { cn, formatCurrency, formatNumber, STATUS_LABELS, PRODUCT_COLORS } from "@/lib/utils";
import type { SalesData } from "@/types";

const PIPELINE_COLORS: Record<string, string> = {
  draft: "bg-gray-100 border-gray-300 text-gray-700",
  confirmed: "bg-blue-50 border-blue-400 text-blue-800",
  in_production: "bg-yellow-50 border-yellow-400 text-yellow-800",
  shipped: "bg-purple-50 border-purple-400 text-purple-800",
  delivered: "bg-green-50 border-green-400 text-green-800",
  cancelled: "bg-red-50 border-red-300 text-red-700",
};

export default function VentesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ventes")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalRevenue = data.monthly.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = data.monthly.reduce((sum, m) => sum + m.orders, 0);
  const topCountry = data.byCountry[0]?.country || "—";

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50">
            <DollarSign className="h-5 w-5 text-forest-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-sm text-gray-500">CA total (12 mois)</p>
          </div>
        </div>
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-carob-50">
            <ShoppingCart className="h-5 w-5 text-carob-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="mt-1 text-sm text-gray-500">Commandes (12 mois)</p>
          </div>
        </div>
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{topCountry}</p>
            <p className="mt-1 text-sm text-gray-500">Premier marché export</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue + Orders */}
      <div className="card">
        <h3 className="card-header">Évolution mensuelle CA & Commandes</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthly} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value) : `${value} cmd`,
                  name === "revenue" ? "CA" : "Commandes",
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend formatter={(v) => (v === "revenue" ? "Chiffre d'affaires" : "Commandes")} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3a9348" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#b07a3b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Country */}
      <div className="card">
        <h3 className="card-header">Chiffre d&apos;affaires par pays</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.byCountry}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: "#6b7280" }} width={100} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "CA"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="revenue" fill="#3a9348" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card">
        <h3 className="card-header">Pipeline commercial</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {data.pipeline.map((p) => (
            <div
              key={p.status}
              className={cn("rounded-xl border-2 p-4 text-center", PIPELINE_COLORS[p.status] || "bg-gray-50")}
            >
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                {STATUS_LABELS[p.status] || p.status}
              </p>
              <p className="mt-2 text-2xl font-bold">{p.count}</p>
              <p className="mt-1 text-xs opacity-70">{formatCurrency(p.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Product Table */}
      <div className="card">
        <h3 className="card-header">Ventes par produit</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left font-medium text-gray-500">Produit</th>
              <th className="pb-3 text-right font-medium text-gray-500">Quantité</th>
              <th className="pb-3 text-right font-medium text-gray-500">Chiffre d&apos;affaires</th>
              <th className="pb-3 text-right font-medium text-gray-500">Part</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.byProduct.map((p) => {
              const totalProdRevenue = data.byProduct.reduce((s, x) => s + x.revenue, 0);
              const share = totalProdRevenue > 0 ? ((p.revenue / totalProdRevenue) * 100).toFixed(1) : "0";
              return (
                <tr key={p.name} className="hover:bg-gray-50/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PRODUCT_COLORS[p.name] || "#888" }}
                      />
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-gray-700">{formatNumber(p.quantity)} kg</td>
                  <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(p.revenue)}</td>
                  <td className="py-3 text-right text-gray-500">{share}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
