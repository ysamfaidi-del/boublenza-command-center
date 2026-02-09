"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import LiveKPI from "@/components/war-room/LiveKPI";
import PnLTable from "@/components/war-room/PnLTable";
import WorldMap from "@/components/war-room/WorldMap";
import AlertsPanel from "@/components/war-room/AlertsPanel";
import PositionsTable from "@/components/war-room/PositionsTable";
import CurrencyExposure from "@/components/war-room/CurrencyExposure";
import type { WarRoomData } from "@/types/premium";

export default function WarRoomPage() {
  const [data, setData] = useState<WarRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(() => {
    fetch("/api/war-room")
      .then((r) => r.json())
      .then((d) => { setData(d); setLastRefresh(new Date()); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-wr-bg">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-wr-green" />
          <p className="mt-4 text-sm text-wr-muted">Initialisation War Room...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-wr-bg p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-wr-green">BOUBLENZA</span> WAR ROOM
          </h1>
          <p className="text-xs text-wr-muted">
            Centre de commande — Dernière MAJ : {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-wr-green/10 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-wr-green animate-pulse" />
            <span className="text-xs font-medium text-wr-green">LIVE</span>
          </div>
          <button onClick={fetchData} className="rounded-lg bg-white/5 p-2 text-wr-muted hover:bg-white/10 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <LiveKPI kpis={data.kpis} />

      {/* Map + Alerts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorldMap flows={data.flows} />
        </div>
        <div>
          <AlertsPanel alerts={data.alerts} />
        </div>
      </div>

      {/* Positions + P&L + Currency */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PositionsTable positions={data.positions} />
        </div>
        <div className="lg:col-span-1">
          <PnLTable data={data.pnl} />
        </div>
        <div className="lg:col-span-1">
          <CurrencyExposure data={data.currencies} />
        </div>
      </div>
    </div>
  );
}
