"use client";

import { useEffect, useState } from "react";
import RevenueSummaryStrip from "@/components/v2/RevenueSummaryStrip";
import RevenueTrendChart from "@/components/v2/RevenueTrendChart";
import TopMoversTable from "@/components/v2/TopMoversTable";
import AskAIBar from "@/components/v2/AskAIBar";
import V2RightSidebar from "@/components/layout/V2RightSidebar";
import type { V2OverviewData } from "@/types/v2";

export default function V2OverviewPage() {
  const [data, setData] = useState<V2OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/overview")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("[V2 Overview] Failed to load data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" role="status" aria-label="Loading overview">
        <div className="text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gcs-gray-200 border-t-gcs-blue" />
          <p className="mt-3 text-xs text-gcs-gray-500">Loading overview...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Revenue Summary KPI Strip */}
        <RevenueSummaryStrip data={data.revenueSummary} />

        {/* Revenue Trend Chart */}
        <RevenueTrendChart data={data.revenueTrend} />

        {/* Ask AI Bar */}
        <AskAIBar />

        {/* Top Movers */}
        <TopMoversTable movers={data.topMovers} />
      </main>

      {/* Right Sidebar */}
      <V2RightSidebar
        todos={data.todos}
        recentLinks={data.recentLinks}
        anomaliesCount={data.anomaliesCount}
        news={data.news.map((n) => ({ title: n.title, source: n.source }))}
      />
    </div>
  );
}
