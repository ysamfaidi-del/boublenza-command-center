"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  suffix?: string;
}

export default function KpiCard({ title, value, change, icon: Icon, suffix }: KpiCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50">
          <Icon className="h-5 w-5 text-forest-600" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {change}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {suffix && <span className="ml-1 text-sm font-normal text-gray-500">{suffix}</span>}
        </p>
        <p className="mt-1 text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}
