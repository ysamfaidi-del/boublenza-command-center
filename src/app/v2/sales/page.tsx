"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users, TrendingUp, Target, Mail, Calendar, Phone, Globe, Award,
  ArrowRight, ChevronRight, Loader2, AlertCircle, CheckCircle,
  ExternalLink, Plus, Filter, BarChart3, PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import V2Card from "@/components/v2/V2Card";
import { cn } from "@/lib/utils";
import type {
  V2SalesData, V2SalesRep, V2Deal, V2Lead, V2Activity,
  V2PipelineSummary, V2SalesForecast, V2GmailMessage, V2CalendarEvent, DealStage,
} from "@/types/v2";

/* ── Constants ── */
const TABS = ["Pipeline", "Team", "Leads", "Forecast", "Gmail & Calendar"] as const;
type TabName = (typeof TABS)[number];

const STAGE_LABELS: Record<DealStage, string> = {
  prospection: "Prospection",
  qualification: "Qualification",
  proposition: "Proposition",
  negociation: "Négociation",
  closing: "Closing",
  won: "Won ✓",
  lost: "Lost ✗",
};

const STAGE_COLORS: Record<DealStage, string> = {
  prospection: "#80868b",
  qualification: "#f9ab00",
  proposition: "#1a73e8",
  negociation: "#174ea6",
  closing: "#188038",
  won: "#137333",
  lost: "#d93025",
};

const ACTIVE_STAGES: DealStage[] = ["prospection", "qualification", "proposition", "negociation", "closing"];

const SOURCE_COLORS = ["#1a73e8", "#f9ab00", "#188038", "#d93025"];

/* ── Helper ── */
const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

export default function V2SalesPage() {
  const [tab, setTab] = useState<TabName>("Pipeline");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<V2SalesData | null>(null);
  const [filterRep, setFilterRep] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");

  // Gmail & Calendar state
  const [gmailMessages, setGmailMessages] = useState<V2GmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<V2CalendarEvent[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>("");
  const [gmailDemo, setGmailDemo] = useState(true);

  useEffect(() => {
    fetch("/api/v2/sales")
      .then((r) => r.json())
      .then((d: V2SalesData) => {
        setData(d);
        if (d.reps.length > 0) setSelectedRep(d.reps[0].id);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Fetch Gmail & Calendar when rep changes
  useEffect(() => {
    if (!selectedRep) return;
    Promise.all([
      fetch(`/api/v2/sales/gmail?repId=${selectedRep}`).then((r) => r.json()),
      fetch(`/api/v2/sales/calendar?repId=${selectedRep}`).then((r) => r.json()),
    ])
      .then(([gm, cal]) => {
        setGmailMessages(gm.messages || []);
        setGmailDemo(gm.demo ?? true);
        setCalendarEvents(cal.events || []);
      })
      .catch(() => {});
  }, [selectedRep]);

  /* ── Filtered data ── */
  const filteredDeals = useMemo(() => {
    if (!data) return [];
    return data.deals.filter((d) => {
      if (filterRep !== "all" && d.repId !== filterRep) return false;
      if (filterProduct !== "all" && d.product !== filterProduct) return false;
      return true;
    });
  }, [data, filterRep, filterProduct]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    return data.leads.filter((l) => {
      if (filterRep !== "all" && l.repId !== filterRep) return false;
      if (leadStatusFilter !== "all" && l.status !== leadStatusFilter) return false;
      return true;
    });
  }, [data, filterRep, leadStatusFilter]);

  /* ── Pipeline funnel data ── */
  const funnelData = useMemo(() => {
    if (!data) return [];
    return ACTIVE_STAGES.map((stage) => {
      const stageDeals = filteredDeals.filter((d) => d.stage === stage);
      return {
        name: STAGE_LABELS[stage],
        value: stageDeals.reduce((s, d) => s + d.value, 0),
        count: stageDeals.length,
        fill: STAGE_COLORS[stage],
      };
    });
  }, [data, filteredDeals]);

  /* ── Lead source breakdown ── */
  const leadSourceData = useMemo(() => {
    if (!data) return [];
    const sources: Record<string, number> = {};
    filteredLeads.forEach((l) => { sources[l.source] = (sources[l.source] || 0) + 1; });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [data, filteredLeads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gcs-blue" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 rounded-lg border border-gcs-red bg-red-50 px-4 py-3 text-xs text-gcs-red">
          <AlertCircle className="h-4 w-4" /> Failed to load sales data
        </div>
      </div>
    );
  }

  const pipeline = data.pipeline;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gcs-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-gcs-blue" />
            Sales Pipeline & CRM
          </h1>
          <p className="text-xs text-gcs-gray-500">Pipeline tracking, forecasts, team performance, leads, Gmail & Calendar</p>
        </div>
        {/* Rep Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            className="rounded-full border border-gcs-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gcs-gray-700 outline-none focus:border-gcs-blue"
          >
            <option value="all">All Reps</option>
            {data.reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-gcs-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-xs font-medium border-b-[3px] transition-colors",
              tab === t
                ? "border-gcs-blue text-gcs-blue"
                : "border-transparent text-gcs-gray-500 hover:text-gcs-gray-700 hover:bg-gcs-gray-50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 1: PIPELINE                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "Pipeline" && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Total Pipeline", value: fmt(pipeline.totalPipeline), icon: BarChart3 },
              { label: "Weighted Value", value: fmt(pipeline.weightedValue), icon: TrendingUp },
              { label: "Win Rate", value: `${pipeline.winRate}%`, icon: Award },
              { label: "Avg Deal Size", value: fmt(pipeline.avgDealSize), icon: Target },
              { label: "Avg Cycle", value: `${pipeline.avgCycleDays}d`, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-gcs-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-gcs-blue" />
                  <span className="text-[10px] text-gcs-gray-500">{label}</span>
                </div>
                <p className="text-lg font-semibold text-gcs-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Product filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gcs-gray-500" />
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="rounded-full border border-gcs-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gcs-gray-700 outline-none focus:border-gcs-blue"
            >
              <option value="all">All Products</option>
              <option value="CARUMA">CARUMA</option>
              <option value="CARANI">CARANI</option>
              <option value="CAROB_EXTRACT">Carob Extract</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Funnel Chart */}
            <V2Card title="Pipeline Funnel" subtitle="Deal value by stage">
              <div className="h-72 px-4 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill="#3c4043" stroke="none" fontSize={11} formatter={(v: string) => v} dataKey="name" />
                      <LabelList position="center" fill="#fff" stroke="none" fontSize={10} formatter={(v: number) => fmt(v)} dataKey="value" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </V2Card>

            {/* Kanban Mini View */}
            <V2Card title="Pipeline Board" subtitle={`${filteredDeals.filter(d => !["won","lost"].includes(d.stage)).length} active deals`}>
              <div className="px-4 py-2 space-y-2 max-h-72 overflow-y-auto">
                {ACTIVE_STAGES.map((stage) => {
                  const stageDeals = filteredDeals.filter((d) => d.stage === stage);
                  if (stageDeals.length === 0) return null;
                  return (
                    <div key={stage}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                        <span className="text-[10px] font-semibold text-gcs-gray-700">{STAGE_LABELS[stage]}</span>
                        <span className="text-[10px] text-gcs-gray-400">{stageDeals.length}</span>
                      </div>
                      {stageDeals.map((d) => (
                        <div key={d.id} className="ml-4 flex items-center justify-between rounded border border-gcs-gray-100 px-3 py-1.5 mb-1 hover:bg-gcs-gray-50">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-gcs-gray-900 truncate">{d.title}</p>
                            <p className="text-[10px] text-gcs-gray-500">{d.repName} · {d.product}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-[11px] font-semibold text-gcs-gray-900">{fmt(d.value)}</p>
                            <p className="text-[9px] text-gcs-gray-400">{d.probability}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </V2Card>
          </div>

          {/* Deals Table */}
          <V2Card title="All Deals" subtitle={`${filteredDeals.length} deals`}>
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Product</th>
                    <th>Rep</th>
                    <th>Stage</th>
                    <th>Value</th>
                    <th>Prob.</th>
                    <th>Weighted</th>
                    <th>Expected Close</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.title}</td>
                      <td>{d.product}</td>
                      <td>{d.repName}</td>
                      <td>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: STAGE_COLORS[d.stage] }}
                        >
                          {STAGE_LABELS[d.stage]}
                        </span>
                      </td>
                      <td>{fmt(d.value)}</td>
                      <td>{d.probability}%</td>
                      <td>{fmt(Math.round(d.value * d.probability / 100))}</td>
                      <td>{d.stage === "won" ? `Won ${fmtDate(d.closedAt)}` : d.stage === "lost" ? `Lost ${fmtDate(d.closedAt)}` : fmtDate(d.expectedClose)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V2Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 2: TEAM                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "Team" && (
        <div className="space-y-4">
          {/* Rep Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.reps.map((rep) => (
              <V2Card key={rep.id}>
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gcs-blue flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{rep.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gcs-gray-900">{rep.name}</p>
                      <p className="text-[10px] text-gcs-gray-500">{rep.role} · {rep.territory}</p>
                    </div>
                    {rep.googleConnected && (
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-gcs-green">
                        <CheckCircle className="h-3 w-3" /> Google Connected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gcs-blue">{rep.quotaAttainment}%</p>
                      <p className="text-[9px] text-gcs-gray-500">Quota</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gcs-green">{rep.dealsWon}</p>
                      <p className="text-[9px] text-gcs-gray-500">Won</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gcs-gray-700">{fmt(rep.pipelineValue)}</p>
                      <p className="text-[9px] text-gcs-gray-500">Pipeline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gcs-gray-700">{rep.activitiesCount}</p>
                      <p className="text-[9px] text-gcs-gray-500">Activities</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-gcs-gray-500">
                    <Mail className="h-3 w-3" /> {rep.email}
                    <span className="mx-1">·</span>
                    <Phone className="h-3 w-3" /> {rep.phone}
                  </div>

                  {/* Quota progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] text-gcs-gray-500 mb-0.5">
                      <span>Quota progress</span>
                      <span>{fmt(rep.quota * rep.quotaAttainment / 100)} / {fmt(rep.quota)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gcs-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gcs-blue transition-all"
                        style={{ width: `${Math.min(rep.quotaAttainment, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </V2Card>
            ))}
          </div>

          {/* Quota Comparison Chart */}
          <V2Card title="Quota vs Actual" subtitle="Revenue comparison by rep">
            <div className="h-64 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.reps.map((r) => ({
                  name: r.name.split(" ")[0],
                  quota: r.quota,
                  actual: Math.round(r.quota * r.quotaAttainment / 100),
                  pipeline: r.pipelineValue,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#3c4043" }} />
                  <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 10, fill: "#80868b" }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="quota" fill="#e8eaed" name="Quota" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#1a73e8" name="Won Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pipeline" fill="#f9ab00" name="Pipeline" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </V2Card>

          {/* Recent Activities */}
          <V2Card title="Recent Activities" subtitle="Last 10 actions across the team">
            <div className="px-4 py-2 space-y-1.5">
              {data.activities.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gcs-gray-100 px-3 py-2 hover:bg-gcs-gray-50">
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px]",
                    a.type === "call" ? "bg-blue-50 text-gcs-blue" :
                    a.type === "email" ? "bg-green-50 text-gcs-green" :
                    a.type === "meeting" ? "bg-yellow-50 text-gcs-yellow" :
                    "bg-gcs-gray-50 text-gcs-gray-500",
                  )}>
                    {a.type === "call" ? "📞" : a.type === "email" ? "✉️" : a.type === "meeting" ? "🤝" : a.type === "task" ? "✓" : "📝"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gcs-gray-900 truncate">{a.subject}</p>
                    <p className="text-[10px] text-gcs-gray-500">{a.repName}{a.leadCompany ? ` · ${a.leadCompany}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.completed ? (
                      <CheckCircle className="h-3.5 w-3.5 text-gcs-green" />
                    ) : (
                      <span className="text-[9px] text-gcs-gray-400">{fmtDate(a.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </V2Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 3: LEADS                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "Leads" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gcs-gray-500" />
            <select
              value={leadStatusFilter}
              onChange={(e) => setLeadStatusFilter(e.target.value)}
              className="rounded-full border border-gcs-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gcs-gray-700 outline-none focus:border-gcs-blue"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leads Table */}
            <div className="lg:col-span-2">
              <V2Card title="Lead Database" subtitle={`${filteredLeads.length} leads`}>
                <div className="overflow-x-auto">
                  <table className="v2-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Rep</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((l) => (
                        <tr key={l.id}>
                          <td className="font-medium">{l.company}</td>
                          <td>{l.contactName}</td>
                          <td className="text-gcs-blue">{l.contactEmail}</td>
                          <td>{l.contactPhone || "—"}</td>
                          <td>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gcs-gray-100 px-2 py-0.5 text-[10px] capitalize">
                              {l.source === "trade_show" ? "Trade Show" : l.source}
                            </span>
                          </td>
                          <td>
                            <span className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                              l.status === "qualified" ? "bg-blue-50 text-gcs-blue" :
                              l.status === "converted" ? "bg-green-50 text-gcs-green" :
                              l.status === "lost" ? "bg-red-50 text-gcs-red" :
                              l.status === "contacted" ? "bg-yellow-50 text-yellow-700" :
                              "bg-gcs-gray-100 text-gcs-gray-700"
                            )}>
                              {l.status}
                            </span>
                          </td>
                          <td>{l.repName.split(" ")[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </V2Card>
            </div>

            {/* Lead Source Breakdown */}
            <div>
              <V2Card title="Lead Sources" subtitle="Breakdown by origin">
                <div className="h-56 px-4 py-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }: { name: string; value: number }) => `${name} (${value})`} labelLine={false} fontSize={10}>
                        {leadSourceData.map((_, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </V2Card>

              {/* Lead Stats */}
              <div className="mt-4 space-y-2">
                {["new", "contacted", "qualified", "converted", "lost"].map((status) => {
                  const count = filteredLeads.filter((l) => l.status === status).length;
                  return (
                    <div key={status} className="flex items-center justify-between rounded-lg border border-gcs-gray-200 px-3 py-2">
                      <span className="text-[11px] font-medium text-gcs-gray-700 capitalize">{status}</span>
                      <span className="text-[11px] font-bold text-gcs-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 4: FORECAST                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "Forecast" && (
        <div className="space-y-4">
          {/* Forecast KPI Strip */}
          {(() => {
            const teamForecasts = data.forecasts.filter((f) => !f.repId);
            const q1 = teamForecasts.find((f) => f.period === "2025-Q1");
            return (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Weighted Forecast", value: fmt(q1?.weighted || 0), color: "text-gcs-blue" },
                  { label: "Best Case", value: fmt(q1?.bestCase || 0), color: "text-gcs-green" },
                  { label: "Worst Case", value: fmt(q1?.worstCase || 0), color: "text-gcs-red" },
                  { label: "AI-Adjusted", value: fmt(q1?.aiAdjusted || 0), color: "text-purple-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border border-gcs-gray-200 bg-white px-4 py-3">
                    <p className="text-[10px] text-gcs-gray-500">{label}</p>
                    <p className={cn("text-xl font-semibold", color)}>{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Forecast Line Chart */}
          <V2Card title="Revenue Forecast" subtitle="Quarterly projections — 4 scenarios">
            <div className="h-72 px-4 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.forecasts.filter((f) => !f.repId)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#3c4043" }} />
                  <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 10, fill: "#80868b" }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="weighted" stroke="#1a73e8" strokeWidth={2} name="Weighted" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bestCase" stroke="#188038" strokeWidth={2} name="Best Case" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="worstCase" stroke="#d93025" strokeWidth={2} name="Worst Case" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="aiAdjusted" stroke="#7c3aed" strokeWidth={2} name="AI-Adjusted" strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </V2Card>

          {/* Forecast by Rep Table */}
          <V2Card title="Forecast by Rep" subtitle="Quarterly breakdown per commercial">
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Rep</th>
                    <th>Period</th>
                    <th>Weighted</th>
                    <th>Best Case</th>
                    <th>Worst Case</th>
                    <th>AI-Adjusted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecasts.filter((f) => f.repId).map((f, i) => (
                    <tr key={i}>
                      <td className="font-medium">{f.repName}</td>
                      <td>{f.period}</td>
                      <td className="text-gcs-blue font-medium">{fmt(f.weighted)}</td>
                      <td className="text-gcs-green">{fmt(f.bestCase)}</td>
                      <td className="text-gcs-red">{fmt(f.worstCase)}</td>
                      <td className="text-purple-600">{fmt(f.aiAdjusted || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V2Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 5: GMAIL & CALENDAR                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "Gmail & Calendar" && (
        <div className="space-y-4">
          {/* Rep selector + connect button */}
          <div className="flex items-center gap-3">
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="rounded-full border border-gcs-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gcs-gray-700 outline-none focus:border-gcs-blue"
            >
              {data.reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {!data.reps.find((r) => r.id === selectedRep)?.googleConnected && (
              <a
                href={`/api/auth/google?repId=${selectedRep}`}
                className="flex items-center gap-1.5 rounded-lg bg-gcs-blue px-4 py-1.5 text-xs font-medium text-white hover:bg-gcs-blue-dark"
              >
                <ExternalLink className="h-3 w-3" />
                Connect Google Account
              </a>
            )}

            {gmailDemo && (
              <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                Demo Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gmail */}
            <V2Card title="Recent Emails" subtitle={`${gmailMessages.length} messages`}>
              <div className="px-4 py-2 space-y-1.5 max-h-96 overflow-y-auto">
                {gmailMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 hover:bg-gcs-gray-50 cursor-pointer",
                      msg.unread ? "border-gcs-blue bg-blue-50/30" : "border-gcs-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-[11px] truncate", msg.unread ? "font-semibold text-gcs-gray-900" : "font-medium text-gcs-gray-700")}>
                        {msg.from.split("<")[0].trim()}
                      </span>
                      <span className="text-[9px] text-gcs-gray-400 flex-shrink-0 ml-2">{fmtDate(msg.date)}</span>
                    </div>
                    <p className={cn("text-[11px] truncate", msg.unread ? "font-medium text-gcs-gray-900" : "text-gcs-gray-700")}>{msg.subject}</p>
                    <p className="text-[10px] text-gcs-gray-500 truncate mt-0.5">{msg.snippet}</p>
                  </div>
                ))}
              </div>
            </V2Card>

            {/* Calendar */}
            <V2Card title="Upcoming Events" subtitle={`${calendarEvents.length} events in next 14 days`}>
              <div className="px-4 py-2 space-y-1.5 max-h-96 overflow-y-auto">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="rounded-lg border border-gcs-gray-100 px-3 py-2 hover:bg-gcs-gray-50">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Calendar className="h-3 w-3 text-gcs-blue flex-shrink-0" />
                      <span className="text-[11px] font-medium text-gcs-gray-900 truncate">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gcs-gray-500 ml-5">
                      <span>{fmtDate(ev.start)} · {new Date(ev.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      {ev.location && (
                        <span className="flex items-center gap-0.5">
                          <Globe className="h-2.5 w-2.5" /> {ev.location}
                        </span>
                      )}
                    </div>
                    {ev.attendees.length > 0 && (
                      <div className="flex items-center gap-1 ml-5 mt-0.5">
                        <Users className="h-2.5 w-2.5 text-gcs-gray-400" />
                        <span className="text-[9px] text-gcs-gray-400 truncate">{ev.attendees.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Create Event placeholder */}
                <button
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gcs-gray-200 px-3 py-3 text-xs text-gcs-gray-500 hover:border-gcs-blue hover:text-gcs-blue transition-colors"
                  onClick={() => {
                    if (data.reps.find((r) => r.id === selectedRep)?.googleConnected) {
                      // Would open a create event modal — placeholder
                      alert("Create event functionality — connect Google OAuth first in production");
                    } else {
                      alert("Connect your Google account first to create events");
                    }
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Meeting
                </button>
              </div>
            </V2Card>
          </div>
        </div>
      )}
    </div>
  );
}
