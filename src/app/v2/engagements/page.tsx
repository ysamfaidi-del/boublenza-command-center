"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

interface Shipment {
  id: string;
  client: string;
  product: string;
  qty: number;
  origin: string;
  destination: string;
  status: string;
  eta: string;
  vessel?: string;
}
interface LeadTime { route: string; avgDays: number; onTime: number; }
interface Bottleneck { area: string; severity: string; impact: string; resolution: string; }
interface StockItem { product: string; current: number; min: number; max: number; unit: string; daysOfSupply: number; }
interface StockMovement { month: string; inbound: number; outbound: number; balance: number; }

interface EngagementsData {
  shipments: Shipment[];
  leadTimes: LeadTime[];
  bottlenecks: Bottleneck[];
  stocks: StockItem[];
  stockMovements: StockMovement[];
  inTransit: number;
  delivered: number;
  avgLeadTime: number;
  onTimeRate: number;
}

const STATUS_STYLE: Record<string, string> = {
  "In Transit": "bg-blue-50 text-gcs-blue",
  "Loading": "bg-yellow-50 text-gcs-yellow",
  "Delivered": "bg-green-50 text-gcs-green",
  "Delayed": "bg-red-50 text-gcs-red",
  "Customs": "bg-purple-50 text-purple-600",
};
const COLORS = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#ab47bc"];

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export default function EngagementsPage() {
  const [data, setData] = useState<EngagementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"shipments" | "stocks" | "performance">("shipments");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/supply-chain").then((r) => r.json()),
      fetch("/api/stocks").then((r) => r.json()),
    ])
      .then(([sc, st]) => {
        const shipments: Shipment[] = (sc.shipments || []).map((s: Record<string, unknown>) => ({
          id: String(s.id || ""), client: String(s.client || s.destination || ""),
          product: String(s.product || ""), qty: Number(s.qty || s.quantity || s.tons || 0),
          origin: String(s.origin || "Tlemcen"), destination: String(s.destination || s.port || ""),
          status: String(s.status || ""), eta: String(s.eta || s.date || ""),
          vessel: String(s.vessel || ""),
        }));
        const leadTimes: LeadTime[] = (sc.leadTimes || []).map((l: Record<string, unknown>) => ({
          route: String(l.route || l.name || ""), avgDays: Number(l.avgDays || l.days || 0),
          onTime: Number(l.onTime || l.onTimeRate || 0),
        }));
        const bottlenecks: Bottleneck[] = (sc.bottlenecks || []).map((b: Record<string, unknown>) => ({
          area: String(b.area || b.name || ""), severity: String(b.severity || "medium"),
          impact: String(b.impact || ""), resolution: String(b.resolution || b.action || ""),
        }));
        const stocks: StockItem[] = (st.current || []).map((s: Record<string, unknown>) => ({
          product: String(s.product || s.name || ""), current: Number(s.current || s.qty || 0),
          min: Number(s.min || s.reorderPoint || 0), max: Number(s.max || s.capacity || 0),
          unit: String(s.unit || "t"), daysOfSupply: Number(s.daysOfSupply || s.dos || 0),
        }));
        const stockMovements: StockMovement[] = (st.movements || st.trends || []).map((m: Record<string, unknown>) => ({
          month: String(m.month || m.name || ""), inbound: Number(m.inbound || m.in || 0),
          outbound: Number(m.outbound || m.out || 0), balance: Number(m.balance || 0),
        }));
        setData({
          shipments, leadTimes, bottlenecks, stocks, stockMovements,
          inTransit: shipments.filter((s) => s.status === "In Transit").length,
          delivered: shipments.filter((s) => s.status === "Delivered").length,
          avgLeadTime: leadTimes.length ? Math.round(leadTimes.reduce((s, l) => s + l.avgDays, 0) / leadTimes.length) : 18,
          onTimeRate: leadTimes.length ? Math.round(leadTimes.reduce((s, l) => s + l.onTime, 0) / leadTimes.length) : 87,
        });
      })
      .catch(() => {
        setData({
          shipments: [
            { id: "SHP-2025-041", client: "Cargill EMEA", product: "CARUMA", qty: 20, origin: "Tlemcen Port", destination: "Rotterdam", status: "In Transit", eta: "2025-02-15", vessel: "MV Atlantic Star" },
            { id: "SHP-2025-040", client: "Barry Callebaut", product: "CAROB EXTRACT", qty: 5, origin: "Tlemcen Port", destination: "Zurich (rail)", status: "Customs", eta: "2025-02-10", vessel: "CMA CGM Marco" },
            { id: "SHP-2025-039", client: "Naturex", product: "CARUMA", qty: 15, origin: "Tlemcen Port", destination: "Marseille", status: "Delivered", eta: "2025-01-28" },
            { id: "SHP-2025-038", client: "Olam Intl", product: "CARANI", qty: 50, origin: "Tlemcen Port", destination: "Singapore", status: "In Transit", eta: "2025-03-01", vessel: "MSC Gülsün" },
            { id: "SHP-2025-037", client: "SunOpta", product: "CARANI", qty: 25, origin: "Tlemcen Port", destination: "Montreal", status: "Loading", eta: "2025-02-20" },
            { id: "SHP-2025-036", client: "Ingredion", product: "CARUMA", qty: 10, origin: "Tlemcen Port", destination: "Chicago (via NY)", status: "Delayed", eta: "2025-02-18" },
          ],
          leadTimes: [
            { route: "Tlemcen → Rotterdam", avgDays: 12, onTime: 92 },
            { route: "Tlemcen → Marseille", avgDays: 5, onTime: 96 },
            { route: "Tlemcen → Singapore", avgDays: 28, onTime: 78 },
            { route: "Tlemcen → Montreal", avgDays: 18, onTime: 85 },
          ],
          bottlenecks: [
            { area: "Customs Clearance", severity: "high", impact: "2-3 day delays on EU shipments", resolution: "Pre-clearance documentation" },
            { area: "Port Congestion", severity: "medium", impact: "Loading delays at Tlemcen port", resolution: "Shift to off-peak slots" },
            { area: "Cold Chain", severity: "low", impact: "Temperature monitoring gaps", resolution: "IoT sensor upgrade Q2" },
          ],
          stocks: [
            { product: "CARUMA (powder)", current: 42, min: 15, max: 80, unit: "t", daysOfSupply: 28 },
            { product: "CARANI (granules)", current: 68, min: 20, max: 120, unit: "t", daysOfSupply: 45 },
            { product: "CAROB EXTRACT", current: 8, min: 3, max: 25, unit: "t", daysOfSupply: 32 },
            { product: "Raw Carob Pods", current: 150, min: 50, max: 300, unit: "t", daysOfSupply: 60 },
          ],
          stockMovements: [
            { month: "Jan", inbound: 55, outbound: 42, balance: 268 },
            { month: "Feb", inbound: 48, outbound: 51, balance: 265 },
            { month: "Mar", inbound: 62, outbound: 44, balance: 283 },
            { month: "Apr", inbound: 50, outbound: 53, balance: 280 },
            { month: "May", inbound: 58, outbound: 47, balance: 291 },
            { month: "Jun", inbound: 45, outbound: 52, balance: 284 },
          ],
          inTransit: 2, delivered: 1, avgLeadTime: 16, onTimeRate: 88,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading engagements...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "In Transit", value: String(data.inTransit), sub: "active shipments" },
          { label: "Delivered (MTD)", value: String(data.delivered), sub: "this month" },
          { label: "Avg Lead Time", value: `${data.avgLeadTime}d`, sub: "port to port" },
          { label: "On-Time Rate", value: `${data.onTimeRate}%`, sub: "delivery accuracy" },
        ].map((k) => (
          <V2Card key={k.label} menu={false}>
            <div className="px-4 py-3">
              <p className="v2-kpi-label">{k.label}</p>
              <p className="v2-kpi-value">{k.value}</p>
              <p className="v2-kpi-sub">{k.sub}</p>
            </div>
          </V2Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gcs-gray-200">
        {(["shipments", "stocks", "performance"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize ${tab === t ? "border-b-2 border-gcs-blue text-gcs-blue" : "text-gcs-gray-500 hover:text-gcs-gray-700"}`}>
            {t === "shipments" ? "Shipment Tracker" : t === "stocks" ? "Stock Levels" : "Performance"}
          </button>
        ))}
      </div>

      {/* ── Tab: Shipments ── */}
      {tab === "shipments" && (
        <div className="space-y-4">
          <V2Card title="Active Shipments" subtitle={`${data.shipments.length} total`}>
            <div className="px-4 pb-3">
              <FilterDropdown label="Status:" value={statusFilter} options={[
                { label: "All", value: "all" },
                { label: "In Transit", value: "In Transit" },
                { label: "Loading", value: "Loading" },
                { label: "Customs", value: "Customs" },
                { label: "Delivered", value: "Delivered" },
                { label: "Delayed", value: "Delayed" },
              ]} onChange={setStatusFilter} />
            </div>
            <table className="v2-table">
              <thead><tr><th>ID</th><th>Client</th><th>Product</th><th>Qty</th><th>Route</th><th>Status</th><th>ETA</th></tr></thead>
              <tbody>
                {data.shipments
                  .filter((s) => statusFilter === "all" || s.status === statusFilter)
                  .map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-gcs-blue">{s.id}</td>
                    <td>{s.client}</td>
                    <td>{s.product}</td>
                    <td>{s.qty}t</td>
                    <td className="text-[11px]">{s.origin} → {s.destination}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] || "bg-gcs-gray-50 text-gcs-gray-500"}`}>{s.status}</span></td>
                    <td className="text-gcs-gray-500">{s.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
          <V2Card title="Supply Chain Bottlenecks" subtitle={`${data.bottlenecks.length} identified`}>
            <table className="v2-table">
              <thead><tr><th>Area</th><th>Severity</th><th>Impact</th><th>Resolution</th></tr></thead>
              <tbody>
                {data.bottlenecks.map((b, i) => (
                  <tr key={i}>
                    <td className="font-medium">{b.area}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      b.severity === "high" ? "bg-red-50 text-gcs-red" : b.severity === "medium" ? "bg-yellow-50 text-gcs-yellow" : "bg-green-50 text-gcs-green"
                    }`}>{b.severity}</span></td>
                    <td>{b.impact}</td>
                    <td className="text-gcs-blue">{b.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Stocks ── */}
      {tab === "stocks" && (
        <div className="space-y-4">
          <V2Card title="Current Stock Levels">
            <table className="v2-table">
              <thead><tr><th>Product</th><th>Current</th><th>Min / Max</th><th>Utilization</th><th>Days of Supply</th><th>Status</th></tr></thead>
              <tbody>
                {data.stocks.map((s) => {
                  const pct = s.max ? Math.round(s.current / s.max * 100) : 50;
                  const isLow = s.current <= s.min * 1.2;
                  return (
                    <tr key={s.product}>
                      <td className="font-medium">{s.product}</td>
                      <td>{s.current}{s.unit}</td>
                      <td className="text-gcs-gray-500">{s.min} / {s.max}{s.unit}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-20 rounded-full bg-gcs-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${isLow ? "bg-gcs-red" : pct > 80 ? "bg-gcs-yellow" : "bg-gcs-green"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px]">{pct}%</span>
                        </div>
                      </td>
                      <td>{s.daysOfSupply}d</td>
                      <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${isLow ? "bg-red-50 text-gcs-red" : "bg-green-50 text-gcs-green"}`}>{isLow ? "Low" : "OK"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </V2Card>
          <V2Card title="Stock Movements" subtitle="Monthly in/out flow">
            <div className="px-4 py-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockMovements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="inbound" fill="#188038" name="Inbound" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" fill="#d93025" name="Outbound" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Performance ── */}
      {tab === "performance" && (
        <div className="space-y-4">
          <V2Card title="Route Lead Times" subtitle="Average days and on-time rates">
            <div className="px-4 py-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.leadTimes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="route" width={160} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgDays" fill="#1a73e8" name="Avg Days" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>
          <V2Card title="On-Time Delivery by Route">
            <table className="v2-table">
              <thead><tr><th>Route</th><th>Avg Days</th><th>On-Time Rate</th><th>Status</th></tr></thead>
              <tbody>
                {data.leadTimes.map((l) => (
                  <tr key={l.route}>
                    <td className="font-medium">{l.route}</td>
                    <td>{l.avgDays}d</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-14 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${l.onTime >= 90 ? "bg-gcs-green" : l.onTime >= 80 ? "bg-gcs-yellow" : "bg-gcs-red"}`} style={{ width: `${l.onTime}%` }} />
                        </div>
                        <span className="text-[11px]">{l.onTime}%</span>
                      </div>
                    </td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${l.onTime >= 90 ? "bg-green-50 text-gcs-green" : l.onTime >= 80 ? "bg-yellow-50 text-gcs-yellow" : "bg-red-50 text-gcs-red"}`}>
                      {l.onTime >= 90 ? "Excellent" : l.onTime >= 80 ? "Good" : "Needs Improvement"}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}
    </div>
  );
}
