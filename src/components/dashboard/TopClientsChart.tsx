"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopClient } from "@/types";

interface Props {
  data: TopClient[];
}

export default function TopClientsChart({ data }: Props) {
  const chartData = data.map((c) => ({
    name: c.name.length > 18 ? c.name.substring(0, 18) + "..." : c.name,
    revenue: c.revenue,
    country: c.country,
  }));

  return (
    <div className="card">
      <h3 className="card-header">Top 5 clients</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={130}
            />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value),
                "CA",
              ]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="revenue" fill="#553424" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
