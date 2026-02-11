"use client";

import { useEffect, useState } from "react";
import V2Card from "@/components/v2/V2Card";
import FilterDropdown from "@/components/v2/FilterDropdown";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";

/* ── types for this page ── */
interface ClientScore {
  client: string;
  country: string;
  ca: number;
  score: number;
  risk: "low" | "medium" | "high";
  trend: "up" | "stable" | "down";
}
interface PipelineDeal {
  client: string;
  product: string;
  tonnage: number;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
}
interface RFQ { id: string; client: string; product: string; qty: number; targetPrice: number; status: string; date: string; }
interface Reseller { name: string; country: string; volume: number; commission: number; status: string; }
interface CountryData { country: string; revenue: number; volume: number; }
interface ProductData { product: string; revenue: number; percentage: number; }

interface PortfolioData {
  scoring: ClientScore[];
  pipeline: PipelineDeal[];
  rfqs: RFQ[];
  resellers: Reseller[];
  byCountry: CountryData[];
  byProduct: ProductData[];
  pipelineTotal: number;
  weightedPipeline: number;
  activeClients: number;
  avgScore: number;
}

const COLORS = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#ab47bc", "#00acc1"];
const RISK_COLORS: Record<string, string> = { low: "text-gcs-green", medium: "text-gcs-yellow", high: "text-gcs-red" };
const RISK_BG: Record<string, string> = { low: "bg-green-50", medium: "bg-yellow-50", high: "bg-red-50" };

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"scoring" | "pipeline" | "pricing">("scoring");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/ventes").then((r) => r.json()),
      fetch("/api/commercial").then((r) => r.json()),
    ])
      .then(([ventes, commercial]) => {
        const scoring: ClientScore[] = (commercial.scoring || []).map((s: Record<string, unknown>) => ({
          client: s.client || s.name,
          country: s.country || "Algeria",
          ca: Number(s.ca || s.revenue || 0),
          score: Number(s.score || 0),
          risk: s.risk || (Number(s.score || 0) > 70 ? "low" : Number(s.score || 0) > 40 ? "medium" : "high"),
          trend: s.trend || "stable",
        }));
        const pipeline: PipelineDeal[] = (commercial.pipeline || ventes.pipeline || []).map((d: Record<string, unknown>) => ({
          client: d.client || d.name || "",
          product: d.product || "",
          tonnage: Number(d.tonnage || d.qty || 0),
          value: Number(d.value || d.amount || 0),
          stage: d.stage || d.status || "",
          probability: Number(d.probability || d.prob || 50),
          closeDate: String(d.closeDate || d.date || ""),
        }));
        const rfqs: RFQ[] = (commercial.rfqs || []).map((r: Record<string, unknown>) => ({
          id: String(r.id || ""),
          client: String(r.client || ""),
          product: String(r.product || ""),
          qty: Number(r.qty || r.quantity || 0),
          targetPrice: Number(r.targetPrice || r.price || 0),
          status: String(r.status || ""),
          date: String(r.date || ""),
        }));
        const resellers: Reseller[] = (ventes.resellers || []).map((r: Record<string, unknown>) => ({
          name: String(r.name || ""),
          country: String(r.country || ""),
          volume: Number(r.volume || 0),
          commission: Number(r.commission || 0),
          status: String(r.status || "active"),
        }));
        const byCountry: CountryData[] = (ventes.byCountry || []).map((c: Record<string, unknown>) => ({
          country: String(c.country || c.name || ""),
          revenue: Number(c.revenue || c.value || 0),
          volume: Number(c.volume || c.tons || 0),
        }));
        const byProduct: ProductData[] = (ventes.byProduct || []).map((p: Record<string, unknown>) => ({
          product: String(p.product || p.name || ""),
          revenue: Number(p.revenue || p.value || 0),
          percentage: Number(p.percentage || p.pct || 0),
        }));
        const pipelineTotal = pipeline.reduce((s, d) => s + d.value, 0);
        const weightedPipeline = pipeline.reduce((s, d) => s + d.value * d.probability / 100, 0);
        setData({
          scoring, pipeline, rfqs, resellers, byCountry, byProduct,
          pipelineTotal, weightedPipeline,
          activeClients: scoring.length,
          avgScore: scoring.length ? Math.round(scoring.reduce((s, c) => s + c.score, 0) / scoring.length) : 0,
        });
      })
      .catch((err) => {
        console.error("[V2 Portfolio] Failed to load data, using demo fallback:", err);
        setData({
          scoring: [
            { client: "Cargill EMEA", country: "Netherlands", ca: 450000, score: 87, risk: "low", trend: "up" },
            { client: "Barry Callebaut", country: "Switzerland", ca: 380000, score: 72, risk: "low", trend: "stable" },
            { client: "Olam Intl", country: "Singapore", ca: 220000, score: 65, risk: "medium", trend: "up" },
            { client: "SunOpta", country: "Canada", ca: 180000, score: 58, risk: "medium", trend: "down" },
            { client: "Naturex", country: "France", ca: 150000, score: 81, risk: "low", trend: "up" },
            { client: "Ingredion", country: "USA", ca: 120000, score: 44, risk: "high", trend: "down" },
          ],
          pipeline: [
            { client: "Cargill EMEA", product: "CARUMA", tonnage: 40, value: 180000, stage: "Negotiation", probability: 75, closeDate: "2025-03-15" },
            { client: "Barry Callebaut", product: "CAROB EXTRACT", tonnage: 10, value: 85000, stage: "Proposal", probability: 60, closeDate: "2025-04-01" },
            { client: "New Prospect APAC", product: "CARANI", tonnage: 100, value: 200000, stage: "Qualification", probability: 30, closeDate: "2025-05-20" },
            { client: "Naturex", product: "CARUMA", tonnage: 25, value: 112500, stage: "Closing", probability: 90, closeDate: "2025-02-28" },
          ],
          rfqs: [
            { id: "RFQ-041", client: "Cargill EMEA", product: "CARUMA", qty: 20, targetPrice: 4.2, status: "Pending", date: "2025-01-25" },
            { id: "RFQ-042", client: "Olam Intl", product: "CARANI", qty: 50, targetPrice: 1.8, status: "Quoted", date: "2025-01-22" },
          ],
          resellers: [
            { name: "MedTrade SRL", country: "Italy", volume: 85, commission: 5.5, status: "active" },
            { name: "IberiaFoods SA", country: "Spain", volume: 62, commission: 4.8, status: "active" },
          ],
          byCountry: [
            { country: "Netherlands", revenue: 450000, volume: 120 },
            { country: "Switzerland", revenue: 380000, volume: 95 },
            { country: "Singapore", revenue: 220000, volume: 110 },
            { country: "France", revenue: 150000, volume: 55 },
            { country: "Canada", revenue: 180000, volume: 90 },
          ],
          byProduct: [
            { product: "CARUMA", revenue: 720000, percentage: 48 },
            { product: "CARANI", revenue: 420000, percentage: 28 },
            { product: "CAROB EXTRACT", revenue: 360000, percentage: 24 },
          ],
          pipelineTotal: 577500,
          weightedPipeline: 378750,
          activeClients: 6,
          avgScore: 68,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading portfolio">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Clients", value: String(data.activeClients), sub: "accounts" },
          { label: "Pipeline Value", value: fmt(data.pipelineTotal), sub: `Weighted: ${fmt(data.weightedPipeline)}` },
          { label: "Avg Client Score", value: `${data.avgScore}/100`, sub: data.avgScore >= 65 ? "Healthy" : "At risk" },
          { label: "Open RFQs", value: String(data.rfqs.length), sub: "requests for quote" },
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
        {(["scoring", "pipeline", "pricing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-gcs-blue text-gcs-blue"
                : "text-gcs-gray-500 hover:text-gcs-gray-700"
            }`}
          >
            {t === "scoring" ? "Client Scoring" : t === "pipeline" ? "Deal Pipeline" : "Pricing & RFQs"}
          </button>
        ))}
      </div>

      {/* ── Tab: Client Scoring ── */}
      {tab === "scoring" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Scoring table */}
          <div className="lg:col-span-2">
            <V2Card title="Client Portfolio Scoring" subtitle={`${data.scoring.length} accounts`}>
              <div className="px-4 pb-3">
                <FilterDropdown
                  label="Risk:"
                  value={filter}
                  options={[
                    { label: "All", value: "all" },
                    { label: "Low", value: "low" },
                    { label: "Medium", value: "medium" },
                    { label: "High", value: "high" },
                  ]}
                  onChange={setFilter}
                />
              </div>
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Client</th><th>Country</th><th>Revenue</th><th>Score</th><th>Risk</th><th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scoring
                    .filter((c) => filter === "all" || c.risk === filter)
                    .map((c) => (
                      <tr key={c.client}>
                        <td className="font-medium">{c.client}</td>
                        <td>{c.country}</td>
                        <td>{fmt(c.ca)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 rounded-full bg-gcs-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.score >= 70 ? "bg-gcs-green" : c.score >= 40 ? "bg-gcs-yellow" : "bg-gcs-red"}`}
                                style={{ width: `${c.score}%` }}
                              />
                            </div>
                            <span className="text-[11px]">{c.score}</span>
                          </div>
                        </td>
                        <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${RISK_BG[c.risk]} ${RISK_COLORS[c.risk]}`}>{c.risk}</span></td>
                        <td>{c.trend === "up" ? "↑" : c.trend === "down" ? "↓" : "→"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </V2Card>
          </div>
          {/* Side charts */}
          <div className="space-y-4">
            <V2Card title="Revenue by Product">
              <div className="px-4 py-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byProduct} dataKey="revenue" nameKey="product" cx="50%" cy="50%" outerRadius={70} label={({ product, percentage }) => `${product} ${percentage}%`}>
                      {data.byProduct.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </V2Card>
            <V2Card title="Revenue by Country">
              <div className="px-4 py-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCountry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="revenue" fill="#1a73e8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </V2Card>
          </div>
        </div>
      )}

      {/* ── Tab: Deal Pipeline ── */}
      {tab === "pipeline" && (
        <div className="space-y-4">
          <V2Card title="Deal Pipeline" subtitle={`${data.pipeline.length} active deals · ${fmt(data.pipelineTotal)} total`}>
            <table className="v2-table">
              <thead>
                <tr>
                  <th>Client</th><th>Product</th><th>Tonnage</th><th>Value</th><th>Stage</th><th>Probability</th><th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {data.pipeline.map((d, i) => (
                  <tr key={i}>
                    <td className="font-medium">{d.client}</td>
                    <td>{d.product}</td>
                    <td>{d.tonnage}t</td>
                    <td>{fmt(d.value)}</td>
                    <td>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        d.stage === "Closing" ? "bg-green-50 text-gcs-green" :
                        d.stage === "Negotiation" ? "bg-blue-50 text-gcs-blue" :
                        d.stage === "Proposal" ? "bg-yellow-50 text-gcs-yellow" :
                        "bg-gcs-gray-50 text-gcs-gray-500"
                      }`}>{d.stage}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-gcs-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gcs-blue" style={{ width: `${d.probability}%` }} />
                        </div>
                        <span className="text-[11px]">{d.probability}%</span>
                      </div>
                    </td>
                    <td className="text-gcs-gray-500">{d.closeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
          {/* Resellers */}
          <V2Card title="Reseller Network" subtitle={`${data.resellers.length} active partners`}>
            <table className="v2-table">
              <thead><tr><th>Partner</th><th>Country</th><th>Volume (t)</th><th>Commission %</th><th>Status</th></tr></thead>
              <tbody>
                {data.resellers.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium">{r.name}</td>
                    <td>{r.country}</td>
                    <td>{r.volume}</td>
                    <td>{r.commission}%</td>
                    <td><span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-gcs-green">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
        </div>
      )}

      {/* ── Tab: Pricing & RFQs ── */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <V2Card title="Active RFQs" subtitle={`${data.rfqs.length} open requests`}>
            <table className="v2-table">
              <thead><tr><th>ID</th><th>Client</th><th>Product</th><th>Qty (t)</th><th>Target Price</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.rfqs.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gcs-blue">{r.id}</td>
                    <td>{r.client}</td>
                    <td>{r.product}</td>
                    <td>{r.qty}</td>
                    <td>${r.targetPrice.toFixed(2)}/kg</td>
                    <td>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        r.status === "Pending" ? "bg-yellow-50 text-gcs-yellow" :
                        r.status === "Quoted" ? "bg-blue-50 text-gcs-blue" :
                        "bg-gcs-gray-50 text-gcs-gray-500"
                      }`}>{r.status}</span>
                    </td>
                    <td className="text-gcs-gray-500">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </V2Card>
          {/* Pricing matrix */}
          <V2Card title="Product Pricing Matrix">
            <table className="v2-table">
              <thead><tr><th>Product</th><th>Base Price</th><th>Min Volume</th><th>Discount Tier</th><th>Revenue Share</th></tr></thead>
              <tbody>
                <tr><td className="font-medium">CARUMA (powder)</td><td>$4.50/kg</td><td>5t</td><td>10t → -5%, 50t → -10%</td><td>{data.byProduct[0]?.percentage || 48}%</td></tr>
                <tr><td className="font-medium">CARANI (granules)</td><td>$2.00/kg</td><td>10t</td><td>25t → -5%, 100t → -12%</td><td>{data.byProduct[1]?.percentage || 28}%</td></tr>
                <tr><td className="font-medium">CAROB EXTRACT</td><td>$8.50/kg</td><td>1t</td><td>5t → -3%, 20t → -8%</td><td>{data.byProduct[2]?.percentage || 24}%</td></tr>
              </tbody>
            </table>
          </V2Card>
        </div>
      )}
    </div>
  );
}
