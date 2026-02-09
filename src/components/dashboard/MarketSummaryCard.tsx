"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, ArrowRight, Globe,
  BarChart3, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketSummary {
  cocoa: { currentPrice: number; change: number; changePercent: number };
  forex: { pair: string; rate: number; change24h: number; changePercent: number }[];
  carobVsCocoa: { carobPrice: number; cocoaPrice: number; spread: number; spreadPercent: number };
}

export default function MarketSummaryCard() {
  const [data, setData] = useState<MarketSummary | null>(null);

  useEffect(() => {
    fetch("/api/market/mondial")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="card animate-pulse">
        <div className="h-24 rounded bg-gray-100" />
      </div>
    );
  }

  const eurDzd = data.forex?.find((f) => f.pair === "EUR/DZD");
  const eurUsd = data.forex?.find((f) => f.pair === "EUR/USD");

  return (
    <div className="card relative overflow-hidden border-l-4 border-l-wr-green bg-gradient-to-r from-gray-50/80 to-white">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wr-card">
            <Globe className="h-4 w-4 text-wr-green" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Marché Mondial</h3>
          <span className="rounded bg-wr-card px-1.5 py-0.5 text-[9px] font-bold text-wr-green">LIVE</span>
        </div>
        <Link
          href="/marche-mondial"
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-wr-green hover:bg-wr-card transition-colors"
        >
          Voir détails <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Cocoa price */}
        <div className="rounded-lg border border-gray-100 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <BarChart3 className="h-3 w-3" />
            Cacao (USD/t)
          </div>
          <p className="mt-1 text-lg font-bold text-gray-900">
            ${data.cocoa.currentPrice.toLocaleString()}
          </p>
          <div className={cn(
            "mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold",
            data.cocoa.changePercent >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {data.cocoa.changePercent >= 0
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            {data.cocoa.changePercent >= 0 ? "+" : ""}{data.cocoa.changePercent.toFixed(2)}%
          </div>
        </div>

        {/* EUR/USD */}
        <div className="rounded-lg border border-gray-100 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <DollarSign className="h-3 w-3" />
            EUR/USD
          </div>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {eurUsd?.rate.toFixed(4) || "—"}
          </p>
          <div className={cn(
            "mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold",
            (eurUsd?.changePercent || 0) >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {(eurUsd?.changePercent || 0) === 0
              ? <Minus className="h-3 w-3" />
              : (eurUsd?.changePercent || 0) >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
            {(eurUsd?.changePercent || 0) >= 0 ? "+" : ""}{(eurUsd?.changePercent || 0).toFixed(2)}%
          </div>
        </div>

        {/* EUR/DZD */}
        <div className="rounded-lg border border-gray-100 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
            <DollarSign className="h-3 w-3" />
            EUR/DZD
          </div>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {eurDzd?.rate.toFixed(2) || "—"}
          </p>
          <div className={cn(
            "mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold",
            (eurDzd?.changePercent || 0) >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {(eurDzd?.changePercent || 0) === 0
              ? <Minus className="h-3 w-3" />
              : (eurDzd?.changePercent || 0) >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
            {(eurDzd?.changePercent || 0) >= 0 ? "+" : ""}{(eurDzd?.changePercent || 0).toFixed(2)}%
          </div>
        </div>

        {/* Carob vs Cocoa spread */}
        <div className="rounded-lg border border-green-100 bg-green-50/50 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-green-700">
            <TrendingUp className="h-3 w-3" />
            Avantage caroube
          </div>
          <p className="mt-1 text-lg font-bold text-green-700">
            -{data.carobVsCocoa.spreadPercent.toFixed(0)}%
          </p>
          <p className="mt-0.5 text-[11px] text-green-600">
            vs cacao (${data.carobVsCocoa.spread.toLocaleString()}/t)
          </p>
        </div>
      </div>
    </div>
  );
}
