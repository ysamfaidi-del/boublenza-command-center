"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Factory, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatNumber, formatTonnes, PRODUCT_COLORS } from "@/lib/utils";
import type { ProductionData } from "@/types";

const QUALITY_COLORS = ["#3a9348", "#b07a3b", "#d97706", "#dc2626"];

export default function ProductionPage() {
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/production")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement de la production...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.totalChange >= 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50">
              <Factory className="h-5 w-5 text-forest-600" />
            </div>
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{data.totalChange}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatTonnes(data.total)}</p>
            <p className="mt-1 text-sm text-gray-500">Production du mois en cours</p>
          </div>
        </div>

        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-carob-50">
            <Factory className="h-5 w-5 text-carob-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="mt-1 text-sm text-gray-500">Lignes de produits actives</p>
          </div>
          <div className="mt-3 flex gap-2">
            {Object.entries(PRODUCT_COLORS).map(([name, color]) => (
              <span key={name} className="badge bg-gray-100 text-gray-700 text-xs">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart — Monthly Production */}
      <div className="card">
        <h3 className="card-header">Production mensuelle par produit (kg)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [`${formatNumber(value)} kg`, name]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Bar dataKey="CARUMA" stackId="a" fill={PRODUCT_COLORS.CARUMA} radius={[0, 0, 0, 0]} />
              <Bar dataKey="CARANI" stackId="a" fill={PRODUCT_COLORS.CARANI} />
              <Bar dataKey="CAROB EXTRACT" stackId="a" fill={PRODUCT_COLORS["CAROB EXTRACT"]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two smaller charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quality Distribution */}
        <div className="card">
          <h3 className="card-header">Répartition par qualité</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byQuality}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="quality"
                  label={({ quality, percent }: { quality: string; percent: number }) =>
                    `${quality} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {data.byQuality.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Shift */}
        <div className="card">
          <h3 className="card-header">Production par équipe (kg)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byShift} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="shift" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`${formatNumber(value)} kg`, "Production"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="quantity" fill="#3a9348" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
