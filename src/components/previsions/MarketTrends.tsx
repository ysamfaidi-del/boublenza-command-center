"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Globe, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { MarketTrend } from "@/types";

interface TrendsData {
  trends: MarketTrend[];
  comparison: { metric: string; cacao: string; caroube: string }[];
}

export default function MarketTrends() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/trends")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card flex h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Sector demand chart */}
      <div className="card">
        <h3 className="card-header">
          <Globe className="mr-2 inline h-5 w-5 text-blue-600" />
          Demande mondiale de caroube par secteur
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sector" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${formatNumber(value)} t`,
                  name === "volume" ? "Volume" : "Croissance",
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend formatter={(v) => (v === "volume" ? "Volume (tonnes)" : "Croissance %")} />
              <Bar dataKey="volume" fill="#3a9348" radius={[4, 4, 0, 0]} />
              <Bar dataKey="growth" fill="#b07a3b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cacao vs Caroube comparison */}
      <div className="card">
        <h3 className="card-header">Caroube vs Cacao — Argument commercial</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left font-medium text-gray-500">Critère</th>
                <th className="pb-3 text-center font-medium text-gray-500">Cacao</th>
                <th className="pb-3 text-center font-medium text-forest-600">Caroube</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.comparison.map((row) => (
                <tr key={row.metric} className="hover:bg-gray-50/50">
                  <td className="py-3 font-medium text-gray-900">{row.metric}</td>
                  <td className="py-3 text-center text-gray-600">{row.cacao}</td>
                  <td className="py-3 text-center font-medium text-forest-700">{row.caroube}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
