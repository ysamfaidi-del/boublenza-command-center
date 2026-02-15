"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell
} from "recharts";
import V2Card from "@/components/v2/V2Card";
import RevenueSummaryStrip from "@/components/v2/RevenueSummaryStrip";
import RevenueTrendChart from "@/components/v2/RevenueTrendChart";
import TopMoversTable from "@/components/v2/TopMoversTable";
import AskAIBar from "@/components/v2/AskAIBar";
import V2RightSidebar from "@/components/layout/V2RightSidebar";
import type { V2OverviewData } from "@/types/v2";

const PRODUCT_COLORS = ["#1a73e8", "#188038", "#f9ab00"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", confirmed: "Confirmed", in_production: "In Production",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
const PAYMENT_STYLE: Record<string, string> = {
  received: "bg-green-50 text-gcs-green",
  pending: "bg-yellow-50 text-gcs-yellow",
  overdue: "bg-red-50 text-gcs-red",
  partial: "bg-blue-50 text-gcs-blue",
};

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function V2OverviewPage() {
  const [data, setData] = useState<V2OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/overview")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("[V2 Overview] Failed to load data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading overview">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading overview...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Revenue Summary KPI Strip */}
        <RevenueSummaryStrip data={data.revenueSummary} />

        {/* Operational KPIs (from V1 dashboard) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Monthly Revenue", value: fmt(data.kpis.monthlyRevenue), sub: `${data.kpis.monthlyRevenueChange > 0 ? "+" : ""}${data.kpis.monthlyRevenueChange.toFixed(1)}% MoM`, positive: data.kpis.monthlyRevenueChange >= 0 },
            { label: "Production", value: `${data.kpis.totalProduction}t`, sub: `${data.kpis.productionChange > 0 ? "+" : ""}${data.kpis.productionChange.toFixed(1)}%`, positive: data.kpis.productionChange >= 0 },
            { label: "Active Orders", value: String(data.kpis.activeOrders), sub: "in pipeline", positive: true },
            { label: "Capacity Rate", value: `${data.kpis.capacityRate}%`, sub: "utilization", positive: data.kpis.capacityRate >= 70 },
            { label: "Gross Margin", value: `${data.kpis.grossMarginPct}%`, sub: `Cash: ${fmt(data.kpis.cashPosition)}`, positive: data.kpis.grossMarginPct >= 35 },
          ].map((k) => (
            <V2Card key={k.label} menu={false}>
              <div className="px-3 py-2.5">
                <p className="v2-kpi-label">{k.label}</p>
                <p className="v2-kpi-value text-[18px]">{k.value}</p>
                <p className={`v2-kpi-sub ${k.positive ? "text-gcs-green" : "text-gcs-red"}`}>{k.sub}</p>
              </div>
            </V2Card>
          ))}
        </div>

        {/* Revenue Trend Chart */}
        <RevenueTrendChart data={data.revenueTrend} />

        {/* Ask AI Bar */}
        <AskAIBar />

        {/* Top Movers */}
        <TopMoversTable movers={data.topMovers} />

        {/* Charts Row: Production vs Target + Product Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <V2Card title="Production vs Target" subtitle="Monthly output (tons)">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.productionVsTarget}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" fill="#1a73e8" name="Actual" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#dadce0" name="Target" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>

          <V2Card title="Product Sales" subtitle="Revenue by product">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.productSales}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, marginPct }) => `${name} ${marginPct || 0}%`}
                  >
                    {data.productSales.map((_, i) => (
                      <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>

        {/* Top Clients */}
        <V2Card title="Top Clients" subtitle={`${data.topClients.length} key accounts`}>
          <table className="v2-table">
            <thead>
              <tr>
                <th>Client</th><th>Country</th><th>Revenue</th><th>Orders</th><th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.topClients.map((c) => (
                <tr key={c.name}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.country}</td>
                  <td>{fmt(c.revenue)}</td>
                  <td>{c.orders}</td>
                  <td className={c.trend === "up" ? "text-gcs-green" : c.trend === "down" ? "text-gcs-red" : "text-gcs-gray-500"}>
                    {c.trend === "up" ? "↑" : c.trend === "down" ? "↓" : "→"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </V2Card>

        {/* Recent Orders */}
        <V2Card title="Recent Orders" subtitle="Latest transactions">
          <table className="v2-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Client</th><th>Product</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium text-gcs-blue">{o.id}</td>
                  <td>{o.client}</td>
                  <td>{o.product}</td>
                  <td>{fmt(o.amount)}</td>
                  <td>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gcs-gray-50 text-gcs-gray-700">
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${PAYMENT_STYLE[o.paymentStatus] || "bg-gcs-gray-50 text-gcs-gray-500"}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="text-gcs-gray-500">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </V2Card>
      </main>

      {/* Right Sidebar */}
      <V2RightSidebar
        todos={data.todos}
        recentLinks={data.recentLinks}
        anomaliesCount={data.anomaliesCount}
        news={data.news.map((n) => ({ title: n.title, source: n.source }))}
      />
    </div>
  );
}
