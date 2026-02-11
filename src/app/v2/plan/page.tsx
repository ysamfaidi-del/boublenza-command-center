"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Area, Legend, Cell
} from "recharts";

interface MonthlyProd { month: string; actual: number; target: number; capacity: number; }
interface QualityData { grade: string; percentage: number; volume: number; }
interface ShiftData { shift: string; output: number; efficiency: number; defectRate: number; }
interface ForecastPoint { month: string; forecast: number; optimistic: number; pessimistic: number; }

interface PlanData {
  monthly: MonthlyProd[];
  byQuality: QualityData[];
  byShift: ShiftData[];
  totalOutput: number;
  costPerKg: number;
  yieldRate: number;
  qualityRate: number;
  capacityUtil: number;
  forecasts: ForecastPoint[];
}

export default function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ytd");

  useEffect(() => {
    Promise.all([
      fetch("/api/production").then((r) => r.json()),
      fetch("/api/previsions").then((r) => r.json()),
    ])
      .then(([prod, prev]) => {
        const monthly: MonthlyProd[] = (prod.monthly || []).map((m: Record<string, unknown>) => ({
          month: String(m.month || m.name || ""),
          actual: Number(m.actual || m.output || 0),
          target: Number(m.target || m.plan || 0),
          capacity: Number(m.capacity || 0),
        }));
        const byQuality: QualityData[] = (prod.byQuality || []).map((q: Record<string, unknown>) => ({
          grade: String(q.grade || q.name || ""),
          percentage: Number(q.percentage || q.pct || 0),
          volume: Number(q.volume || q.tons || 0),
        }));
        const byShift: ShiftData[] = (prod.byShift || []).map((s: Record<string, unknown>) => ({
          shift: String(s.shift || s.name || ""),
          output: Number(s.output || s.tons || 0),
          efficiency: Number(s.efficiency || 0),
          defectRate: Number(s.defectRate || s.defect || 0),
        }));
        const totalOutput = Number(prod.total || monthly.reduce((s: number, m: MonthlyProd) => s + m.actual, 0));
        const forecasts: ForecastPoint[] = (prev.forecasts || prev.monthly || []).map((f: Record<string, unknown>) => ({
          month: String(f.month || f.name || ""),
          forecast: Number(f.forecast || f.value || 0),
          optimistic: Number(f.optimistic || f.high || 0),
          pessimistic: Number(f.pessimistic || f.low || 0),
        }));
        const cap = monthly.length ? monthly.reduce((s, m) => s + (m.capacity ? m.actual / m.capacity : 0), 0) / monthly.length * 100 : 78;
        setData({
          monthly, byQuality, byShift, totalOutput,
          costPerKg: Number(prod.costPerKg || 1.2),
          yieldRate: Number(prod.yieldRate || 89),
          qualityRate: Number(prod.qualityRate || 96),
          capacityUtil: Math.round(cap),
          forecasts,
        });
      })
      .catch((err) => {
        console.error("[V2 Plan] Failed to load data, using demo fallback:", err);
        setData({
          monthly: [
            { month: "Jan", actual: 42, target: 45, capacity: 60 },
            { month: "Feb", actual: 48, target: 45, capacity: 60 },
            { month: "Mar", actual: 44, target: 50, capacity: 60 },
            { month: "Apr", actual: 51, target: 50, capacity: 60 },
            { month: "May", actual: 47, target: 48, capacity: 60 },
            { month: "Jun", actual: 53, target: 52, capacity: 60 },
          ],
          byQuality: [
            { grade: "Premium A", percentage: 45, volume: 128 },
            { grade: "Standard B", percentage: 35, volume: 100 },
            { grade: "Industrial C", percentage: 15, volume: 43 },
            { grade: "Reject", percentage: 5, volume: 14 },
          ],
          byShift: [
            { shift: "Morning (6h-14h)", output: 120, efficiency: 92, defectRate: 2.1 },
            { shift: "Afternoon (14h-22h)", output: 105, efficiency: 87, defectRate: 3.4 },
            { shift: "Night (22h-6h)", output: 60, efficiency: 78, defectRate: 5.2 },
          ],
          totalOutput: 285,
          costPerKg: 1.18,
          yieldRate: 89,
          qualityRate: 96,
          capacityUtil: 78,
          forecasts: [
            { month: "Jul", forecast: 55, optimistic: 62, pessimistic: 48 },
            { month: "Aug", forecast: 52, optimistic: 60, pessimistic: 45 },
            { month: "Sep", forecast: 58, optimistic: 65, pessimistic: 50 },
            { month: "Oct", forecast: 60, optimistic: 68, pessimistic: 52 },
            { month: "Nov", forecast: 56, optimistic: 64, pessimistic: 48 },
            { month: "Dec", forecast: 50, optimistic: 58, pessimistic: 42 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading plan">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading plan & pitch...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Output", value: `${data.totalOutput}t`, sub: "year to date" },
          { label: "Cost per Kg", value: `$${data.costPerKg.toFixed(2)}`, sub: "avg production cost" },
          { label: "Yield Rate", value: `${data.yieldRate}%`, sub: "raw → finished" },
          { label: "Quality Rate", value: `${data.qualityRate}%`, sub: "grade A+B" },
          { label: "Capacity Utilization", value: `${data.capacityUtil}%`, sub: "of 60t/month max" },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-4 py-3">
              <p className="v2-kpi-label">{k.label}</p>
              <p className="v2-kpi-value">{k.value}</p>
              <p className="v2-kpi-sub">{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2">
        <FilterDropdown
          label="Period:" value={period}
          options={[
            { label: "Year to Date", value: "ytd" },
            { label: "Last 6 months", value: "6m" },
            { label: "Last Quarter", value: "q" },
          ]}
          onChange={setPeriod}
        />
      </div>

      {/* ── Charts Row 1: Production vs Target + Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <V2Card title="Monthly Production vs Target" subtitle="Tons by month">
          <div className="px-4 py-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
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
        <V2Card title="Production Forecast" subtitle="Next 6 months with confidence band">
          <div className="px-4 py-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.forecasts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="optimistic" fill="#e8f0fe" stroke="none" name="Optimistic" />
                <Area dataKey="pessimistic" fill="#fff" stroke="none" name="Pessimistic" />
                <Line dataKey="forecast" stroke="#1a73e8" strokeWidth={2} dot={{ r: 3 }} name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </V2Card>
      </div>

      {/* ── Charts Row 2: Quality + Shift Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <V2Card title="Quality Distribution" subtitle="By grade">
          <div className="px-4 py-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byQuality} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="grade" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {data.byQuality.map((q, i) => (
                    <Cell key={i} fill={q.grade === "Reject" ? "#d93025" : i === 0 ? "#188038" : i === 1 ? "#1a73e8" : "#f9ab00"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </V2Card>
        <V2Card title="Shift Performance" subtitle="Output & efficiency by shift">
          <table className="v2-table">
            <thead>
              <tr><th>Shift</th><th>Output (t)</th><th>Efficiency</th><th>Defect Rate</th></tr>
            </thead>
            <tbody>
              {data.byShift.map((s) => (
                <tr key={s.shift}>
                  <td className="font-medium">{s.shift}</td>
                  <td>{s.output}t</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-14 rounded-full bg-gcs-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${s.efficiency >= 90 ? "bg-gcs-green" : s.efficiency >= 80 ? "bg-gcs-blue" : "bg-gcs-yellow"}`} style={{ width: `${s.efficiency}%` }} />
                      </div>
                      <span className="text-[11px]">{s.efficiency}%</span>
                    </div>
                  </td>
                  <td className={s.defectRate > 4 ? "text-gcs-red" : s.defectRate > 3 ? "text-gcs-yellow" : "text-gcs-green"}>{s.defectRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </V2Card>
      </div>
    </div>
  );
}

