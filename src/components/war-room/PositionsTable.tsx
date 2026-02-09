"use client";

import { cn } from "@/lib/utils";
import type { OpenPosition } from "@/types/premium";

interface Props { positions: OpenPosition[] }

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-wr-blue/20 text-wr-blue",
  in_production: "bg-wr-yellow/20 text-wr-yellow",
  shipped: "bg-purple-500/20 text-purple-400",
};

export default function PositionsTable({ positions }: Props) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-wr-muted">Positions ouvertes</h3>
      <div className="mt-4 max-h-[320px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-wr-muted">
              <th className="pb-2 text-left">Client</th>
              <th className="pb-2 text-left">Produit</th>
              <th className="pb-2 text-right">Valeur</th>
              <th className="pb-2 text-center">Statut</th>
              <th className="pb-2 text-right">J-livraison</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.slice(0, 12).map((p) => (
              <tr key={p.orderId} className="text-white/80 hover:bg-white/5">
                <td className="py-2">
                  <div className="font-medium">{p.client}</div>
                  <div className="text-[10px] text-wr-muted">{p.country}</div>
                </td>
                <td className="py-2">{p.product}</td>
                <td className="py-2 text-right font-medium">${p.value.toLocaleString()}</td>
                <td className="py-2 text-center">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_BADGE[p.status] || "bg-white/10 text-white/60")}>
                    {p.status === "confirmed" ? "Confirmé" : p.status === "in_production" ? "Production" : "Expédié"}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <span className={cn("font-mono text-xs", p.daysUntilDelivery < 0 ? "text-wr-red" : p.daysUntilDelivery < 7 ? "text-wr-yellow" : "text-wr-green")}>
                    {p.daysUntilDelivery < 0 ? `${Math.abs(p.daysUntilDelivery)}j retard` : `${p.daysUntilDelivery}j`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
