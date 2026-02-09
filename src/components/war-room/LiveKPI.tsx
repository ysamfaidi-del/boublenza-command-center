"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WarRoomKPI } from "@/types/premium";

interface Props {
  kpis: Record<string, WarRoomKPI>;
}

function formatVal(v: number, currency?: string) {
  if (currency) return `$${v.toLocaleString("fr-FR")}`;
  return v.toLocaleString("fr-FR");
}

export default function LiveKPI({ kpis }: Props) {
  const items = Object.values(kpis);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((kpi) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "glass-card p-4",
            kpi.severity === "critical" && "glow-red",
            kpi.severity === "warning" && "glow-yellow"
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-wr-muted">
            {kpi.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatVal(kpi.value, kpi.currency)}
          </p>
          {kpi.trend !== 0 && (
            <div className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              kpi.trend > 0 ? "text-wr-green" : "text-wr-red"
            )}>
              {kpi.trend > 0 ? <TrendingUp className="h-3 w-3" /> : kpi.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {kpi.trend > 0 ? "+" : ""}{kpi.trend}%
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
