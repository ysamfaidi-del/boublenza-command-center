"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { VaRResult, StressScenario, HedgeScenario, CounterpartyScore } from "@/types/premium";

interface RiskData { var: VaRResult; stressScenarios: StressScenario[]; hedgeScenarios: HedgeScenario[]; counterparties: CounterpartyScore[] }

const RISK_COLORS = { low: "text-green-600 bg-green-50", medium: "text-yellow-600 bg-yellow-50", high: "text-orange-600 bg-orange-50", critical: "text-red-600 bg-red-50" };
const RATING_COLORS = { A: "bg-green-100 text-green-800", B: "bg-blue-100 text-blue-800", C: "bg-yellow-100 text-yellow-800", D: "bg-red-100 text-red-800" };

export default function RiskPage() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/risk").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* VaR KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card border-l-4 border-l-yellow-500">
          <p className="text-xs text-gray-500">VaR 95%</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(data.var.var95)}</p>
          <p className="text-xs text-gray-400">Perte max. avec 95% de confiance</p>
        </div>
        <div className="card border-l-4 border-l-orange-500">
          <p className="text-xs text-gray-500">VaR 99%</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(data.var.var99)}</p>
          <p className="text-xs text-gray-400">Perte max. avec 99% de confiance</p>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500">Expected Shortfall</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(data.var.expectedShortfall)}</p>
          <p className="text-xs text-gray-400">Perte moyenne au-delà du VaR</p>
        </div>
      </div>

      {/* Exposure by type */}
      <div className="card">
        <h3 className="card-header">Répartition de l&apos;exposition au risque</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.var.exposureByType} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={130} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), "Exposition"]} contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {data.var.exposureByType.map((_, i) => <Cell key={i} fill={["#3b82f6", "#f59e0b", "#ef4444"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stress Tests */}
        <div className="card">
          <h3 className="card-header"><Shield className="mr-2 inline h-4 w-4" />Stress Tests</h3>
          <div className="space-y-3">
            {data.stressScenarios.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">Cacao {s.cocoaChange > 0 ? "+" : ""}{s.cocoaChange}% | FX {s.fxChange > 0 ? "+" : ""}{s.fxChange}%</p>
                </div>
                <div className="text-right">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", RISK_COLORS[s.riskLevel])}>{s.riskLevel}</span>
                  <p className="mt-1 text-xs text-gray-500">CA {s.impactRevenue > 0 ? "+" : ""}{s.impactRevenue}% | Marge {s.impactMargin > 0 ? "+" : ""}{s.impactMargin}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hedging */}
        <div className="card">
          <h3 className="card-header">Scénarios de couverture</h3>
          <div className="space-y-3">
            {data.hedgeScenarios.map((h) => (
              <div key={h.strategy} className={cn("flex items-center justify-between rounded-lg border p-3", h.recommendation ? "border-green-200 bg-green-50/50" : "border-gray-100")}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{h.strategy}</p>
                    {h.recommendation && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-500">Coût : {formatCurrency(h.cost)} | Protection : {h.protection}%</p>
                </div>
                <p className="text-sm font-bold text-green-700">+{formatCurrency(h.netBenefit)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counterparty Risk */}
      <div className="card">
        <h3 className="card-header"><AlertTriangle className="mr-2 inline h-4 w-4" />Risque contrepartie</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="pb-2 text-left">Client</th>
              <th className="pb-2 text-left">Pays</th>
              <th className="pb-2 text-center">Rating</th>
              <th className="pb-2 text-right">Exposition</th>
              <th className="pb-2 text-right">Score paiement</th>
              <th className="pb-2 text-right">Délai moyen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.counterparties.slice(0, 10).map((c) => (
              <tr key={c.clientId} className="hover:bg-gray-50/50">
                <td className="py-2 font-medium text-gray-900">{c.client}</td>
                <td className="py-2 text-gray-600">{c.country}</td>
                <td className="py-2 text-center"><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", RATING_COLORS[c.riskRating])}>{c.riskRating}</span></td>
                <td className="py-2 text-right font-medium">{formatCurrency(c.totalExposure)}</td>
                <td className="py-2 text-right"><span className={cn("text-xs font-medium", c.paymentScore > 70 ? "text-green-600" : "text-red-600")}>{c.paymentScore}/100</span></td>
                <td className="py-2 text-right text-gray-500">{c.avgPaymentDays}j</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
