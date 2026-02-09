import type { CocoaPricePoint, MarketTrend, NewsItem } from "@/types";

// In-memory cache
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// Generate realistic cocoa price data (simulated)
// In production, replace with Yahoo Finance, commodities-api.com, etc.
function generateCocoaHistory(days: number): CocoaPricePoint[] {
  const points: CocoaPricePoint[] = [];
  const now = new Date();
  let price = 8500 + Math.random() * 1000; // ~$8500-9500/tonne

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Random walk with slight upward trend (cocoa has been rising)
    const change = (Math.random() - 0.48) * 150;
    price = Math.max(5000, Math.min(12000, price + change));
    points.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price),
      volume: Math.round(20000 + Math.random() * 15000),
    });
  }
  return points;
}

export async function getCocoaPrices(period: "1m" | "3m" | "1y" = "3m") {
  const cacheKey = `cocoa_${period}`;
  const cached = getCached<{ currentPrice: number; change24h: number; changePercent: number; high52w: number; low52w: number; history: CocoaPricePoint[] }>(cacheKey);
  if (cached) return cached;

  const days = period === "1m" ? 30 : period === "3m" ? 90 : 365;
  const history = generateCocoaHistory(days);

  const current = history[history.length - 1].price;
  const yesterday = history[history.length - 2]?.price || current;
  const yearData = generateCocoaHistory(365);

  const data = {
    currentPrice: current,
    change24h: current - yesterday,
    changePercent: ((current - yesterday) / yesterday) * 100,
    high52w: Math.max(...yearData.map((p) => p.price)),
    low52w: Math.min(...yearData.map((p) => p.price)),
    history,
  };

  setCache(cacheKey, data, 10 * 60 * 1000); // 10 min cache
  return data;
}

export function getMarketTrends(): MarketTrend[] {
  return [
    {
      sector: "Alimentaire",
      demandGrowth: 12.5,
      volume: 85000,
      growth: 12.5,
      marketSize: "$1.2B",
      topCountries: ["Europe", "USA", "Japon"],
    },
    {
      sector: "Alim. animale",
      demandGrowth: 8.3,
      volume: 42000,
      growth: 8.3,
      marketSize: "$450M",
      topCountries: ["Europe", "Brésil", "Chine"],
    },
    {
      sector: "Pharma",
      demandGrowth: 15.0,
      volume: 18000,
      growth: 15.0,
      marketSize: "$180M",
      topCountries: ["USA", "Allemagne", "Suisse"],
    },
    {
      sector: "Cosmétique",
      demandGrowth: 18.2,
      volume: 9500,
      growth: 18.2,
      marketSize: "$95M",
      topCountries: ["France", "Corée du Sud", "USA"],
    },
    {
      sector: "Subst. cacao",
      demandGrowth: 22.0,
      volume: 32000,
      growth: 22.0,
      marketSize: "$320M",
      topCountries: ["Espagne", "Italie", "Allemagne"],
    },
  ];
}

export function getCarobVsCacaoComparison() {
  return {
    carobPricePerTonne: 4500,
    cacaoPricePerTonne: 8800,
    savingsPercent: 49,
    advantages: [
      "Naturellement sucré — pas besoin d'ajout de sucre",
      "Sans caféine ni théobromine",
      "Riche en fibres et calcium",
      "Sans gluten certifié",
      "Production durable et faible en eau",
      "Prix 49% inférieur au cacao",
    ],
  };
}

export function generateNewsItems(): NewsItem[] {
  return [
    {
      title: "Le marché mondial de la caroube devrait atteindre $2.5B d'ici 2030",
      summary: "Selon les dernières analyses, la demande croissante pour les alternatives au cacao et les ingrédients sans gluten propulse le marché de la caroube à un taux de croissance annuel de 5.8%.",
      source: "Food Industry Report",
      date: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      sentiment: "positive",
    },
    {
      title: "Les prix du cacao atteignent un niveau record historique",
      summary: "La flambée des prix du cacao, due aux mauvaises récoltes en Afrique de l'Ouest, pousse les industriels à rechercher des alternatives comme la poudre de caroube.",
      source: "Bloomberg Commodities",
      date: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      sentiment: "positive",
    },
    {
      title: "L'UE renforce les normes d'importation pour les produits alimentaires",
      summary: "Les nouvelles réglementations européennes sur la traçabilité et les certifications biologiques impactent les exportateurs nord-africains. Les entreprises certifiées ISO et Bio sont avantagées.",
      source: "EU Food Safety Authority",
      date: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
      sentiment: "neutral",
    },
    {
      title: "Croissance de 18% du marché des aliments sans gluten en Asie",
      summary: "Le Japon et la Corée du Sud montrent une adoption rapide des produits sans gluten, ouvrant de nouvelles opportunités pour les ingrédients à base de caroube.",
      source: "Asian Food Market Intelligence",
      date: new Date(Date.now() - 12 * 24 * 3600000).toISOString(),
      sentiment: "positive",
    },
  ];
}
