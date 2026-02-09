"use client";

import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CriticalAlert } from "@/types/premium";

interface Props { alerts: CriticalAlert[] }

const ICONS = { critical: AlertOctagon, warning: AlertTriangle, info: Info };
const STYLES = {
  critical: "border-wr-red/30 bg-wr-red/10",
  warning: "border-wr-yellow/30 bg-wr-yellow/10",
  info: "border-wr-blue/30 bg-wr-blue/10",
};
const TEXT = { critical: "text-wr-red", warning: "text-wr-yellow", info: "text-wr-blue" };

export default function AlertsPanel({ alerts }: Props) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-wr-muted">Alertes critiques</h3>
        <span className="rounded-full bg-wr-red/20 px-2 py-0.5 text-xs font-bold text-wr-red">
          {alerts.filter((a) => a.severity === "critical").length}
        </span>
      </div>
      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto">
        {alerts.map((a) => {
          const Icon = ICONS[a.severity];
          return (
            <div key={a.id} className={cn("flex items-start gap-3 rounded-lg border p-3", STYLES[a.severity])}>
              <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", TEXT[a.severity])} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", TEXT[a.severity])}>{a.title}</p>
                <p className="mt-0.5 text-xs text-white/60">{a.description}</p>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <p className="py-8 text-center text-sm text-wr-muted">Aucune alerte active</p>
        )}
      </div>
    </div>
  );
}
