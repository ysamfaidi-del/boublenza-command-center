"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import V2Card from "./V2Card";
import FilterDropdown from "./FilterDropdown";
import type { V2TrendPoint } from "@/types/v2";

function formatK(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}.0k`;
  return `$${v}`;
}

export default function RevenueTrendChart({ data }: { data: V2TrendPoint[] }) {
  const [interval, setInterval] = useState("daily");
  const [dataMode, setDataMode] = useState("non-cumulative");

  // Aggregate if weekly
  let chartData = data;
  if (interval === "weekly") {
    const weekly: V2TrendPoint[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);
      weekly.push({
        date: chunk[0].date,
        revenue: chunk.reduce((s, d) => s + d.revenue, 0),
        target: chunk.reduce((s, d) => s + d.target, 0),
        lastYear: chunk.reduce((s, d) => s + d.lastYear, 0),
        outlook: chunk.reduce((s, d) => s + d.outlook, 0),
      });
    }
    chartData = weekly;
  }

  // Cumulative
  if (dataMode === "cumulative") {
    let cumRev = 0, cumTgt = 0, cumLy = 0, cumOut = 0;
    chartData = chartData.map((d) => {
      cumRev += d.revenue; cumTgt += d.target; cumLy += d.lastYear; cumOut += d.outlook;
      return { ...d, revenue: cumRev, target: cumTgt, lastYear: cumLy, outlook: cumOut };
    });
  }

  // Find "This week" label position
  const thisWeekIdx = Math.max(0, chartData.length - 7);

  return (
    <V2Card title="Revenue trend">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <FilterDropdown
          label="Dates" value="current-quarter"
          options={[{ label: "Current quarter", value: "current-quarter" }, { label: "Last quarter", value: "last-quarter" }, { label: "YTD", value: "ytd" }]}
        />
        <FilterDropdown
          label="Interval" value={interval}
          options={[{ label: "Daily", value: "daily" }, { label: "Weekly", value: "weekly" }]}
          onChange={setInterval}
        />
        <FilterDropdown
          label="Data" value={dataMode}
          options={[{ label: "Non-cumulative", value: "non-cumulative" }, { label: "Cumulative", value: "cumulative" }]}
          onChange={setDataMode}
        />
        <FilterDropdown
          label="Products" value="all"
          options={[{ label: "All", value: "all" }, { label: "CARUMA", value: "caruma" }, { label: "CARANI", value: "carani" }, { label: "CAROB EXTRACT", value: "extract" }]}
        />
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#80868b" }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
              }}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#80868b" }}
              tickFormatter={formatK}
              width={55}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e8eaed",
                fontSize: 11,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number, name: string) => [formatK(value), name]}
              labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            />

            {/* This week reference */}
            {chartData[thisWeekIdx] && (
              <ReferenceLine
                x={chartData[thisWeekIdx].date}
                stroke="#dadce0"
                strokeDasharray="4 4"
                label={{ value: "This week", position: "top", fontSize: 10, fill: "#80868b" }}
              />
            )}

            {/* Revenue - solid blue */}
            <Line
              type="monotone" dataKey="revenue" stroke="#1a73e8" strokeWidth={2}
              dot={false} name="Revenue"
            />
            {/* Finance outlook - dotted blue */}
            <Line
              type="monotone" dataKey="outlook" stroke="#1a73e8" strokeWidth={1.5}
              strokeDasharray="4 4" dot={false} name="Finance outlook"
            />
            {/* Target - dashed gray */}
            <Line
              type="monotone" dataKey="target" stroke="#dadce0" strokeWidth={1.5}
              strokeDasharray="8 4" dot={false} name="Target"
            />
            {/* Last year - dotted red */}
            <Line
              type="monotone" dataKey="lastYear" stroke="#d93025" strokeWidth={1.5}
              strokeDasharray="3 3" dot={false} name="Last year"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </V2Card>
  );
}
