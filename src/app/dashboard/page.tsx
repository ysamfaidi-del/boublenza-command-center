"use client";

import { useEffect, useState } from "react";
import { DollarSign, Factory, ShoppingCart, Gauge } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ProductSalesChart from "@/components/dashboard/ProductSalesChart";
import ProductionChart from "@/components/dashboard/ProductionChart";
import TopClientsChart from "@/components/dashboard/TopClientsChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { formatCurrency, formatTonnes } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="CA du mois"
          value={formatCurrency(data.kpis.monthlyRevenue)}
          change={data.kpis.monthlyRevenueChange}
          icon={DollarSign}
        />
        <KpiCard
          title="Production du mois"
          value={formatTonnes(data.kpis.totalProduction)}
          change={data.kpis.productionChange}
          icon={Factory}
        />
        <KpiCard
          title="Commandes actives"
          value={String(data.kpis.activeOrders)}
          change={data.kpis.ordersChange}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Taux de capacité"
          value={`${data.kpis.capacityRate}%`}
          change={0}
          icon={Gauge}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={data.monthlyRevenue} />
        <ProductSalesChart data={data.productSales} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProductionChart data={data.productionVsTarget} />
        <TopClientsChart data={data.topClients} />
      </div>

      {/* Recent Orders */}
      <RecentOrders data={data.recentOrders} />
    </div>
  );
}
