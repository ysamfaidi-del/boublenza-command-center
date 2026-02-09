"use client";

import { useEffect, useState } from "react";
import { Newspaper, Loader2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/types";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-green-50 text-green-700 border-green-200",
  negative: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-gray-50 text-gray-600 border-gray-200",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positif",
  negative: "Négatif",
  neutral: "Neutre",
};

export default function NewsDigest() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/news")
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-header">
        <Newspaper className="mr-2 inline h-5 w-5 text-purple-600" />
        Veille marché — Dernières actualités
      </h3>
      <div className="mt-4 space-y-4">
        {news.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    SENTIMENT_STYLES[item.sentiment] || SENTIMENT_STYLES.neutral
                  )}
                >
                  {SENTIMENT_LABELS[item.sentiment] || "Neutre"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
