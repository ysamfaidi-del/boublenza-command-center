"use client";

import { formatCurrency, formatDate, formatNumber, STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import type { RecentOrder } from "@/types";

interface Props {
  data: RecentOrder[];
}

export default function RecentOrders({ data }: Props) {
  return (
    <div className="card">
      <h3 className="card-header">Dernières commandes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left font-medium text-gray-500">Client</th>
              <th className="pb-3 text-left font-medium text-gray-500">Produit</th>
              <th className="pb-3 text-right font-medium text-gray-500">Quantité</th>
              <th className="pb-3 text-right font-medium text-gray-500">Montant</th>
              <th className="pb-3 text-left font-medium text-gray-500">Statut</th>
              <th className="pb-3 text-right font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="py-3">
                  <div>
                    <p className="font-medium text-gray-900">{order.client}</p>
                    <p className="text-xs text-gray-400">{order.country}</p>
                  </div>
                </td>
                <td className="py-3 text-gray-700">{order.product}</td>
                <td className="py-3 text-right text-gray-700">
                  {formatNumber(order.quantity)} kg
                </td>
                <td className="py-3 text-right font-medium text-gray-900">
                  {formatCurrency(order.total)}
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "badge",
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="py-3 text-right text-gray-500">
                  {formatDate(order.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
