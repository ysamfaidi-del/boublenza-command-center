"use client";

import { useState, useEffect } from "react";
import { Loader2, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import CocoaChart from "@/components/previsions/CocoaChart";
import MarketTrends from "@/components/previsions/MarketTrends";
import DemandForecast from "@/components/previsions/DemandForecast";
import NewsDigest from "@/components/previsions/NewsDigest";

interface ProdRec {
  product: string;
  avgMonthlyProduction: number;
  avgMonthlyDemand: number;
  ratio: number;
  capacityUtilization: number;
  status: "optimal" | "sous_capacite" | "sur_capacite";
  recommendation: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  optimal: { bg: "bg-green-50 border-green-200", text: "text-green-700", label: "Optimal" },
  sous_capacite: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Sous-capacité" },
  sur_capacite: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Sur-capacité" },
};

const TABS = [
  { key: "marche", label: "Cours du cacao" },
  { key: "tendances", label: "Tendances marchés" },
  { key: "demande", label: "Prévisions demande" },
  { key: "production", label: "Recommandations production" },
];

export default function PrevisionsPage() {
  const [tab, setTab] = useState("marche");
  const [prodRecs, setProdRecs] = useState<ProdRec[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);

  useEffect(() => {
    fetch("/api/previsions/production")
      .then((r) => r.json())
      .then((d) => setProdRecs(d.recommendations || []))
      .finally(() => setLoadingProd(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "marche" && (
        <div className="space-y-6">
          <CocoaChart />
          <NewsDigest />
        </div>
      )}

      {tab === "tendances" && <MarketTrends />}

      {tab === "demande" && <DemandForecast />}

      {tab === "production" && (
        <div className="space-y-6">
          {loadingProd ? (
            <div className="card flex h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {prodRecs.map((rec) => {
                  const style = STATUS_STYLES[rec.status] || STATUS_STYLES.optimal;
                  return (
                    <div
                      key={rec.product}
                      className={cn("rounded-xl border-2 p-5", style.bg)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{rec.product}</h4>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", style.text, style.bg)}>
                          {style.label}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Prod. moy./mois</p>
                          <p className="text-lg font-bold text-gray-900">
                            {rec.avgMonthlyProduction.toLocaleString()} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Demande moy./mois</p>
                          <p className="text-lg font-bold text-gray-900">
                            {rec.avgMonthlyDemand.toLocaleString()} kg
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Utilisation capacité</span>
                          <span>{rec.capacityUtilization}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gray-200">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              rec.capacityUtilization > 90
                                ? "bg-red-500"
                                : rec.capacityUtilization > 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(100, rec.capacityUtilization)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              <div className="card">
                <h3 className="card-header">
                  <Factory className="mr-2 inline h-5 w-5 text-forest-600" />
                  Recommandations de production
                </h3>
                <div className="mt-4 space-y-4">
                  {prodRecs.map((rec) => {
                    const style = STATUS_STYLES[rec.status] || STATUS_STYLES.optimal;
                    return (
                      <div
                        key={rec.product}
                        className="flex items-start gap-4 rounded-lg border border-gray-100 p-4"
                      >
                        <div className={cn("mt-0.5 h-3 w-3 rounded-full flex-shrink-0",
                          rec.status === "optimal" ? "bg-green-500" :
                          rec.status === "sous_capacite" ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rec.product}</p>
                          <p className="mt-1 text-sm text-gray-600">{rec.recommendation}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            Ratio offre/demande : {rec.ratio}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
