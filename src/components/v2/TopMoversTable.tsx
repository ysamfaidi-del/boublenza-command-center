"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import V2Card from "./V2Card";
import FilterDropdown from "./FilterDropdown";
import type { V2Mover, V2Account } from "@/types/v2";

function formatDollar(n: number): string {
  const sign = n >= 0 ? "" : "-";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function MiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (!values.length) return null;
  const max = Math.max(...values.map(Math.abs), 1);
  const h = 16;
  const w = 48;
  const step = w / Math.max(values.length - 1, 1);
  const mid = h / 2;
  const points = values.map((v, i) => `${i * step},${mid - (v / max) * (h / 2 - 1)}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        fill="none"
        stroke={positive ? "#188038" : "#d93025"}
        strokeWidth={1.5}
        points={points}
      />
    </svg>
  );
}

function CompanyTable({ data, type }: { data: V2Mover[]; type: "decliners" | "risers" }) {
  const [tab, setTab] = useState<"decliners" | "risers">(type);
  return (
    <V2Card title="Top moving companies">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gcs-gray-200 mb-3">
        <button
          onClick={() => setTab("decliners")}
          className={cn("v2-tab", tab === "decliners" && "v2-tab-active")}
        >
          Decliners
        </button>
        <button
          onClick={() => setTab("risers")}
          className={cn("v2-tab", tab === "risers" && "v2-tab-active")}
        >
          Risers
        </button>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <FilterDropdown
          label="Dates" value="7d-wow"
          options={[{ label: "7d w/w", value: "7d-wow" }, { label: "30d", value: "30d" }]}
        />
        <FilterDropdown
          label="Hierarchy" value="any"
          options={[{ label: "Any", value: "any" }, { label: "Top 10", value: "top10" }]}
        />
      </div>
      {/* Table */}
      <table className="v2-table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th className="text-right">7d change</th>
            <th className="text-right">w/w</th>
            <th className="text-right">w/w insights</th>
            <th className="text-right">{tab === "decliners" ? "Declining" : "Rising"} accts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => (
            <tr key={i} className="hover:bg-gcs-gray-50">
              <td className="font-medium">{m.name}</td>
              <td className={cn("text-right font-mono", m.change7d < 0 ? "text-gcs-red" : "text-gcs-green")}>
                {formatDollar(m.change7d)}
              </td>
              <td className={cn("text-right font-mono", m.wow < 0 ? "text-gcs-red" : "text-gcs-green")}>
                {m.wow > 0 ? "+" : ""}{m.wow}%
              </td>
              <td className="text-right text-gcs-gray-500">—</td>
              <td className="text-right">{m.accts}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-gcs-gray-500 py-4">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </V2Card>
  );
}

function AccountTable({ decliners, risers }: { decliners: V2Account[]; risers: V2Account[] }) {
  const [tab, setTab] = useState<"decliners" | "risers">("decliners");
  const data = tab === "decliners" ? decliners : risers;

  return (
    <V2Card title="Top moving accounts">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gcs-gray-200 mb-3">
        <button
          onClick={() => setTab("decliners")}
          className={cn("v2-tab", tab === "decliners" && "v2-tab-active")}
        >
          Decliners
        </button>
        <button
          onClick={() => setTab("risers")}
          className={cn("v2-tab", tab === "risers" && "v2-tab-active")}
        >
          Risers
        </button>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <FilterDropdown
          label="Dates" value="1d-dd"
          options={[{ label: "1d d/d", value: "1d-dd" }, { label: "7d w/w", value: "7d-wow" }]}
        />
      </div>
      {/* Table */}
      <table className="v2-table w-full">
        <thead>
          <tr>
            <th>Account</th>
            <th className="text-right">1d change</th>
            <th className="text-right">d/d</th>
            <th className="text-right">7d trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a, i) => (
            <tr key={i} className="hover:bg-gcs-gray-50">
              <td className="font-medium">{a.account}</td>
              <td className={cn("text-right font-mono", a.change1d < 0 ? "text-gcs-red" : "text-gcs-green")}>
                {formatDollar(a.change1d)}
              </td>
              <td className={cn("text-right font-mono", a.dd < 0 ? "text-gcs-red" : "text-gcs-green")}>
                {a.dd > 0 ? "+" : ""}{a.dd}%
              </td>
              <td className="text-right">
                <MiniSparkline values={a.trend7d} positive={a.change1d >= 0} />
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-gcs-gray-500 py-4">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </V2Card>
  );
}

export default function TopMoversTable({ movers }: {
  movers: {
    companies: { decliners: V2Mover[]; risers: V2Mover[] };
    accounts: { decliners: V2Account[]; risers: V2Account[] };
  };
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CompanyTable data={movers.companies.decliners} type="decliners" />
      <AccountTable decliners={movers.accounts.decliners} risers={movers.accounts.risers} />
    </div>
  );
}
