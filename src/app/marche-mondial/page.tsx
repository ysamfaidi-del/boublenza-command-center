"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Globe, Newspaper,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus,
  Leaf, Scale, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketMondialData } from "@/types";

const TABS = [
  { key: "cours", label: "Cours & Forex" },
  { key: "tendances", label: "Tendances sectorielles" },
  { key: "news", label: "Actualités" },
];

const SENTIMENT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  positive: { bg: "bg-green-50 border-green-200", text: "text-green-700", label: "Positif" },
  neutral: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", label: "Neutre" },
  negative: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Négatif" },
};

const SECTOR_COLORS = ["#3a9348", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const CAROB_ADVANTAGES = [
  "Naturellement sucré — pas besoin d'ajout de sucre",
  "Sans caféine ni théobromine",
  "Riche en fibres et calcium",
  "Sans gluten certifié",
  "Production durable et faible en eau",
  "Empreinte carbone réduite vs cacao",
];

export default function MarcheMondialPage() {
  const [data, setData] = useState<MarketMondialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cours");

  useEffect(() => {
    fetch("/api/market/mondial")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-wr-200 border-t-wr-green" />
          <p className="mt-4 text-sm text-gray-500">Chargement des données marché...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wr-card">
            <Globe className="h-5 w-5 text-wr-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marché Mondial</h1>
            <p className="text-sm text-gray-500">
              Cours des matières premières, taux de change et tendances sectorielles
            </p>
          </div>
          <span className="ml-auto rounded-full bg-wr-card px-3 py-1 text-xs font-bold text-wr-green">
            LIVE DATA
          </span>
        </div>
      </div>

      {/* ═══ Summary KPIs ═══ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Cocoa */}
        <div className="card !p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <BarChart3 className="h-3.5 w-3.5" />
            Cacao (USD/t)
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${data.cocoa.currentPrice.toLocaleString()}
          </p>
          <div className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            data.cocoa.changePercent >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {data.cocoa.changePercent >= 0
              ? <TrendingUp className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />}
            {data.cocoa.changePercent >= 0 ? "+" : ""}{data.cocoa.changePercent.toFixed(2)}%
            <span className="font-normal text-gray-400 ml-1">
              ({data.cocoa.change >= 0 ? "+" : ""}{data.cocoa.change.toFixed(0)} $)
            </span>
          </div>
        </div>

        {/* EUR/USD */}
        {data.forex?.map((f) => (
          <div key={f.pair} className="card !p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <DollarSign className="h-3.5 w-3.5" />
              {f.pair}
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {f.pair.includes("DZD") ? f.rate.toFixed(2) : f.rate.toFixed(4)}
            </p>
            <div className={cn(
              "mt-1 flex items-center gap-1 text-xs font-semibold",
              f.changePercent > 0 ? "text-green-600" : f.changePercent < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {f.changePercent === 0
                ? <Minus className="h-3.5 w-3.5" />
                : f.changePercent > 0
                  ? <ArrowUpRight className="h-3.5 w-3.5" />
                  : <ArrowDownRight className="h-3.5 w-3.5" />}
              {f.changePercent >= 0 ? "+" : ""}{f.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Content ═══ */}

      {/* ── TAB 1: Cours & Forex ── */}
      {tab === "cours" && (
        <div className="space-y-6">
          {/* Cocoa price chart */}
          <div className="card">
            <h3 className="card-header">
              <BarChart3 className="mr-2 inline h-4 w-4" />
              Cours du cacao — 90 derniers jours (USD/tonne)
            </h3>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.cocoa.history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="cocoaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b07a3b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#b07a3b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    interval={Math.floor((data.cocoa.history?.length || 30) / 8)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                    domain={["dataMin - 200", "dataMax + 200"]}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Prix"]}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                    }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#b07a3b"
                    strokeWidth={2.5}
                    fill="url(#cocoaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forex history chart */}
          <div className="card">
            <h3 className="card-header">
              <DollarSign className="mr-2 inline h-4 w-4" />
              Historique taux de change (base EUR) — 90 jours
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.forexHistory} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    interval={Math.floor((data.forexHistory?.length || 30) / 8)}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    domain={["dataMin - 0.01", "dataMax + 0.01"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    domain={["dataMin - 1", "dataMax + 1"]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="USD" stroke="#3b82f6" strokeWidth={2} dot={false} name="EUR/USD" />
                  <Line yAxisId="left" type="monotone" dataKey="GBP" stroke="#8b5cf6" strokeWidth={2} dot={false} name="EUR/GBP" />
                  <Line yAxisId="right" type="monotone" dataKey="DZD" stroke="#f59e0b" strokeWidth={2} dot={false} name="EUR/DZD" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Carob vs Cocoa spread */}
          <div className="card border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/40 to-white">
            <h3 className="card-header">
              <Scale className="mr-2 inline h-4 w-4 text-green-600" />
              Avantage prix caroube vs cacao
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-gray-500">Prix caroube (Boublenza)</p>
                <p className="mt-1 text-3xl font-bold text-green-700">
                  ${data.carobVsCocoa.carobPrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">USD / tonne</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <span className="text-xl font-black text-green-700">
                    -{data.carobVsCocoa.spreadPercent.toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-green-700">
                  Économie de ${data.carobVsCocoa.spread.toLocaleString()}/t
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Prix cacao (marché)</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  ${data.carobVsCocoa.cocoaPrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">USD / tonne</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Tendances sectorielles ── */}
      {tab === "tendances" && (
        <div className="space-y-6">
          {/* Sector demand bar chart */}
          <div className="card">
            <h3 className="card-header">
              <TrendingUp className="mr-2 inline h-4 w-4" />
              Demande par secteur (tonnes/an)
            </h3>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sector" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "volume") return [`${value.toLocaleString()} t`, "Volume"];
                      return [`+${value}%`, "Croissance"];
                    }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend formatter={(v) => v === "volume" ? "Volume demande" : "Croissance (%)"} />
                  <Bar dataKey="volume" fill="#3a9348" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sector details cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.trends?.map((t, idx) => (
              <div key={t.sector} className="card !p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${SECTOR_COLORS[idx]}15` }}
                  >
                    <TrendingUp className="h-5 w-5" style={{ color: SECTOR_COLORS[idx] }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.sector}</h4>
                    <p className="text-xs text-gray-500">Marché : {t.marketSize}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Croissance</p>
                    <p className="text-lg font-bold text-green-600">+{t.growth}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Volume</p>
                    <p className="text-lg font-bold text-gray-900">{(t.volume / 1000).toFixed(0)}k t</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.topCountries.map((c) => (
                    <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Carob advantages table */}
          <div className="card">
            <h3 className="card-header">
              <Leaf className="mr-2 inline h-4 w-4 text-green-600" />
              Avantages compétitifs de la caroube
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {CAROB_ADVANTAGES.map((adv, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50/30 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span className="text-sm text-gray-700">{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Actualités ── */}
      {tab === "news" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Newspaper className="h-4 w-4" />
            {data.news?.length || 0} actualités récentes — générées par IA à partir des données marché
          </div>
          {data.news?.map((n, i) => {
            const badge = SENTIMENT_BADGE[n.sentiment] || SENTIMENT_BADGE.neutral;
            return (
              <div
                key={i}
                className={cn(
                  "card !p-5 border-l-4 hover:shadow-md transition-shadow",
                  n.sentiment === "positive" ? "border-l-green-400" :
                  n.sentiment === "negative" ? "border-l-red-400" : "border-l-gray-300"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{n.title}</h4>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{n.summary}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span>{n.source}</span>
                      <span>·</span>
                      <span>
                        {new Date(n.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold",
                    badge.bg, badge.text
                  )}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}

          {(!data.news || data.news.length === 0) && (
            <div className="card text-center py-12">
              <Newspaper className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Aucune actualité disponible pour le moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
