"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, DollarSign, Users, TrendingUp, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { Deal, ClientScore, PricingRecommendation, RFQ } from "@/types/premium";
import DemoBadge from "@/components/ui/DemoBadge";

interface CommData { pipeline: Deal[]; scoring: ClientScore[]; pricing: PricingRecommendation[]; rfqs: RFQ[] }

const STAGE_COLORS: Record<string, string> = {
  Prospection: "bg-gray-100 text-gray-700",
  Qualification: "bg-blue-100 text-blue-700",
  Proposition: "bg-purple-100 text-purple-700",
  Négociation: "bg-yellow-100 text-yellow-700",
  "Closing imminent": "bg-green-100 text-green-700",
};

const TIER_STYLES: Record<string, string> = {
  platinum: "bg-purple-100 text-purple-800 border-purple-200",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  silver: "bg-gray-100 text-gray-700 border-gray-200",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
};

const RFQ_STATUS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  quoted: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function CommercialPage() {
  const [data, setData] = useState<CommData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/commercial").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  const totalPipeline = data.pipeline.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = data.pipeline.reduce((s, d) => s + d.weightedValue, 0);
  const avgScore = data.scoring.length > 0 ? Math.round(data.scoring.reduce((s, c) => s + c.overallScore, 0) / data.scoring.length) : 0;
  const pendingRFQs = data.rfqs.filter((r) => r.status === "pending").length;

  // Pipeline by stage for chart
  const stageData = Object.entries(
    data.pipeline.reduce<Record<string, { total: number; weighted: number; count: number }>>((acc, d) => {
      if (!acc[d.stage]) acc[d.stage] = { total: 0, weighted: 0, count: 0 };
      acc[d.stage].total += d.value;
      acc[d.stage].weighted += d.weightedValue;
      acc[d.stage].count += 1;
      return acc;
    }, {})
  ).map(([stage, v]) => ({ stage, ...v }));

  return (
    <div className="space-y-8">
      <DemoBadge label="Pipeline et scoring simulés — connecter CRM" />
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-forest-600" />
            <p className="text-xs text-gray-500">Pipeline total</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalPipeline)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-gray-500">Pipeline pondéré</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-purple-700">{formatCurrency(weightedPipeline)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-gray-500">Score client moyen</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-700">{avgScore}/100</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-gray-500">RFQ en attente</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-yellow-700">{pendingRFQs}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deal Pipeline */}
        <div className="card">
          <h3 className="card-header">Pipeline commercial par étape</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="weighted" name="Pondéré" radius={[4, 4, 0, 0]}>
                  {stageData.map((_, i) => <Cell key={i} fill={["#9ca3af", "#3b82f6", "#8b5cf6", "#eab308", "#3a9348"][i % 5]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Scoring */}
        <div className="card">
          <h3 className="card-header">Scoring IA clients</h3>
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="pb-2 text-left">Client</th>
                  <th className="pb-2 text-center">Tier</th>
                  <th className="pb-2 text-right">LTV</th>
                  <th className="pb-2 text-center">Churn</th>
                  <th className="pb-2 text-center">Upsell</th>
                  <th className="pb-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.scoring.map((c) => (
                  <tr key={c.clientId} className="hover:bg-gray-50/50">
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{c.client}</p>
                      <p className="text-xs text-gray-500">{c.country}</p>
                    </td>
                    <td className="py-2 text-center">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", TIER_STYLES[c.tier])}>{c.tier}</span>
                    </td>
                    <td className="py-2 text-right text-xs font-medium">{formatCurrency(c.ltv)}</td>
                    <td className="py-2 text-center">
                      <span className={cn("text-xs font-medium", c.churnRisk > 50 ? "text-red-600" : c.churnRisk > 25 ? "text-yellow-600" : "text-green-600")}>
                        {c.churnRisk}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span className={cn("text-xs font-medium", c.upsellPotential > 60 ? "text-green-600" : "text-gray-600")}>
                        {c.upsellPotential}%
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn("text-sm font-bold", c.overallScore >= 80 ? "text-green-700" : c.overallScore >= 60 ? "text-blue-700" : "text-gray-700")}>
                        {c.overallScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="card">
        <h3 className="card-header"><DollarSign className="mr-2 inline h-4 w-4" />Recommandations prix dynamiques</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.pricing.map((p) => {
            const diff = p.recommendedPrice - p.currentPrice;
            const diffPct = ((diff / p.currentPrice) * 100).toFixed(1);
            return (
              <div key={p.product} className="rounded-lg border border-gray-100 p-4 hover:border-forest-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{p.product}</p>
                  <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", diff > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {diffPct}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Prix actuel</p>
                    <p className="text-lg font-bold text-gray-700">${p.currentPrice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Recommandé</p>
                    <p className={cn("text-lg font-bold", diff > 0 ? "text-green-700" : "text-red-700")}>${p.recommendedPrice}</p>
                  </div>
                </div>
                <div className="mt-2 rounded bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Marché : ${p.marketAvg}/t • Range : ${p.competitorRange[0]}–${p.competitorRange[1]}</p>
                </div>
                <p className="mt-2 text-xs text-gray-600">{p.rationale}</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-forest-500" style={{ width: `${p.confidence * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{Math.round(p.confidence * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Pipeline Table */}
      <div className="card">
        <h3 className="card-header">Pipeline des deals</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="pb-2 text-left">Client</th>
              <th className="pb-2 text-left">Produit</th>
              <th className="pb-2 text-left">Étape</th>
              <th className="pb-2 text-right">Valeur</th>
              <th className="pb-2 text-center">Probabilité</th>
              <th className="pb-2 text-right">Pondéré</th>
              <th className="pb-2 text-left">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.pipeline.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/50">
                <td className="py-2">
                  <p className="font-medium text-gray-900">{d.client}</p>
                  <p className="text-xs text-gray-500">{d.country}</p>
                </td>
                <td className="py-2 text-gray-600">{d.product}</td>
                <td className="py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STAGE_COLORS[d.stage] || "bg-gray-100 text-gray-700")}>{d.stage}</span>
                </td>
                <td className="py-2 text-right font-medium">{formatCurrency(d.value)}</td>
                <td className="py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-forest-500" style={{ width: `${d.probability}%` }} />
                    </div>
                    <span className="text-xs text-gray-600">{d.probability}%</span>
                  </div>
                </td>
                <td className="py-2 text-right font-medium text-forest-700">{formatCurrency(d.weightedValue)}</td>
                <td className="py-2 text-xs text-gray-500">{d.expectedClose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RFQ Manager */}
      <div className="card">
        <h3 className="card-header"><FileText className="mr-2 inline h-4 w-4" />Gestion des demandes de cotation</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="pb-2 text-left">ID</th>
              <th className="pb-2 text-left">Client</th>
              <th className="pb-2 text-left">Produit</th>
              <th className="pb-2 text-right">Quantité</th>
              <th className="pb-2 text-right">Prix demandé</th>
              <th className="pb-2 text-right">Prix suggéré</th>
              <th className="pb-2 text-center">Statut</th>
              <th className="pb-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.rfqs.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="py-2 font-mono text-xs font-medium text-gray-900">{r.id}</td>
                <td className="py-2">{r.client}</td>
                <td className="py-2 text-gray-600">{r.product}</td>
                <td className="py-2 text-right">{formatNumber(r.quantity)} kg</td>
                <td className="py-2 text-right">${r.requestedPrice}/t</td>
                <td className="py-2 text-right font-medium text-forest-700">${r.suggestedPrice}/t</td>
                <td className="py-2 text-center">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", RFQ_STATUS[r.status])}>{r.status}</span>
                </td>
                <td className="py-2 text-xs text-gray-500">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
