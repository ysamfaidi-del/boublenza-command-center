"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Truck, AlertTriangle, CheckCircle, Clock, Package } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import type { Shipment, LeadTimeData, Bottleneck, QualityLot } from "@/types/premium";
import DemoBadge from "@/components/ui/DemoBadge";

interface SCData { shipments: Shipment[]; leadTimes: LeadTimeData[]; bottlenecks: Bottleneck[]; qualityLots: QualityLot[] }

const STATUS_STYLES: Record<string, { bg: string; icon: typeof Truck }> = {
  preparing: { bg: "bg-blue-100 text-blue-700", icon: Package },
  in_transit: { bg: "bg-purple-100 text-purple-700", icon: Truck },
  customs: { bg: "bg-yellow-100 text-yellow-700", icon: Clock },
  delivered: { bg: "bg-green-100 text-green-700", icon: CheckCircle },
  delayed: { bg: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const SEVERITY_COLORS = { low: "border-green-200 bg-green-50", medium: "border-yellow-200 bg-yellow-50", high: "border-red-200 bg-red-50" };

export default function SupplyChainPage() {
  const [data, setData] = useState<SCData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/supply-chain").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>;
  if (!data) return null;

  const delayed = data.shipments.filter((s) => s.status === "delayed").length;
  const inTransit = data.shipments.filter((s) => s.status === "in_transit").length;

  return (
    <div className="space-y-8">
      <DemoBadge label="Données logistique simulées — en attente d'intégration ERP" />
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card"><p className="text-xs text-gray-500">En transit</p><p className="mt-1 text-2xl font-bold text-purple-700">{inTransit}</p></div>
        <div className="card"><p className="text-xs text-gray-500">En retard</p><p className="mt-1 text-2xl font-bold text-red-700">{delayed}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Taux livraison à temps</p><p className="mt-1 text-2xl font-bold text-green-700">{data.leadTimes.length > 0 ? Math.round(data.leadTimes.reduce((s, l) => s + l.onTimeRate, 0) / data.leadTimes.length) : 0}%</p></div>
        <div className="card"><p className="text-xs text-gray-500">Lots qualité tracés</p><p className="mt-1 text-2xl font-bold text-gray-900">{data.qualityLots.length}</p></div>
      </div>

      {/* Shipments Timeline */}
      <div className="card">
        <h3 className="card-header"><Truck className="mr-2 inline h-4 w-4" />Suivi des expéditions</h3>
        <div className="space-y-2">
          {data.shipments.slice(0, 10).map((s) => {
            const style = STATUS_STYLES[s.status] || STATUS_STYLES.preparing;
            const Icon = style.icon;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full p-1.5", style.bg)}><Icon className="h-3.5 w-3.5" /></span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.id} — {s.client}</p>
                    <p className="text-xs text-gray-500">{s.product} • {formatNumber(s.quantity)} kg → {s.destination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">ETA : {s.eta}</p>
                  <p className={cn("text-xs font-medium", s.status === "delayed" ? "text-red-600" : s.daysRemaining < 5 ? "text-yellow-600" : "text-green-600")}>
                    {s.status === "delivered" ? "Livré" : s.status === "delayed" ? `Retard +${s.daysRemaining}j` : `${s.daysRemaining}j restants`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lead Times */}
        <div className="card">
          <h3 className="card-header">Délais moyens par destination</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadTimes} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="j" />
                <YAxis type="category" dataKey="destination" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v} jours`, ""]} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="avgDays" fill="#3a9348" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="card">
          <h3 className="card-header"><AlertTriangle className="mr-2 inline h-4 w-4" />Goulots d&apos;étranglement</h3>
          <div className="space-y-3">
            {data.bottlenecks.map((b) => (
              <div key={b.stage} className={cn("rounded-lg border p-4", SEVERITY_COLORS[b.severity])}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{b.stage}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", b.severity === "high" ? "bg-red-200 text-red-800" : b.severity === "medium" ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800")}>{b.severity}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{b.description}</p>
                <p className="mt-1 text-xs text-gray-500">Impact : {b.impact} • Retard moyen : +{b.avgDelay}j</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality Lots */}
      <div className="card">
        <h3 className="card-header">Traçabilité qualité</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="pb-2 text-left">Lot</th><th className="pb-2 text-left">Produit</th><th className="pb-2 text-left">Date</th><th className="pb-2 text-right">Quantité</th><th className="pb-2 text-center">Qualité</th><th className="pb-2 text-left">Destination</th><th className="pb-2 text-center">Statut</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {data.qualityLots.slice(0, 12).map((l) => (
              <tr key={l.lotId} className="hover:bg-gray-50/50">
                <td className="py-2 font-mono text-xs font-medium text-gray-900">{l.lotId}</td>
                <td className="py-2">{l.product}</td>
                <td className="py-2 text-gray-500">{l.date}</td>
                <td className="py-2 text-right">{formatNumber(l.quantity)} kg</td>
                <td className="py-2 text-center"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", l.quality === "Premium" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700")}>{l.quality}</span></td>
                <td className="py-2 text-gray-600">{l.destination}</td>
                <td className="py-2 text-center text-xs">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
