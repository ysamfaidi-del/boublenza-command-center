"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProductionVsTarget } from "@/types";

interface Props {
  data: ProductionVsTarget[];
}

export default function ProductionChart({ data }: Props) {
  return (
    <div className="card">
      <h3 className="card-header">Production vs Objectif (kg)</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${new Intl.NumberFormat("fr-FR").format(value)} kg`,
                name === "production" ? "Production" : "Objectif",
              ]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend
              formatter={(value: string) =>
                value === "production" ? "Production réelle" : "Objectif"
              }
            />
            <Line
              type="monotone"
              dataKey="production"
              stroke="#3a9348"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3a9348" }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#b07a3b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: "#b07a3b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
