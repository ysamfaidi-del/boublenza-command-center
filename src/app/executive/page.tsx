"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Award, Target, AlertTriangle, BarChart3, Wallet, Clock, CreditCard } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ExecutiveSummary, BenchmarkData, ScenarioProjection, YoYMetric } from "@/types/premium";

interface FinancialKPIs {
  ytdBudgetRevenue: number;
  ytdActualRevenue: number;
  budgetAttainment: number;
  cashPosition: number;
  dso: number;
  overdueCount: number;
  overdueAmount: number;
}

interface ExecData { summary: ExecutiveSummary; benchmarks: BenchmarkData[]; scenarios: ScenarioProjection[]; yoy: YoYMetric[]; financial?: FinancialKPIs }

export default function ExecutivePage() {
  const [data, setData] = useState<ExecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/executive").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  const { summary } = data;
  const revGrowth = summary.revenuePrev > 0 ? ((summary.revenue - summary.revenuePrev) / summary.revenuePrev * 100).toFixed(1) : "0";
  const marginDelta = (summary.grossMargin - summary.grossMarginPrev).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Executive Summary Header */}
      <div className="card border-l-4 border-forest-500">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Synthèse exécutive — {summary.period}</h2>
            <p className="mt-1 text-sm text-gray-500">Rapport automatique généré pour le board</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Chiffre d&apos;affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.revenue)}</p>
              <p className={cn("text-xs font-medium", Number(revGrowth) >= 0 ? "text-green-600" : "text-red-600")}>
                {Number(revGrowth) >= 0 ? "+" : ""}{revGrowth}% vs période précédente
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Marge brute</p>
              <p className="text-2xl font-bold text-gray-900">{summary.grossMargin.toFixed(1)}%</p>
              <p className={cn("text-xs font-medium", Number(marginDelta) >= 0 ? "text-green-600" : "text-red-600")}>
                {Number(marginDelta) >= 0 ? "+" : ""}{marginDelta} pts
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <TrendingUp className="h-4 w-4" /> Points forts
            </div>
            <ul className="mt-2 space-y-1">
              {summary.keyHighlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Award className="mt-0.5 h-3 w-3 flex-shrink-0 text-forest-500" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" /> Risques identifiés
            </div>
            <ul className="mt-2 space-y-1">
              {summary.keyRisks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex gap-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <span><strong>Top produit :</strong> {summary.topProduct}</span>
          <span><strong>Top marché :</strong> {summary.topMarket}</span>
        </div>
      </div>

      {/* Financial KPIs */}
      {data.financial && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50">
              <Target className="h-4 w-4 text-forest-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{data.financial.budgetAttainment}%</p>
              <p className="text-xs text-gray-500">Atteinte budget CA</p>
              <p className="text-[10px] text-gray-400">{formatCurrency(data.financial.ytdActualRevenue)} / {formatCurrency(data.financial.ytdBudgetRevenue)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(data.financial.cashPosition)}</p>
              <p className="text-xs text-gray-500">Trésorerie</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{data.financial.dso} <span className="text-sm font-normal text-gray-400">jours</span></p>
              <p className="text-xs text-gray-500">DSO moyen</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <CreditCard className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{data.financial.overdueCount}</p>
              <p className="text-xs text-gray-500">Impayés ({formatCurrency(data.financial.overdueAmount)})</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monte Carlo Scenarios */}
        <div className="card">
          <h3 className="card-header"><Target className="mr-2 inline h-4 w-4" />Projections Monte Carlo — 5 ans</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.scenarios} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a9348" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3a9348" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="p90" stroke="none" fill="url(#bandGrad)" name="P90" />
                <Area type="monotone" dataKey="p10" stroke="none" fill="none" name="P10" />
                <Area type="monotone" dataKey="optimistic" stroke="#3a9348" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Optimiste" />
                <Area type="monotone" dataKey="baseline" stroke="#3a9348" strokeWidth={2.5} fill="none" name="Base" />
                <Area type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Pessimiste" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Benchmarks */}
        <div className="card">
          <h3 className="card-header"><BarChart3 className="mr-2 inline h-4 w-4" />Benchmark industrie</h3>
          <div className="space-y-4">
            {data.benchmarks.map((b) => {
              const maxVal = Math.max(b.boublenza, b.industryAvg, b.topPerformer);
              const isAboveAvg = b.boublenza >= b.industryAvg;
              return (
                <div key={b.metric} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{b.metric}</span>
                    <span className={cn("flex items-center gap-1 font-bold", isAboveAvg ? "text-green-700" : "text-red-700")}>
                      {isAboveAvg ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {b.boublenza}{b.unit}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-[10px] text-gray-400">Boublenza</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className={cn("h-full rounded-full", isAboveAvg ? "bg-forest-500" : "bg-red-400")} style={{ width: `${(b.boublenza / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-[10px] text-gray-400">Moy. secteur</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-gray-400" style={{ width: `${(b.industryAvg / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-[10px] text-gray-400">Top perf.</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-purple-400" style={{ width: `${(b.topPerformer / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      <div className="card">
        <h3 className="card-header">Comparaison année sur année</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yoy} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <YAxis type="category" dataKey="metric" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="previous" name="N-1" fill="#d1d5db" radius={[0, 4, 4, 0]} />
                <Bar dataKey="current" name="Actuel" fill="#3a9348" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.yoy.map((m) => (
              <div key={m.metric} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50/50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.metric}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(m.previous)} → {formatCurrency(m.current)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold", m.changePct >= 0 ? "text-green-700" : "text-red-700")}>
                    {m.changePct >= 0 ? "+" : ""}{m.changePct.toFixed(1)}%
                  </p>
                  <p className={cn("text-xs", m.change >= 0 ? "text-green-600" : "text-red-600")}>
                    {m.change >= 0 ? "+" : ""}{formatCurrency(m.change)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
