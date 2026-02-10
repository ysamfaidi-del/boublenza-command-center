"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, ComposedChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, Wallet, CreditCard,
  Clock, Receipt, PiggyBank, AlertCircle,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

/* ═══ Types ═══ */

interface MonthlyPnl {
  month: string;
  revenue: number;
  cogs: number;
  grossMargin: number;
  opex: number;
  ebitda: number;
}

interface ProductMargin {
  product: string;
  revenue: number;
  cogs: number;
  margin: number;
  marginPct: number;
  volume: number;
}

interface MonthlyCash {
  month: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface BudgetLine {
  budget: number;
  actual: number;
}

interface BudgetVsActual {
  revenue: BudgetLine;
  cogs: BudgetLine;
  opex: BudgetLine;
}

interface Aging {
  current: number;
  days30: number;
  days60: number;
  days90plus: number;
}

interface Payments {
  received: number;
  pending: number;
  overdue: number;
  partial: number;
  totalPending: number;
  totalOverdue: number;
  totalPartial: number;
}

interface ExpenseItem {
  category: string;
  label: string;
  amount: number;
}

interface FinancialData {
  revenue12m: number;
  grossMarginPct: number;
  ebitda12m: number;
  cashPosition: number;
  dso: number;
  dpo: number;
  bfr: number;
  totalReceivable: number;
  monthlyPnl: MonthlyPnl[];
  productMargins: ProductMargin[];
  monthlyCash: MonthlyCash[];
  budgetVsActual: BudgetVsActual;
  aging: Aging;
  payments: Payments;
  expenseBreakdown: ExpenseItem[];
}

/* ═══ Constants ═══ */

const AGING_COLORS = ["#3a9348", "#eab308", "#f97316", "#ef4444"];
const AGING_LABELS = ["Courant", "30 jours", "60 jours", "90+ jours"];

const EXPENSE_COLORS = [
  "#3a9348", "#b07a3b", "#553424", "#3b82f6",
  "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6",
  "#ec4899", "#6366f1",
];

/* ═══ Component ═══ */

export default function FinancesPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/financials")
      .then((res) => res.json())
      .then((json) => {
        // Flatten kpis into top-level for the component
        const { kpis, ...rest } = json;
        setData({ ...kpis, ...rest });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement des finances...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  /* ─── Derived data ─── */

  const agingData = [
    { name: "Courant", value: data.aging.current },
    { name: "30 jours", value: data.aging.days30 },
    { name: "60 jours", value: data.aging.days60 },
    { name: "90+ jours", value: data.aging.days90plus },
  ];

  const budgetItems: { label: string; key: keyof BudgetVsActual; color: string }[] = [
    { label: "Chiffre d\u2019affaires", key: "revenue", color: "bg-forest-500" },
    { label: "Co\u00fbt des ventes", key: "cogs", color: "bg-red-500" },
    { label: "Charges op\u00e9rationnelles", key: "opex", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">
      {/* ═══ 1. KPI Cards ═══ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* CA 12 mois */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50">
            <DollarSign className="h-4 w-4 text-forest-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(data.revenue12m)}</p>
            <p className="text-xs text-gray-500">CA 12 mois</p>
          </div>
        </div>

        {/* Marge brute % */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{data.grossMarginPct.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Marge brute</p>
          </div>
        </div>

        {/* EBITDA 12 mois */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(data.ebitda12m)}</p>
            <p className="text-xs text-gray-500">EBITDA 12 mois</p>
          </div>
        </div>

        {/* Tr&eacute;sorerie */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(data.cashPosition)}</p>
            <p className="text-xs text-gray-500">Tr&eacute;sorerie</p>
          </div>
        </div>

        {/* DSO */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{data.dso} <span className="text-sm font-normal text-gray-400">jours</span></p>
            <p className="text-xs text-gray-500">DSO</p>
          </div>
        </div>

        {/* DPO */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Receipt className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{data.dpo} <span className="text-sm font-normal text-gray-400">jours</span></p>
            <p className="text-xs text-gray-500">DPO</p>
          </div>
        </div>

        {/* BFR */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-carob-50">
            <CreditCard className="h-4 w-4 text-carob-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(data.bfr)}</p>
            <p className="text-xs text-gray-500">BFR</p>
          </div>
        </div>

        {/* Cr&eacute;ances totales */}
        <div className="card flex items-center gap-3 !p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(data.totalReceivable)}</p>
            <p className="text-xs text-gray-500">Cr&eacute;ances totales</p>
          </div>
        </div>
      </div>

      {/* ═══ 2 & 3. P&L mensuel + Marge par produit ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* P&L mensuel */}
        <div className="card">
          <h3 className="card-header">P&amp;L mensuel</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyPnl} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      revenue: "Revenus",
                      cogs: "COGS",
                      opex: "OPEX",
                      ebitda: "EBITDA",
                    };
                    return [formatCurrency(Math.abs(value)), labels[name] || name];
                  }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend
                  formatter={(v: string) => {
                    const labels: Record<string, string> = {
                      revenue: "Revenus",
                      cogs: "COGS",
                      opex: "OPEX",
                      ebitda: "EBITDA",
                    };
                    return labels[v] || v;
                  }}
                />
                <Bar dataKey="revenue" name="revenue" fill="#3a9348" radius={[4, 4, 0, 0]} stackId="pnl" />
                <Bar dataKey="cogs" name="cogs" fill="#ef4444" stackId="pnl" />
                <Bar dataKey="opex" name="opex" fill="#f97316" stackId="pnl" />
                <Line type="monotone" dataKey="ebitda" name="ebitda" stroke="#553424" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marge par produit */}
        <div className="card">
          <h3 className="card-header">Marge par produit</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.productMargins}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: "#6b7280" }} width={110} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "margin" ? "Marge" : name === "revenue" ? "CA" : name,
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend formatter={(v: string) => (v === "margin" ? "Marge" : v === "revenue" ? "CA" : v)} />
                <Bar dataKey="revenue" name="revenue" fill="#3a9348" radius={[0, 4, 4, 0]} opacity={0.3} />
                <Bar dataKey="margin" name="margin" fill="#3a9348" radius={[0, 4, 4, 0]} label={({ x, y, width, height, value, index }: { x: number; y: number; width: number; height: number; value: number; index: number }) => (
                  <text
                    x={x + width + 4}
                    y={y + height / 2}
                    fill="#6b7280"
                    fontSize={10}
                    dominantBaseline="middle"
                  >
                    {data.productMargins[index]?.marginPct.toFixed(1)}%
                  </text>
                )} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ 4 & 5. Cash Flow + Budget vs R&eacute;el ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash Flow */}
        <div className="card">
          <h3 className="card-header">Cash Flow</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyCash} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a9348" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3a9348" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      inflow: "Entr\u00e9es",
                      outflow: "Sorties",
                      balance: "Solde",
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend
                  formatter={(v: string) => {
                    const labels: Record<string, string> = {
                      inflow: "Entr\u00e9es",
                      outflow: "Sorties",
                      balance: "Solde",
                    };
                    return labels[v] || v;
                  }}
                />
                <Bar dataKey="inflow" name="inflow" fill="#3a9348" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar dataKey="outflow" name="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Area type="monotone" dataKey="balance" name="balance" stroke="#3a9348" strokeWidth={2} fill="url(#balanceGrad)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs R&eacute;el */}
        <div className="card">
          <h3 className="card-header">Budget vs R&eacute;el</h3>
          <div className="space-y-6 pt-2">
            {budgetItems.map(({ label, key, color }) => {
              const line = data.budgetVsActual[key];
              const pct = line.budget > 0 ? Math.round((line.actual / line.budget) * 100) : 0;
              const capped = Math.min(pct, 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{label}</span>
                    <span className={cn("font-bold", pct > 100 ? "text-red-600" : "text-gray-700")}>{pct}%</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn("h-full rounded-full transition-all", color)}
                      style={{ width: `${capped}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>R&eacute;el : {formatCurrency(line.actual)}</span>
                    <span>Budget : {formatCurrency(line.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 6 & 7. Aging Report + Statut des paiements ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Aging Report */}
        <div className="card">
          <h3 className="card-header">Aging Report &mdash; Cr&eacute;ances</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {agingData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AGING_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(_: any, entry: any) => entry.payload?.name || ""}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {agingData.map((item, i) => (
              <div key={item.name}>
                <div className="h-2 rounded-full" style={{ backgroundColor: AGING_COLORS[i] }} />
                <p className="mt-1 text-xs font-medium text-gray-700">{AGING_LABELS[i]}</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statut des paiements */}
        <div className="card">
          <h3 className="card-header">Statut des paiements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-green-700">Re&ccedil;us</p>
              <p className="mt-2 text-3xl font-bold text-green-800">{data.payments.received}</p>
            </div>
            <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-yellow-700">En attente</p>
              <p className="mt-2 text-3xl font-bold text-yellow-800">{data.payments.pending}</p>
              <p className="mt-1 text-xs text-yellow-600">{formatCurrency(data.payments.totalPending)}</p>
            </div>
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-red-700">En retard</p>
              <p className="mt-2 text-3xl font-bold text-red-800">{data.payments.overdue}</p>
              <p className="mt-1 text-xs text-red-600">{formatCurrency(data.payments.totalOverdue)}</p>
            </div>
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-orange-700">Partiels</p>
              <p className="mt-2 text-3xl font-bold text-orange-800">{data.payments.partial}</p>
              <p className="mt-1 text-xs text-orange-600">{formatCurrency(data.payments.totalPartial)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 8. Ventilation des charges ═══ */}
      <div className="card">
        <h3 className="card-header">Ventilation des charges</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  dataKey="amount"
                  nameKey="label"
                  label={({ label, percent }: { label: string; percent: number }) =>
                    `${label} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.expenseBreakdown.map((_, index) => (
                    <Cell key={`exp-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2">
            {data.expenseBreakdown.map((item, i) => {
              const total = data.expenseBreakdown.reduce((s, e) => s + e.amount, 0);
              const share = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
              return (
                <div key={item.category} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                    <span className="ml-2 text-xs text-gray-500">{share}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
