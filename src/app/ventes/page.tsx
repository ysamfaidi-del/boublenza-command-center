"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from "recharts";
import {
  DollarSign, ShoppingCart, Globe, Users, TrendingUp,
  Target, Building2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, STATUS_LABELS, PRODUCT_COLORS } from "@/lib/utils";
import type { SalesData, Reseller } from "@/types";

const PIPELINE_COLORS: Record<string, string> = {
  draft: "bg-gray-100 border-gray-300 text-gray-700",
  confirmed: "bg-blue-50 border-blue-400 text-blue-800",
  in_production: "bg-yellow-50 border-yellow-400 text-yellow-800",
  shipped: "bg-purple-50 border-purple-400 text-purple-800",
  delivered: "bg-green-50 border-green-400 text-green-800",
  cancelled: "bg-red-50 border-red-300 text-red-700",
};

const RESELLER_COLORS = ["#3a9348", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

const STATUS_BADGE: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  onboarding: "bg-blue-100 text-blue-800",
  inactif: "bg-gray-100 text-gray-600",
};

const TYPE_BADGE: Record<string, string> = {
  distributeur: "bg-purple-50 text-purple-700",
  grossiste: "bg-amber-50 text-amber-700",
  agent: "bg-sky-50 text-sky-700",
};

export default function VentesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ventes")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalRevenue = data.monthly.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = data.monthly.reduce((sum, m) => sum + m.orders, 0);
  const topCountry = data.byCountry[0]?.country || "—";

  // Reseller KPIs
  const resellers = data.resellers || [];
  const activeResellers = resellers.filter((r) => r.status === "actif").length;
  const totalResellerRevenue = resellers.reduce((s, r) => s + r.totalRevenue, 0);
  const avgOrderValue = resellers.length > 0
    ? Math.round(resellers.reduce((s, r) => s + r.avgOrderValue, 0) / resellers.length)
    : 0;
  const avgGrowth = resellers.filter((r) => r.growthRate > 0).length > 0
    ? resellers.filter((r) => r.growthRate > 0).reduce((s, r) => s + r.growthRate, 0) / resellers.filter((r) => r.growthRate > 0).length
    : 0;

  // Monthly comparison chart data
  const resellerMonthlyData = resellers.length > 0
    ? resellers[0].monthlyRevenue.map((m, idx) => {
        const point: Record<string, string | number> = { month: m.month };
        resellers.forEach((r) => {
          point[r.name] = r.monthlyRevenue[idx]?.revenue || 0;
        });
        return point;
      })
    : [];

  return (
    <div className="space-y-8">
      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50">
            <DollarSign className="h-5 w-5 text-forest-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-sm text-gray-500">CA total (12 mois)</p>
          </div>
        </div>
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-carob-50">
            <ShoppingCart className="h-5 w-5 text-carob-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="mt-1 text-sm text-gray-500">Commandes (12 mois)</p>
          </div>
        </div>
        <div className="card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{topCountry}</p>
            <p className="mt-1 text-sm text-gray-500">Premier march&eacute; export</p>
          </div>
        </div>
      </div>

      {/* ═══ Section A : KPI Revendeurs ═══ */}
      {resellers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{activeResellers}<span className="text-sm font-normal text-gray-400">/{resellers.length}</span></p>
              <p className="text-xs text-gray-500">Revendeurs actifs</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50">
              <Building2 className="h-4 w-4 text-forest-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalResellerRevenue)}</p>
              <p className="text-xs text-gray-500">CA revendeurs</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
              <p className="text-xs text-gray-500">Panier moyen</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 !p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">+{avgGrowth.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Croissance moy.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Monthly Revenue + Orders ═══ */}
      <div className="card">
        <h3 className="card-header">&Eacute;volution mensuelle CA &amp; Commandes</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthly} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value) : `${value} cmd`,
                  name === "revenue" ? "CA" : "Commandes",
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend formatter={(v) => (v === "revenue" ? "Chiffre d'affaires" : "Commandes")} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3a9348" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#b07a3b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Section B : Tableau de bord revendeurs ═══ */}
      {resellers.length > 0 && (
        <div className="card">
          <h3 className="card-header">
            <Users className="mr-2 inline h-4 w-4" />
            Suivi des revendeurs &amp; distributeurs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="pb-3 text-left">Revendeur</th>
                  <th className="pb-3 text-left">Pays</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-center">Statut</th>
                  <th className="pb-3 text-right">CA cumul&eacute;</th>
                  <th className="pb-3 text-right">Commandes</th>
                  <th className="pb-3 text-right">Croissance</th>
                  <th className="pb-3 text-center">Paiement</th>
                  <th className="pb-3 text-left" style={{ minWidth: 160 }}>Objectif annuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resellers.map((r: Reseller, idx: number) => {
                  const progress = Math.min(100, Math.round((r.totalRevenue / r.target) * 100));
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RESELLER_COLORS[idx] }} />
                          <span className="font-medium text-gray-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{r.country}</td>
                      <td className="py-3 text-center">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", TYPE_BADGE[r.type] || "bg-gray-50 text-gray-600")}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600")}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(r.totalRevenue)}</td>
                      <td className="py-3 text-right text-gray-700">{r.totalOrders}</td>
                      <td className="py-3 text-right">
                        {r.growthRate > 0 ? (
                          <span className="inline-flex items-center text-xs font-semibold text-green-600">
                            <ArrowUpRight className="mr-0.5 h-3 w-3" />
                            +{r.growthRate.toFixed(1)}%
                          </span>
                        ) : r.growthRate < 0 ? (
                          <span className="inline-flex items-center text-xs font-semibold text-red-600">
                            <ArrowDownRight className="mr-0.5 h-3 w-3" />
                            {r.growthRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Nouveau</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "text-xs font-bold",
                          r.paymentScore >= 80 ? "text-green-600" : r.paymentScore >= 60 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {r.paymentScore}/100
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                progress >= 80 ? "bg-green-500" : progress >= 50 ? "bg-amber-400" : "bg-blue-400"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-gray-500">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Section C : Graphique comparatif CA mensuel par revendeur ═══ */}
      {resellers.length > 0 && (
        <div className="card">
          <h3 className="card-header">
            <TrendingUp className="mr-2 inline h-4 w-4" />
            CA mensuel par revendeur
          </h3>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resellerMonthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "CA"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend />
                {resellers.map((r, idx) => (
                  <Line
                    key={r.id}
                    type="monotone"
                    dataKey={r.name}
                    stroke={RESELLER_COLORS[idx]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ Section D : Produits par revendeur ═══ */}
      {resellers.length > 0 && (
        <div className="card">
          <h3 className="card-header">
            <Building2 className="mr-2 inline h-4 w-4" />
            R&eacute;partition produits par revendeur
          </h3>
          <div className="space-y-3">
            {resellers.map((r, idx) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: RESELLER_COLORS[idx] }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-[11px] text-gray-400">{r.country} &middot; {r.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.productsHandled.map((p) => (
                    <span
                      key={p}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: PRODUCT_COLORS[p] || "#888" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ By Country ═══ */}
      <div className="card">
        <h3 className="card-header">Chiffre d&apos;affaires par pays</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.byCountry}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: "#6b7280" }} width={100} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "CA"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="revenue" fill="#3a9348" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Pipeline ═══ */}
      <div className="card">
        <h3 className="card-header">Pipeline commercial</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {data.pipeline.map((p) => (
            <div
              key={p.status}
              className={cn("rounded-xl border-2 p-4 text-center", PIPELINE_COLORS[p.status] || "bg-gray-50")}
            >
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                {STATUS_LABELS[p.status] || p.status}
              </p>
              <p className="mt-2 text-2xl font-bold">{p.count}</p>
              <p className="mt-1 text-xs opacity-70">{formatCurrency(p.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ By Product Table ═══ */}
      <div className="card">
        <h3 className="card-header">Ventes par produit</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left font-medium text-gray-500">Produit</th>
              <th className="pb-3 text-right font-medium text-gray-500">Quantit&eacute;</th>
              <th className="pb-3 text-right font-medium text-gray-500">Chiffre d&apos;affaires</th>
              <th className="pb-3 text-right font-medium text-gray-500">Part</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.byProduct.map((p) => {
              const totalProdRevenue = data.byProduct.reduce((s, x) => s + x.revenue, 0);
              const share = totalProdRevenue > 0 ? ((p.revenue / totalProdRevenue) * 100).toFixed(1) : "0";
              return (
                <tr key={p.name} className="hover:bg-gray-50/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PRODUCT_COLORS[p.name] || "#888" }}
                      />
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-gray-700">{formatNumber(p.quantity)} kg</td>
                  <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(p.revenue)}</td>
                  <td className="py-3 text-right text-gray-500">{share}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
