import type { CocoaPricePoint, NewsItem } from "@/types";
import { getCocoaPrices, generateNewsItems } from "./market-data";

// ── Cache (reuse pattern from market-data.ts) ──
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ══════════════════════════════════════════════════════
// A) FRED API — Real Cocoa Prices
// ══════════════════════════════════════════════════════

export async function fetchRealCocoaPrices(
  period: "1m" | "3m" | "1y" = "3m"
): Promise<{ currentPrice: number; change24h: number; changePercent: number; high52w: number; low52w: number; history: CocoaPricePoint[] }> {
  const cacheKey = `cocoa_real_${period}`;
  const cached = getCached<{ currentPrice: number; change24h: number; changePercent: number; high52w: number; low52w: number; history: CocoaPricePoint[] }>(cacheKey);
  if (cached) return cached;

  const fredKey = process.env.FRED_API_KEY;
  if (!fredKey) {
    // No FRED key — fallback to simulated
    return getCocoaPrices(period);
  }

  try {
    const days = period === "1m" ? 60 : period === "3m" ? 120 : 400;
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=PCOCOUSDM&api_key=${fredKey}&file_type=json&observation_start=${startDate}&sort_order=asc`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    const json = await res.json();

    if (!json.observations || json.observations.length === 0) {
      return getCocoaPrices(period);
    }

    const history: CocoaPricePoint[] = json.observations
      .filter((obs: { value: string }) => obs.value !== ".")
      .map((obs: { date: string; value: string }) => ({
        date: obs.date,
        price: Math.round(parseFloat(obs.value)),
        volume: Math.round(20000 + Math.random() * 15000),
      }));

    if (history.length < 2) return getCocoaPrices(period);

    const current = history[history.length - 1].price;
    const prev = history[history.length - 2]?.price || current;

    const data = {
      currentPrice: current,
      change24h: current - prev,
      changePercent: ((current - prev) / prev) * 100,
      high52w: Math.max(...history.map((p) => p.price)),
      low52w: Math.min(...history.map((p) => p.price)),
      history,
    };

    setCache(cacheKey, data, 30 * 60 * 1000); // 30 min
    return data;
  } catch {
    return getCocoaPrices(period);
  }
}

// ══════════════════════════════════════════════════════
// B) Frankfurter API — Real Forex Rates
// ══════════════════════════════════════════════════════

export interface ForexResult {
  current: Record<string, number>;
  history: { date: string; USD: number; GBP: number; DZD: number }[];
  date: string;
}

const DEMO_FOREX: ForexResult = {
  current: { USD: 1.085, GBP: 0.843, DZD: 146.5 },
  history: Array.from({ length: 90 }, (_, i) => {
    const d = new Date(Date.now() - (89 - i) * 86400000);
    return {
      date: d.toISOString().split("T")[0],
      USD: 1.08 + Math.sin(i * 0.07) * 0.02,
      GBP: 0.84 + Math.sin(i * 0.05) * 0.01,
      DZD: 146 + Math.sin(i * 0.04) * 2,
    };
  }),
  date: new Date().toISOString().split("T")[0],
};

export async function fetchForexRates(): Promise<ForexResult> {
  const cacheKey = "forex_real";
  const cached = getCached<ForexResult>(cacheKey);
  if (cached) return cached;

  try {
    // Current rates
    const currentRes = await fetch(
      "https://api.frankfurter.dev/latest?base=EUR&symbols=USD,GBP,DZD",
      { next: { revalidate: 900 } }
    );
    const currentJson = await currentRes.json();

    if (!currentJson.rates) return DEMO_FOREX;

    // Historical (last 90 days)
    const from = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    const to = new Date().toISOString().split("T")[0];
    const histRes = await fetch(
      `https://api.frankfurter.dev/${from}..${to}?base=EUR&symbols=USD,GBP,DZD`,
      { next: { revalidate: 900 } }
    );
    const histJson = await histRes.json();

    const history = Object.entries(histJson.rates || {})
      .map(([date, rates]) => ({
        date,
        USD: (rates as Record<string, number>).USD || 1.08,
        GBP: (rates as Record<string, number>).GBP || 0.84,
        DZD: (rates as Record<string, number>).DZD || 146,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const data: ForexResult = {
      current: currentJson.rates,
      history,
      date: currentJson.date || to,
    };

    setCache(cacheKey, data, 15 * 60 * 1000); // 15 min
    return data;
  } catch {
    return DEMO_FOREX;
  }
}

// ══════════════════════════════════════════════════════
// C) AI-Generated Market News
// ══════════════════════════════════════════════════════

export async function generateRealMarketNews(
  cocoaPrice: number,
  forexRates: Record<string, number>
): Promise<NewsItem[]> {
  const cacheKey = "market_news_ai";
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  if (!process.env.ANTHROPIC_API_KEY) {
    return generateNewsItems();
  }

  try {
    const { generateText } = await import("ai");
    const { anthropic } = await import("@ai-sdk/anthropic");

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `Tu es un analyste marché spécialisé dans les matières premières agricoles.
Génère exactement 4 brèves actualités marché en français pertinentes pour une entreprise algérienne de transformation de caroube (Boublenza SARL à Tlemcen).

Contexte marché actuel :
- Prix cacao : ${cocoaPrice} USD/tonne
- EUR/USD : ${forexRates.USD || 1.08}
- EUR/DZD : ${forexRates.DZD || 146}

Retourne UNIQUEMENT un JSON array (pas de markdown) avec 4 objets :
[{"title":"...","summary":"...","source":"...","date":"${new Date().toISOString()}","sentiment":"positive|neutral|negative"}]

Les news doivent être réalistes, variées (1 positive, 1 neutre, 1 positive, 1 négative) et pertinentes pour l'industrie de la caroube et l'export depuis l'Algérie.`,
      maxOutputTokens: 1000,
    });

    const news: NewsItem[] = JSON.parse(result.text);
    if (Array.isArray(news) && news.length > 0) {
      setCache(cacheKey, news, 60 * 60 * 1000); // 1 hour
      return news;
    }
    return generateNewsItems();
  } catch {
    return generateNewsItems();
  }
}
