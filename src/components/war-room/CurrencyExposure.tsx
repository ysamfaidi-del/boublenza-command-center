"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CurrencyExposure as CurrencyExposureType } from "@/types/premium";

interface Props { data: CurrencyExposureType[] }

const COLORS = ["#00ff88", "#3b82f6", "#fbbf24", "#a855f7"];
const FLAG: Record<string, string> = { USD: "🇺🇸", EUR: "🇪🇺", DZD: "🇩🇿", GBP: "🇬🇧" };

export default function CurrencyExposure({ data }: Props) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-wr-muted">Exposition devises</h3>
      <div className="mt-4 flex items-center gap-6">
        <div className="h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="currency" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((d, i) => (
            <div key={d.currency} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-white">
                  {FLAG[d.currency] || ""} {d.currency}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">${d.total.toLocaleString()}</span>
                <span className="ml-2 text-xs text-wr-muted">{d.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
