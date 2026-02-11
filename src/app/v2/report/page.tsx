"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, ComposedChart
} from "recharts";

interface MonthlyPnL { month: string; revenue: number; cogs: number; opex: number; netProfit: number; }
interface ProductMargin { product: string; revenue: number; cost: number; margin: number; marginPct: number; }
interface CashPoint { month: string; inflow: number; outflow: number; balance: number; }
interface BudgetItem { category: string; budget: number; actual: number; variance: number; }
interface ExpenseItem { category: string; amount: number; percentage: number; }
interface Scenario { name: string; revenue: number; profit: number; probability: number; }

interface ReportData {
  monthlyPnl: MonthlyPnL[];
  productMargins: ProductMargin[];
  cashFlow: CashPoint[];
  budgetVsActual: BudgetItem[];
  expenses: ExpenseItem[];
  scenarios: Scenario[];
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  cashBalance: number;
  burnRate: number;
  runway: number;
}

const COLORS = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#ab47bc", "#00acc1"];

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pnl" | "cash" | "executive">("pnl");
  const [period, setPeriod] = useState("ytd");

  useEffect(() => {
    Promise.all([
      fetch("/api/financials").then((r) => r.json()),
      fetch("/api/executive").then((r) => r.json()),
    ])
      .then(([fin, exec]) => {
        const monthlyPnl: MonthlyPnL[] = (fin.monthlyPnl || []).map((m: Record<string, unknown>) => ({
          month: String(m.month || m.name || ""),
          revenue: Number(m.revenue || 0),
          cogs: Number(m.cogs || 0),
          opex: Number(m.opex || 0),
          netProfit: Number(m.netProfit || m.profit || 0),
        }));
        const productMargins: ProductMargin[] = (fin.productMargins || []).map((p: Record<string, unknown>) => ({
          product: String(p.product || p.name || ""),
          revenue: Number(p.revenue || 0),
          cost: Number(p.cost || 0),
          margin: Number(p.margin || 0),
          marginPct: Number(p.marginPct || p.pct || 0),
        }));
        const cashFlow: CashPoint[] = (fin.monthlyCash || []).map((c: Record<string, unknown>) => ({
          month: String(c.month || c.name || ""),
          inflow: Number(c.inflow || c.income || 0),
          outflow: Number(c.outflow || c.expense || 0),
          balance: Number(c.balance || 0),
        }));
        const budgetVsActual: BudgetItem[] = (fin.budgetVsActual || []).map((b: Record<string, unknown>) => ({
          category: String(b.category || b.name || ""),
          budget: Number(b.budget || 0),
          actual: Number(b.actual || 0),
          variance: Number(b.variance || (Number(b.actual || 0) - Number(b.budget || 0))),
        }));
        const expenses: ExpenseItem[] = (fin.expenseBreakdown || []).map((e: Record<string, unknown>) => ({
          category: String(e.category || e.name || ""),
          amount: Number(e.amount || e.value || 0),
          percentage: Number(e.percentage || e.pct || 0),
        }));
        const scenarios: Scenario[] = (exec.scenarios || []).map((s: Record<string, unknown>) => ({
          name: String(s.name || ""),
          revenue: Number(s.revenue || 0),
          profit: Number(s.profit || 0),
          probability: Number(s.probability || s.prob || 0),
        }));
        const totalRevenue = monthlyPnl.reduce((s, m) => s + m.revenue, 0);
        const totalProfit = monthlyPnl.reduce((s, m) => s + m.netProfit, 0);
        const lastCash = cashFlow.length ? cashFlow[cashFlow.length - 1].balance : 0;
        const avgOutflow = cashFlow.length ? cashFlow.reduce((s, c) => s + c.outflow, 0) / cashFlow.length : 1;

        setData({
          monthlyPnl, productMargins, cashFlow, budgetVsActual, expenses, scenarios,
          totalRevenue, totalProfit,
          profitMargin: totalRevenue ? Math.round(totalProfit / totalRevenue * 100) : 0,
          cashBalance: lastCash,
          burnRate: Math.round(avgOutflow),
          runway: avgOutflow > 0 ? Math.round(lastCash / avgOutflow) : 99,
        });
      })
      .catch((err) => {
        console.error("[V2 Report] Failed to load data, using demo fallback:", err);
        setData({
          monthlyPnl: [
            { month: "Jan", revenue: 245000, cogs: 142000, opex: 48000, netProfit: 55000 },
            { month: "Feb", revenue: 268000, cogs: 148000, opex: 51000, netProfit: 69000 },
            { month: "Mar", revenue: 232000, cogs: 138000, opex: 47000, netProfit: 47000 },
            { month: "Apr", revenue: 290000, cogs: 155000, opex: 52000, netProfit: 83000 },
            { month: "May", revenue: 275000, cogs: 150000, opex: 50000, netProfit: 75000 },
            { month: "Jun", revenue: 310000, cogs: 162000, opex: 55000, netProfit: 93000 },
          ],
          productMargins: [
            { product: "CARUMA", revenue: 720000, cost: 360000, margin: 360000, marginPct: 50 },
            { product: "CARANI", revenue: 420000, cost: 252000, margin: 168000, marginPct: 40 },
            { product: "CAROB EXTRACT", revenue: 480000, cost: 192000, margin: 288000, marginPct: 60 },
          ],
          cashFlow: [
            { month: "Jan", inflow: 220000, outflow: 190000, balance: 430000 },
            { month: "Feb", inflow: 250000, outflow: 195000, balance: 485000 },
            { month: "Mar", inflow: 210000, outflow: 200000, balance: 495000 },
            { month: "Apr", inflow: 280000, outflow: 210000, balance: 565000 },
            { month: "May", inflow: 260000, outflow: 205000, balance: 620000 },
            { month: "Jun", inflow: 300000, outflow: 215000, balance: 705000 },
          ],
          budgetVsActual: [
            { category: "Revenue", budget: 1500000, actual: 1620000, variance: 120000 },
            { category: "COGS", budget: 900000, actual: 895000, variance: -5000 },
            { category: "OpEx", budget: 310000, actual: 303000, variance: -7000 },
            { category: "Net Profit", budget: 290000, actual: 422000, variance: 132000 },
          ],
          expenses: [
            { category: "Raw Materials", amount: 520000, percentage: 38 },
            { category: "Labor", amount: 280000, percentage: 20 },
            { category: "Energy", amount: 165000, percentage: 12 },
            { category: "Logistics", amount: 140000, percentage: 10 },
            { category: "Marketing", amount: 110000, percentage: 8 },
            { category: "Admin & Other", amount: 165000, percentage: 12 },
          ],
          scenarios: [
            { name: "Bear Case", revenue: 1400000, profit: 280000, probability: 20 },
            { name: "Base Case", revenue: 1620000, profit: 422000, probability: 55 },
            { name: "Bull Case", revenue: 1900000, profit: 620000, probability: 25 },
          ],
          totalRevenue: 1620000,
          totalProfit: 422000,
          profitMargin: 26,
          cashBalance: 705000,
          burnRate: 202500,
          runway: 3,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading report">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Revenue", value: fmt(data.totalRevenue), sub: "YTD" },
          { label: "Net Profit", value: fmt(data.totalProfit), sub: `${data.profitMargin}% margin` },
          { label: "Cash Balance", value: fmt(data.cashBalance), sub: "current" },
          { label: "Monthly Burn", value: fmt(data.burnRate), sub: "avg outflow" },
          { label: "Runway", value: `${data.runway} mo`, sub: "at current rate" },
          { label: "Budget Var.", value: data.budgetVsActual[3] ? `+${fmt(data.budgetVsActual[3].variance)}` : "—", sub: "profit vs budget" },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-3 py-2.5">
              <p className="v2-kpi-label">{k.label}</p>
              <p className="v2-kpi-value text-[18px]">{k.value}</p>
              <p className="v2-kpi-sub">{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200">
        {(["pnl", "cash", "executive"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize ${tab === t ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t === "pnl" ? "P&L" : t === "cash" ? "Cash Flow" : "Executive"}
          </button>
        ))}
        <div className="ml-auto">
          <FilterDropdown label="Period:" value={period} options={[
            { label: "Year to Date", value: "ytd" },
            { label: "Last Quarter", value: "q" },
            { label: "Last 12 months", value: "12m" },
          ]} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Tab: P&L ── */}
      {tab === "pnl" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <V2Card title="Monthly P&L" subtitle="Revenue, COGS, OpEx, Net Profit">
                <div className="px-4 py-2 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.monthlyPnl}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" fill="#1a73e8" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cogs" fill="#dadce0" name="COGS" radius={[4, 4, 0, 0]} />
                      <Line dataKey="netProfit" stroke="#188038" strokeWidth={2} name="Net Profit" dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </V2Card>
            </div>
            <V2Card title="Expense Breakdown">
              <div className="px-4 py-2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.expenses} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${percentage}%`}>
                      {data.expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </V2Card>
          </div>
          <V2Card title="Product Margins">
            <table className="v2-table">
              <thead><tr><th>Product</th><th>Revenue</th><th>Cost</th><th>Margin</th><th>Margin %</th></tr></thead>
              <tbody>
                {data.productMargins.map((p) => (
                  <tr key={p.product}>
                    <td className="font-medium">{p.product}</td>
                    <td>{fmt(p.revenue)}</td>
                    <td>{fmt(p.cost)}</td>
                    <td className="text-gcs-green font-medium">{fmt(p.margin)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gcs-green" style={{ width: `${p.marginPct}%` }} />
                        </div>
                        <span className="text-[11px]">{p.marginPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Cash Flow ── */}
      {tab === "cash" && (
        <div className="space-y-4">
          <V2Card title="Monthly Cash Flow" subtitle="Inflows, outflows, and running balance">
            <div className="px-4 py-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="inflow" fill="#188038" name="Inflow" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" fill="#d93025" name="Outflow" radius={[4, 4, 0, 0]} />
                  <Line dataKey="balance" stroke="#1a73e8" strokeWidth={2} name="Balance" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
          <V2Card title="Budget vs Actual">
            <table className="v2-table">
              <thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Status</th></tr></thead>
              <tbody>
                {data.budgetVsActual.map((b) => (
                  <tr key={b.category}>
                    <td className="font-medium">{b.category}</td>
                    <td>{fmt(b.budget)}</td>
                    <td>{fmt(b.actual)}</td>
                    <td className={b.variance >= 0 ? "text-gcs-green" : "text-gcs-red"}>
                      {b.variance >= 0 ? "+" : ""}{fmt(b.variance)}
                    </td>
                    <td>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        b.category === "Revenue" && b.variance >= 0 ? "bg-green-50 text-gcs-green" :
                        b.category !== "Revenue" && b.variance <= 0 ? "bg-green-50 text-gcs-green" :
                        "bg-red-50 text-gcs-red"
                      }`}>
                        {(b.category === "Revenue" && b.variance >= 0) || (b.category !== "Revenue" && b.variance <= 0) ? "On Track" : "Over Budget"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Executive ── */}
      {tab === "executive" && (
        <div className="space-y-4">
          <V2Card title="Scenario Analysis" subtitle="Revenue & profit projections">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="#1a73e8" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#188038" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
          <V2Card title="Scenario Details">
            <table className="v2-table">
              <thead><tr><th>Scenario</th><th>Revenue</th><th>Profit</th><th>Probability</th><th>Weighted Value</th></tr></thead>
              <tbody>
                {data.scenarios.map((s) => (
                  <tr key={s.name}>
                    <td className="font-medium">{s.name}</td>
                    <td>{fmt(s.revenue)}</td>
                    <td>{fmt(s.profit)}</td>
                    <td>{s.probability}%</td>
                    <td className="text-gcs-blue font-medium">{fmt(s.revenue * s.probability / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}
    </div>
  );
}
