"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { V2RevenueSummary } from "@/types/v2";

function formatDollar(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function KpiCell({ label, value, sub, negative, warning }: {
  label: string; value: string; sub?: string; negative?: boolean; warning?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 px-4 py-3">
      <p className="v2-kpi-label">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={cn("v2-kpi-value", negative && "text-gcs-red")}>
          {value}
        </p>
        {warning && <AlertTriangle className="h-3.5 w-3.5 text-gcs-yellow" />}
      </div>
      {sub && (
        <p className={cn("v2-kpi-sub", negative && "text-gcs-red")}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function RevenueSummaryStrip({ data }: { data: V2RevenueSummary }) {
  return (
    <div className="rounded-lg border border-gcs-gray-200 bg-gcs-gray-50">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <h3 className="v2-section-title">Revenue summary</h3>
        <p className="text-[11px] text-gcs-gray-500">
          {data.quarterProgress}% of quarter passed · {data.targetAttainment}% of target attained
        </p>
      </div>

      {/* KPI strip */}
      <div className="flex items-stretch divide-x divide-gcs-gray-200">
        <KpiCell
          label="Q1 target"
          value={formatDollar(data.quarterTarget)}
        />
        <KpiCell
          label="QTD revenue"
          value={formatDollar(data.qtdRevenue)}
          sub={`Gap to target ${formatDollar(data.gapToTarget)}`}
        />
        <KpiCell
          label="Finance outlook"
          value={`${data.financeOutlookPct}%`}
          sub={formatDollar(data.financeOutlook)}
        />
        <KpiCell
          label="Sales outlook"
          value={`${data.salesOutlook}%`}
          sub={formatDollar(data.salesOutlookAmount)}
          warning={data.salesOutlook === 0}
        />
        <KpiCell
          label="w/w"
          value={`${data.weekOverWeek > 0 ? "+" : ""}${data.weekOverWeek}%`}
          sub={formatDollar(data.weekOverWeekAmount)}
          negative={data.weekOverWeek < 0}
        />
        <KpiCell
          label="QTD y/y"
          value={`${data.qtdYearOverYear > 0 ? "+" : ""}${data.qtdYearOverYear}%`}
          sub={formatDollar(data.qtdYearOverYearAmount)}
          negative={data.qtdYearOverYear < 0}
        />
      </div>
    </div>
  );
}
