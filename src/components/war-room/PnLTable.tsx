"use client";

import { cn } from "@/lib/utils";
import type { PnLBreakdown } from "@/types/premium";

interface Props { data: PnLBreakdown[] }

export default function PnLTable({ data }: Props) {
  const total = data.reduce(
    (acc, r) => ({ rev: acc.rev + r.revenue, gm: acc.gm + r.grossMargin, nm: acc.nm + r.netMargin, ebitda: acc.ebitda + r.ebitda }),
    { rev: 0, gm: 0, nm: 0, ebitda: 0 }
  );

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-wr-muted">P&L par produit</h3>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-wr-muted">
            <th className="pb-2 text-left">Produit</th>
            <th className="pb-2 text-right">CA</th>
            <th className="pb-2 text-right">Marge brute</th>
            <th className="pb-2 text-right">%</th>
            <th className="pb-2 text-right">EBITDA</th>
            <th className="pb-2 text-right">Marge nette</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((r) => (
            <tr key={r.product} className="text-white/90 hover:bg-white/5">
              <td className="py-2 font-medium">{r.product}</td>
              <td className="py-2 text-right">${r.revenue.toLocaleString()}</td>
              <td className="py-2 text-right text-wr-green">${r.grossMargin.toLocaleString()}</td>
              <td className="py-2 text-right">
                <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", r.grossMarginPct > 40 ? "bg-wr-green/20 text-wr-green" : "bg-wr-yellow/20 text-wr-yellow")}>
                  {r.grossMarginPct}%
                </span>
              </td>
              <td className="py-2 text-right">${r.ebitda.toLocaleString()}</td>
              <td className={cn("py-2 text-right", r.netMargin > 0 ? "text-wr-green" : "text-wr-red")}>
                ${r.netMargin.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/20 font-bold text-white">
            <td className="pt-3">TOTAL</td>
            <td className="pt-3 text-right">${total.rev.toLocaleString()}</td>
            <td className="pt-3 text-right text-wr-green">${total.gm.toLocaleString()}</td>
            <td className="pt-3 text-right">
              <span className="rounded bg-wr-green/20 px-1.5 py-0.5 text-xs text-wr-green">
                {total.rev > 0 ? Math.round((total.gm / total.rev) * 100) : 0}%
              </span>
            </td>
            <td className="pt-3 text-right">${total.ebitda.toLocaleString()}</td>
            <td className="pt-3 text-right text-wr-green">${total.nm.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
