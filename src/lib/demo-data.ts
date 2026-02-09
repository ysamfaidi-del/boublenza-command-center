// ── Demo data used as fallback when database is unavailable (Vercel serverless) ──

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return MONTHS[d.getMonth()];
}

function last12Months() {
  return Array.from({ length: 12 }, (_, i) => monthsAgo(11 - i));
}

const months12 = last12Months();

// ── Dashboard ──
export const demoDashboard = {
  kpis: {
    monthlyRevenue: 287500,
    monthlyRevenueChange: 12.3,
    totalProduction: 32400,
    productionChange: 8.7,
    activeOrders: 24,
    ordersChange: 15.2,
    capacityRate: 81,
  },
  monthlyRevenue: months12.map((month, i) => ({
    month,
    revenue: Math.round(180000 + Math.sin(i * 0.8) * 60000 + i * 8000 + Math.random() * 20000),
  })),
  productSales: [
    { name: "CARUMA", value: 1450000, color: "#3a9348" },
    { name: "CARANI", value: 890000, color: "#b07a3b" },
    { name: "CAROB EXTRACT", value: 420000, color: "#553424" },
  ],
  productionVsTarget: months12.map((month, i) => ({
    month,
    production: Math.round(24000 + Math.sin(i * 0.6) * 8000 + i * 600),
    target: [28000, 30000, 33000, 35000, 32000, 27000, 24000, 26000, 30000, 36000, 38000, 37000][i],
  })),
  topClients: [
    { name: "Naturex S.A.", country: "France", revenue: 485000 },
    { name: "Cargill BV", country: "Pays-Bas", revenue: 372000 },
    { name: "Döhler GmbH", country: "Allemagne", revenue: 298000 },
    { name: "Kerry Group", country: "Irlande", revenue: 245000 },
    { name: "Olam Intl", country: "Singapour", revenue: 189000 },
  ],
  recentOrders: [
    { id: "ORD-2024-001", client: "Naturex S.A.", country: "France", product: "CARUMA", quantity: 5000, total: 62500, status: "shipped", date: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "ORD-2024-002", client: "Cargill BV", country: "Pays-Bas", product: "CARANI", quantity: 8000, total: 48000, status: "in_production", date: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: "ORD-2024-003", client: "Döhler GmbH", country: "Allemagne", product: "CAROB EXTRACT", quantity: 2000, total: 34000, status: "confirmed", date: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "ORD-2024-004", client: "Kerry Group", country: "Irlande", product: "CARUMA", quantity: 3500, total: 43750, status: "delivered", date: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: "ORD-2024-005", client: "Olam Intl", country: "Singapour", product: "CARANI", quantity: 6000, total: 36000, status: "shipped", date: new Date(Date.now() - 6 * 86400000).toISOString() },
    { id: "ORD-2024-006", client: "Barry Callebaut", country: "Suisse", product: "CARUMA", quantity: 4200, total: 52500, status: "confirmed", date: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: "ORD-2024-007", client: "ADM Trading", country: "USA", product: "CAROB EXTRACT", quantity: 1500, total: 25500, status: "draft", date: new Date(Date.now() - 8 * 86400000).toISOString() },
    { id: "ORD-2024-008", client: "Tate & Lyle", country: "UK", product: "CARANI", quantity: 7500, total: 45000, status: "in_production", date: new Date(Date.now() - 9 * 86400000).toISOString() },
  ],
};

// ── Production ──
export const demoProduction = {
  total: 32400,
  totalChange: 8.7,
  monthly: months12.map((month, i) => ({
    month,
    CARUMA: Math.round(12000 + Math.sin(i * 0.7) * 4000 + i * 200),
    CARANI: Math.round(8000 + Math.cos(i * 0.5) * 2500 + i * 150),
    "CAROB EXTRACT": Math.round(4000 + Math.sin(i * 0.9) * 1500 + i * 100),
  })),
  byQuality: [
    { quality: "Grade A", count: 156 },
    { quality: "Grade B", count: 89 },
    { quality: "Grade C", count: 23 },
  ],
  byShift: [
    { shift: "Matin", quantity: 142000 },
    { shift: "Après-midi", quantity: 128000 },
    { shift: "Nuit", quantity: 68000 },
  ],
};

// ── Ventes ──
export const demoVentes = {
  byCountry: [
    { country: "France", revenue: 485000, orders: 18 },
    { country: "Pays-Bas", revenue: 372000, orders: 12 },
    { country: "Allemagne", revenue: 298000, orders: 15 },
    { country: "Irlande", revenue: 245000, orders: 8 },
    { country: "Singapour", revenue: 189000, orders: 6 },
    { country: "Suisse", revenue: 156000, orders: 9 },
    { country: "USA", revenue: 134000, orders: 7 },
    { country: "UK", revenue: 98000, orders: 5 },
  ],
  byProduct: [
    { name: "CARUMA", revenue: 1450000, quantity: 116000 },
    { name: "CARANI", revenue: 890000, quantity: 148300 },
    { name: "CAROB EXTRACT", revenue: 420000, quantity: 24700 },
  ],
  pipeline: [
    { status: "draft", count: 4, amount: 95000 },
    { status: "confirmed", count: 8, amount: 312000 },
    { status: "in_production", count: 6, amount: 248000 },
    { status: "shipped", count: 5, amount: 187000 },
    { status: "delivered", count: 42, amount: 1580000 },
    { status: "cancelled", count: 2, amount: 38000 },
  ],
  monthly: months12.map((month, i) => ({
    month,
    revenue: Math.round(160000 + Math.sin(i * 0.8) * 50000 + i * 7000),
    orders: Math.round(6 + Math.sin(i * 0.6) * 3 + i * 0.3),
  })),
  resellers: [
    {
      id: "R1",
      name: "Naturex S.A.",
      country: "France",
      type: "distributeur" as const,
      status: "actif" as const,
      since: "2023-01-15",
      contactName: "Pierre Dumont",
      totalRevenue: 485000,
      totalOrders: 18,
      avgOrderValue: 26944,
      lastOrderDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      growthRate: 18.5,
      paymentScore: 95,
      productsHandled: ["CARUMA", "CARANI", "CAROB EXTRACT"],
      monthlyRevenue: months12.map((month, i) => ({
        month,
        revenue: Math.round(32000 + Math.sin(i * 0.7) * 8000 + i * 1500),
      })),
      target: 550000,
    },
    {
      id: "R2",
      name: "Cargill BV",
      country: "Pays-Bas",
      type: "grossiste" as const,
      status: "actif" as const,
      since: "2024-03-01",
      contactName: "Hans van der Berg",
      totalRevenue: 372000,
      totalOrders: 12,
      avgOrderValue: 31000,
      lastOrderDate: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
      growthRate: 12.3,
      paymentScore: 92,
      productsHandled: ["CARUMA", "CARANI"],
      monthlyRevenue: months12.map((month, i) => ({
        month,
        revenue: Math.round(25000 + Math.cos(i * 0.6) * 6000 + i * 1200),
      })),
      target: 420000,
    },
    {
      id: "R3",
      name: "Döhler GmbH",
      country: "Allemagne",
      type: "distributeur" as const,
      status: "actif" as const,
      since: "2024-07-15",
      contactName: "Klaus Fischer",
      totalRevenue: 298000,
      totalOrders: 15,
      avgOrderValue: 19867,
      lastOrderDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
      growthRate: 22.1,
      paymentScore: 78,
      productsHandled: ["CARANI", "CAROB EXTRACT"],
      monthlyRevenue: months12.map((month, i) => ({
        month,
        revenue: Math.round(18000 + Math.sin(i * 0.9) * 5000 + i * 1800),
      })),
      target: 350000,
    },
    {
      id: "R4",
      name: "Barry Callebaut",
      country: "Suisse",
      type: "distributeur" as const,
      status: "onboarding" as const,
      since: "2025-11-01",
      contactName: "Marc Lehmann",
      totalRevenue: 68000,
      totalOrders: 3,
      avgOrderValue: 22667,
      lastOrderDate: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
      growthRate: 0,
      paymentScore: 88,
      productsHandled: ["CARUMA"],
      monthlyRevenue: months12.map((month, i) => ({
        month,
        revenue: i < 9 ? 0 : Math.round(15000 + (i - 9) * 8000),
      })),
      target: 200000,
    },
    {
      id: "R5",
      name: "Tate & Lyle",
      country: "UK",
      type: "agent" as const,
      status: "onboarding" as const,
      since: "2026-01-10",
      contactName: "Sarah Mitchell",
      totalRevenue: 24000,
      totalOrders: 1,
      avgOrderValue: 24000,
      lastOrderDate: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0],
      growthRate: 0,
      paymentScore: 70,
      productsHandled: ["CARANI"],
      monthlyRevenue: months12.map((month, i) => ({
        month,
        revenue: i < 11 ? 0 : 24000,
      })),
      target: 150000,
    },
  ],
};

// ── Stocks ──
export const demoStocks = {
  current: [
    { product: "CARUMA", quantity: 18500, minThreshold: 15000, status: "ok" },
    { product: "CARANI", quantity: 4200, minThreshold: 5000, status: "critical" },
    { product: "CAROB EXTRACT", quantity: 3800, minThreshold: 2000, status: "ok" },
  ],
  movements: [
    { date: new Date(Date.now() - 1 * 86400000).toISOString(), product: "CARUMA", type: "in", quantity: 2500, reason: "Production matin" },
    { date: new Date(Date.now() - 1 * 86400000).toISOString(), product: "CARANI", type: "out", quantity: 3000, reason: "Expédition Cargill BV" },
    { date: new Date(Date.now() - 2 * 86400000).toISOString(), product: "CAROB EXTRACT", type: "in", quantity: 800, reason: "Production nuit" },
    { date: new Date(Date.now() - 2 * 86400000).toISOString(), product: "CARUMA", type: "out", quantity: 5000, reason: "Expédition Naturex" },
    { date: new Date(Date.now() - 3 * 86400000).toISOString(), product: "CARANI", type: "in", quantity: 1800, reason: "Production après-midi" },
    { date: new Date(Date.now() - 3 * 86400000).toISOString(), product: "CARUMA", type: "in", quantity: 3200, reason: "Production matin" },
    { date: new Date(Date.now() - 4 * 86400000).toISOString(), product: "CAROB EXTRACT", type: "out", quantity: 1200, reason: "Expédition Döhler" },
    { date: new Date(Date.now() - 4 * 86400000).toISOString(), product: "CARANI", type: "out", quantity: 2200, reason: "Expédition Kerry" },
  ],
  trends: months12.map((month, i) => ({
    month,
    CARUMA: Math.round(15000 + Math.sin(i * 0.4) * 5000 + i * 300),
    CARANI: Math.round(6000 + Math.cos(i * 0.5) * 2000 - i * 100),
    "CAROB EXTRACT": Math.round(3000 + Math.sin(i * 0.7) * 1000 + i * 80),
  })),
};

// ── Prévisions Demand ──
export const demoPrevisionsDemand = {
  forecast: [
    {
      product: "CARUMA",
      historical: months12.slice(0, 6).map((m, i) => ({ month: m, quantity: Math.round(12000 + i * 500 + Math.random() * 2000) })),
      predicted: months12.slice(6).map((m, i) => ({ month: m, quantity: Math.round(14000 + i * 600 + Math.random() * 1500) })),
      trend: 12.5,
    },
    {
      product: "CARANI",
      historical: months12.slice(0, 6).map((m, i) => ({ month: m, quantity: Math.round(8000 + i * 300 + Math.random() * 1500) })),
      predicted: months12.slice(6).map((m, i) => ({ month: m, quantity: Math.round(9500 + i * 400 + Math.random() * 1000) })),
      trend: 8.3,
    },
    {
      product: "CAROB EXTRACT",
      historical: months12.slice(0, 6).map((m, i) => ({ month: m, quantity: Math.round(3000 + i * 200 + Math.random() * 800) })),
      predicted: months12.slice(6).map((m, i) => ({ month: m, quantity: Math.round(4000 + i * 250 + Math.random() * 600) })),
      trend: 15.0,
    },
  ],
};

// ── Prévisions Production ──
export const demoPrevisionsProd = {
  recommendations: [
    { product: "CARUMA", currentStock: 18500, monthlyDemand: 14000, coverageDays: 39, suggestedProduction: 16000, priority: "normal" as const },
    { product: "CARANI", currentStock: 4200, monthlyDemand: 9500, coverageDays: 13, suggestedProduction: 12000, priority: "high" as const },
    { product: "CAROB EXTRACT", currentStock: 3800, monthlyDemand: 4000, coverageDays: 28, suggestedProduction: 5000, priority: "normal" as const },
  ],
};

// ── War Room (uses same data shape as the real API) ──
const COUNTRY_COORDS: Record<string, [number, number]> = {
  France: [46.6, 2.2],
  "Pays-Bas": [52.1, 5.3],
  Allemagne: [51.2, 10.4],
  Irlande: [53.4, -8.2],
  Singapour: [1.35, 103.8],
  Suisse: [46.8, 8.2],
  USA: [39.8, -98.6],
  UK: [55.4, -3.4],
};

export const demoWarRoom = {
  kpis: {
    revenue: { label: "CA Mensuel", value: 287500, currency: "USD", trend: 12.3, severity: "normal" as const },
    margin: { label: "Marge brute", value: 42.0, trend: 2.1, severity: "normal" as const },
    openPositions: { label: "Positions ouvertes", value: 24, trend: 15.2, severity: "warning" as const },
    exposure: { label: "Exposition totale", value: 1250000, currency: "USD", trend: -5.3, severity: "normal" as const },
  },
  pnl: [
    { product: "CARUMA", revenue: 1450000, costOfGoods: 841000, grossMargin: 609000, grossMarginPct: 42.0, netMargin: 391000, ebitda: 435000 },
    { product: "CARANI", revenue: 890000, costOfGoods: 516200, grossMargin: 373800, grossMarginPct: 42.0, netMargin: 240000, ebitda: 267000 },
    { product: "CAROB EXTRACT", revenue: 420000, costOfGoods: 243600, grossMargin: 176400, grossMarginPct: 42.0, netMargin: 113000, ebitda: 126000 },
  ],
  positions: demoDashboard.recentOrders
    .filter((o) => ["confirmed", "in_production", "shipped"].includes(o.status))
    .map((o) => ({
      orderId: o.id,
      client: o.client,
      country: o.country,
      product: o.product,
      quantity: o.quantity,
      value: o.total,
      currency: "USD",
      status: o.status,
      deliveryDate: new Date(Date.now() + Math.random() * 30 * 86400000).toISOString().split("T")[0],
      daysUntilDelivery: Math.round(Math.random() * 30),
    })),
  currencies: [
    { currency: "EUR", total: 980000, pct: 52, orders: 35 },
    { currency: "USD", total: 560000, pct: 30, orders: 18 },
    { currency: "GBP", total: 190000, pct: 10, orders: 8 },
    { currency: "SGD", total: 150000, pct: 8, orders: 6 },
  ],
  alerts: [
    { id: "A1", severity: "critical" as const, category: "Stock", title: "Stock CARANI critique", description: "Stock CARANI à 4 200 kg — sous le seuil minimum de 5 000 kg", timestamp: new Date().toISOString() },
    { id: "A2", severity: "warning" as const, category: "Livraison", title: "Retard potentiel Cargill", description: "Commande ORD-2024-002 en production depuis 12 jours — délai habituel 10j", timestamp: new Date().toISOString() },
    { id: "A3", severity: "info" as const, category: "Marché", title: "Hausse prix cacao +3.2%", description: "Le spread cacao/caroube s'élargit, renforçant l'avantage compétitif", timestamp: new Date().toISOString() },
  ],
  flows: Object.entries(COUNTRY_COORDS).map(([country, coords]) => ({
    from: [34.89, -1.32] as [number, number],
    to: coords as [number, number],
    toLabel: country,
    value: Math.round(50000 + Math.random() * 200000),
    orders: Math.round(3 + Math.random() * 12),
  })),
  lastUpdate: new Date().toISOString(),
};

// ── Risk ──
export const demoRisk = {
  var: {
    var95: 48000,
    var99: 72000,
    expectedShortfall: 85000,
    exposureByType: [
      { type: "Prix matières", amount: 320000, pct: 42 },
      { type: "Change (FX)", amount: 180000, pct: 24 },
      { type: "Crédit client", amount: 150000, pct: 20 },
      { type: "Opérationnel", amount: 110000, pct: 14 },
    ],
  },
  stressScenarios: [
    { name: "Crise cacao +40%", cocoaChange: 40, fxChange: -5, impactRevenue: 180000, impactMargin: -8.5, riskLevel: "critical" as const },
    { name: "EUR/USD -15%", cocoaChange: 0, fxChange: -15, impactRevenue: -95000, impactMargin: -3.2, riskLevel: "high" as const },
    { name: "Perte client majeur", cocoaChange: 0, fxChange: 0, impactRevenue: -245000, impactMargin: -5.0, riskLevel: "high" as const },
    { name: "Sécheresse Algérie", cocoaChange: 5, fxChange: -2, impactRevenue: -120000, impactMargin: -4.8, riskLevel: "medium" as const },
    { name: "Récession UE modérée", cocoaChange: -10, fxChange: -3, impactRevenue: -85000, impactMargin: -2.1, riskLevel: "medium" as const },
    { name: "Scénario favorable", cocoaChange: 20, fxChange: 5, impactRevenue: 150000, impactMargin: 3.5, riskLevel: "low" as const },
  ],
  hedgeScenarios: [
    { strategy: "Forward EUR/USD 6 mois", cost: 12000, protection: 95000, netBenefit: 83000, recommendation: true },
    { strategy: "Option put cacao", cost: 18000, protection: 120000, netBenefit: 102000, recommendation: true },
    { strategy: "Swap taux fixe", cost: 8000, protection: 45000, netBenefit: 37000, recommendation: false },
    { strategy: "Couverture complète", cost: 35000, protection: 250000, netBenefit: 215000, recommendation: true },
  ],
  counterparties: [
    { clientId: "C1", client: "Naturex S.A.", country: "France", paymentScore: 95, volumeScore: 88, riskRating: "A" as const, totalExposure: 485000, avgPaymentDays: 28 },
    { clientId: "C2", client: "Cargill BV", country: "Pays-Bas", paymentScore: 92, volumeScore: 85, riskRating: "A" as const, totalExposure: 372000, avgPaymentDays: 32 },
    { clientId: "C3", client: "Döhler GmbH", country: "Allemagne", paymentScore: 78, volumeScore: 72, riskRating: "B" as const, totalExposure: 298000, avgPaymentDays: 45 },
    { clientId: "C4", client: "Kerry Group", country: "Irlande", paymentScore: 85, volumeScore: 65, riskRating: "B" as const, totalExposure: 245000, avgPaymentDays: 38 },
    { clientId: "C5", client: "Olam Intl", country: "Singapour", paymentScore: 60, volumeScore: 55, riskRating: "C" as const, totalExposure: 189000, avgPaymentDays: 58 },
  ],
};

// ── Supply Chain ──
export const demoSupplyChain = {
  shipments: [
    { id: "SHP-001", client: "Naturex S.A.", destination: "France", product: "CARUMA", quantity: 5000, status: "in_transit" as const, departureDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], eta: new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0], daysRemaining: 8 },
    { id: "SHP-002", client: "Cargill BV", destination: "Pays-Bas", product: "CARANI", quantity: 8000, status: "customs" as const, departureDate: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0], eta: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], daysRemaining: 3 },
    { id: "SHP-003", client: "Döhler GmbH", destination: "Allemagne", product: "CAROB EXTRACT", quantity: 2000, status: "preparing" as const, departureDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], eta: new Date(Date.now() + 16 * 86400000).toISOString().split("T")[0], daysRemaining: 16 },
    { id: "SHP-004", client: "Kerry Group", destination: "Irlande", product: "CARUMA", quantity: 3500, status: "delivered" as const, departureDate: new Date(Date.now() - 18 * 86400000).toISOString().split("T")[0], eta: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], daysRemaining: 0 },
    { id: "SHP-005", client: "Olam Intl", destination: "Singapour", product: "CARANI", quantity: 6000, status: "delayed" as const, departureDate: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0], eta: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], daysRemaining: 5 },
  ],
  leadTimes: [
    { destination: "France", avgDays: 12, minDays: 8, maxDays: 18, onTimeRate: 92, shipments: 18 },
    { destination: "Pays-Bas", avgDays: 14, minDays: 10, maxDays: 20, onTimeRate: 88, shipments: 12 },
    { destination: "Allemagne", avgDays: 13, minDays: 9, maxDays: 19, onTimeRate: 90, shipments: 15 },
    { destination: "Singapour", avgDays: 28, minDays: 22, maxDays: 38, onTimeRate: 75, shipments: 6 },
    { destination: "USA", avgDays: 22, minDays: 18, maxDays: 30, onTimeRate: 82, shipments: 7 },
  ],
  bottlenecks: [
    { stage: "Dédouanement Alger", severity: "high" as const, description: "Retards récurrents au port d'Alger", impact: "Délai moyen +3 jours", avgDelay: 3 },
    { stage: "Contrôle qualité export", severity: "medium" as const, description: "Analyses phytosanitaires lentes", impact: "Délai moyen +1.5 jours", avgDelay: 1.5 },
    { stage: "Transport interne Tlemcen→Alger", severity: "medium" as const, description: "Disponibilité camions limitée", impact: "Délai moyen +1 jour", avgDelay: 1 },
    { stage: "Documentation douanière", severity: "low" as const, description: "Processus digitalisé en cours", impact: "Délai moyen +0.5 jour", avgDelay: 0.5 },
  ],
  qualityLots: [
    { lotId: "LOT-240201", product: "CARUMA", date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], quantity: 2500, quality: "Grade A", destination: "Naturex S.A.", status: "Expédié" },
    { lotId: "LOT-240202", product: "CARANI", date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], quantity: 1800, quality: "Grade A", destination: "Cargill BV", status: "En stock" },
    { lotId: "LOT-240203", product: "CAROB EXTRACT", date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], quantity: 800, quality: "Grade B", destination: "Döhler GmbH", status: "Contrôle qualité" },
    { lotId: "LOT-240204", product: "CARUMA", date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], quantity: 3200, quality: "Grade A", destination: "Kerry Group", status: "Livré" },
  ],
};

// ── Commercial ──
export const demoCommercial = {
  pipeline: [
    { id: "D1", client: "Barry Callebaut", country: "Suisse", product: "CARUMA", value: 125000, probability: 80, weightedValue: 100000, stage: "Négociation", expectedClose: "2026-03-15" },
    { id: "D2", client: "Ingredion", country: "USA", product: "CARANI", value: 95000, probability: 60, weightedValue: 57000, stage: "Proposition", expectedClose: "2026-04-01" },
    { id: "D3", client: "Tate & Lyle", country: "UK", product: "CAROB EXTRACT", value: 78000, probability: 90, weightedValue: 70200, stage: "Closing imminent", expectedClose: "2026-02-28" },
    { id: "D4", client: "Symrise AG", country: "Allemagne", product: "CARUMA", value: 155000, probability: 40, weightedValue: 62000, stage: "Qualification", expectedClose: "2026-05-15" },
    { id: "D5", client: "IFF Inc", country: "USA", product: "CARANI", value: 68000, probability: 25, weightedValue: 17000, stage: "Prospection", expectedClose: "2026-06-30" },
  ],
  scoring: [
    { clientId: "C1", client: "Naturex S.A.", country: "France", ltv: 1850000, churnRisk: 8, upsellPotential: 72, overallScore: 92, tier: "platinum" as const },
    { clientId: "C2", client: "Cargill BV", country: "Pays-Bas", ltv: 1420000, churnRisk: 12, upsellPotential: 65, overallScore: 87, tier: "platinum" as const },
    { clientId: "C3", client: "Döhler GmbH", country: "Allemagne", ltv: 980000, churnRisk: 18, upsellPotential: 55, overallScore: 76, tier: "gold" as const },
    { clientId: "C4", client: "Kerry Group", country: "Irlande", ltv: 720000, churnRisk: 25, upsellPotential: 48, overallScore: 68, tier: "gold" as const },
    { clientId: "C5", client: "Olam Intl", country: "Singapour", ltv: 540000, churnRisk: 35, upsellPotential: 60, overallScore: 58, tier: "silver" as const },
  ],
  pricing: [
    { product: "CARUMA", currentPrice: 12500, recommendedPrice: 13200, marketAvg: 12800, competitorRange: [11500, 14200] as [number, number], confidence: 0.85, rationale: "Demande en hausse +12%. Positionnement premium justifié par la certification Bio." },
    { product: "CARANI", currentPrice: 6000, recommendedPrice: 6400, marketAvg: 6200, competitorRange: [5500, 7000] as [number, number], confidence: 0.78, rationale: "Segment compétitif mais notre qualité Grade A permet un premium de 6%." },
    { product: "CAROB EXTRACT", currentPrice: 17000, recommendedPrice: 18500, marketAvg: 17800, competitorRange: [15000, 21000] as [number, number], confidence: 0.92, rationale: "Produit à forte valeur ajoutée. Peu de concurrents avec extraction haute pureté." },
  ],
  rfqs: [
    { id: "RFQ-001", client: "Barry Callebaut", product: "CARUMA", quantity: 10000, requestedPrice: 11800, date: "2026-02-05", status: "pending" as const, suggestedPrice: 12900 },
    { id: "RFQ-002", client: "Symrise AG", product: "CAROB EXTRACT", quantity: 3000, requestedPrice: 16500, date: "2026-02-03", status: "quoted" as const, suggestedPrice: 18200 },
    { id: "RFQ-003", client: "Tate & Lyle", product: "CARANI", quantity: 15000, requestedPrice: 5800, date: "2026-01-28", status: "accepted" as const, suggestedPrice: 6300 },
    { id: "RFQ-004", client: "ADM Trading", product: "CARUMA", quantity: 5000, requestedPrice: 12000, date: "2026-01-25", status: "rejected" as const, suggestedPrice: 13100 },
  ],
};

// ── Executive ──
export const demoExecutive = {
  summary: {
    period: "T1 2026",
    revenue: 2760000,
    revenuePrev: 2380000,
    grossMargin: 42.0,
    grossMarginPrev: 39.5,
    topProduct: "CARUMA",
    topMarket: "France",
    keyHighlights: [
      "CA en hausse de 16% vs T1 2025 — portée par la demande européenne",
      "Marge brute améliorée de 2.5 pts grâce à l'optimisation du sourcing caroube",
      "3 nouveaux clients signés (Barry Callebaut, Symrise, IFF)",
      "Certification ISO 22000 obtenue — ouvre le marché japonais",
    ],
    keyRisks: [
      "Stock CARANI sous seuil critique — risque de rupture sous 15 jours",
      "Concentration client : Naturex + Cargill = 31% du CA",
      "Retards douaniers au port d'Alger : impact moyen +3 jours",
      "Volatilité EUR/DZD : exposition non couverte à 48%",
    ],
  },
  benchmarks: [
    { metric: "Marge brute", boublenza: 42, industryAvg: 35, topPerformer: 48, unit: "%" },
    { metric: "Délai livraison (j)", boublenza: 14, industryAvg: 18, topPerformer: 10, unit: "j" },
    { metric: "Taux livraison on-time", boublenza: 88, industryAvg: 82, topPerformer: 95, unit: "%" },
    { metric: "Croissance CA", boublenza: 16, industryAvg: 8, topPerformer: 22, unit: "%" },
    { metric: "Taux rétention clients", boublenza: 91, industryAvg: 85, topPerformer: 96, unit: "%" },
    { metric: "Coût acquisition client", boublenza: 4200, industryAvg: 5800, topPerformer: 3200, unit: "$" },
  ],
  scenarios: [
    { year: 2026, pessimistic: 2400000, baseline: 2760000, optimistic: 3200000, p10: 2200000, p90: 3400000 },
    { year: 2027, pessimistic: 2600000, baseline: 3200000, optimistic: 3900000, p10: 2350000, p90: 4200000 },
    { year: 2028, pessimistic: 2800000, baseline: 3700000, optimistic: 4700000, p10: 2500000, p90: 5100000 },
    { year: 2029, pessimistic: 3000000, baseline: 4300000, optimistic: 5600000, p10: 2700000, p90: 6200000 },
    { year: 2030, pessimistic: 3200000, baseline: 5000000, optimistic: 6800000, p10: 2900000, p90: 7500000 },
  ],
  yoy: [
    { metric: "Chiffre d'affaires", current: 2760000, previous: 2380000, change: 380000, changePct: 16.0 },
    { metric: "Marge brute", current: 1159200, previous: 940100, change: 219100, changePct: 23.3 },
    { metric: "Volume production (kg)", current: 338000, previous: 295000, change: 43000, changePct: 14.6 },
    { metric: "Commandes actives", current: 24, previous: 18, change: 6, changePct: 33.3 },
    { metric: "Nb clients actifs", current: 15, previous: 12, change: 3, changePct: 25.0 },
  ],
};

// ── Marché Mondial (demo fallback) ──
export const demoMarketMondial = {
  cocoa: {
    currentPrice: 8750,
    change: 120,
    changePercent: 1.39,
    history: Array.from({ length: 90 }, (_, i) => {
      const d = new Date(Date.now() - (89 - i) * 86400000);
      return {
        date: d.toISOString().split("T")[0],
        price: Math.round(8200 + Math.sin(i * 0.08) * 600 + i * 3),
        volume: Math.round(20000 + Math.random() * 15000),
      };
    }),
  },
  forex: [
    { pair: "EUR/USD", rate: 1.085, change24h: 0.003, changePercent: 0.28 },
    { pair: "EUR/GBP", rate: 0.843, change24h: -0.001, changePercent: -0.12 },
    { pair: "EUR/DZD", rate: 146.5, change24h: 0.8, changePercent: 0.55 },
  ],
  forexHistory: Array.from({ length: 90 }, (_, i) => {
    const d = new Date(Date.now() - (89 - i) * 86400000);
    return {
      date: d.toISOString().split("T")[0],
      USD: +(1.08 + Math.sin(i * 0.07) * 0.02).toFixed(4),
      GBP: +(0.84 + Math.sin(i * 0.05) * 0.01).toFixed(4),
      DZD: +(146 + Math.sin(i * 0.04) * 2).toFixed(2),
    };
  }),
  trends: [
    { sector: "Alimentaire", demandGrowth: 12.5, volume: 85000, growth: 12.5, marketSize: "$1.2B", topCountries: ["Europe", "USA", "Japon"] },
    { sector: "Alim. animale", demandGrowth: 8.3, volume: 42000, growth: 8.3, marketSize: "$450M", topCountries: ["Europe", "Brésil", "Chine"] },
    { sector: "Pharma", demandGrowth: 15.0, volume: 18000, growth: 15.0, marketSize: "$180M", topCountries: ["USA", "Allemagne", "Suisse"] },
    { sector: "Cosmétique", demandGrowth: 18.2, volume: 9500, growth: 18.2, marketSize: "$95M", topCountries: ["France", "Corée du Sud", "USA"] },
    { sector: "Subst. cacao", demandGrowth: 22.0, volume: 32000, growth: 22.0, marketSize: "$320M", topCountries: ["Espagne", "Italie", "Allemagne"] },
  ],
  news: [
    { title: "Le marché mondial de la caroube devrait atteindre $2.5B d'ici 2030", summary: "La demande croissante pour les alternatives au cacao propulse le marché.", source: "Food Industry Report", date: new Date(Date.now() - 2 * 86400000).toISOString(), sentiment: "positive" as const },
    { title: "Les prix du cacao atteignent un niveau record historique", summary: "La flambée des prix pousse les industriels vers la poudre de caroube.", source: "Bloomberg Commodities", date: new Date(Date.now() - 5 * 86400000).toISOString(), sentiment: "positive" as const },
    { title: "L'UE renforce les normes d'importation alimentaires", summary: "Les nouvelles réglementations impactent les exportateurs nord-africains.", source: "EU Food Safety Authority", date: new Date(Date.now() - 8 * 86400000).toISOString(), sentiment: "neutral" as const },
    { title: "Croissance de 18% du marché sans gluten en Asie", summary: "Le Japon et la Corée du Sud ouvrent de nouvelles opportunités.", source: "Asian Food Market Intelligence", date: new Date(Date.now() - 12 * 86400000).toISOString(), sentiment: "negative" as const },
  ],
  carobVsCocoa: {
    carobPrice: 4500,
    cocoaPrice: 8750,
    spread: 4250,
    spreadPercent: 48.6,
  },
};

// ── Helper: check if DB is available ──
export async function isDbAvailable(): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.product.count();
    return true;
  } catch {
    return false;
  }
}

// Generic try/catch wrapper for API routes
export async function withDemoFallback<T>(dbFn: () => Promise<T>, demoData: T): Promise<T> {
  try {
    return await dbFn();
  } catch {
    return demoData;
  }
}
