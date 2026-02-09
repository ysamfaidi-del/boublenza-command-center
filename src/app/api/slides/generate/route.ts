import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getLanguageModel, getAvailableProviders } from "@/lib/ai-providers";
import { prisma } from "@/lib/db";

export async function GET() {
  const providers = getAvailableProviders();
  return NextResponse.json({ providers });
}

export async function POST(request: NextRequest) {
  try {
    const { providerId, templateType, customPrompt, language = "fr" } = await request.json();

    if (!providerId) {
      return NextResponse.json({ error: "Provider IA requis" }, { status: 400 });
    }

    // Gather business context from DB
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [orders, production, products, clients] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: yearStart }, status: { not: "cancelled" } },
        include: { client: true, lines: { include: { product: true } } },
      }),
      prisma.productionEntry.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { quantity: true },
      }),
      prisma.product.findMany(),
      prisma.client.findMany(),
    ]);

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const topCountries = [...new Set(orders.map((o) => o.client.country))].slice(0, 5);
    const productNames = products.map((p) => p.name);

    const businessContext = `
Entreprise : Boublenza SARL (Tlemcen, Algérie)
Secteur : Transformation du caroubier
Produits : ${productNames.join(", ")}
Clients : ${clients.length} clients dans ${[...new Set(clients.map((c) => c.country))].length} pays
CA 12 mois : ${Math.round(totalRevenue).toLocaleString("fr-FR")} USD
Commandes 12 mois : ${totalOrders}
Production du mois : ${Math.round(production._sum.quantity || 0).toLocaleString("fr-FR")} kg
Top marchés export : ${topCountries.join(", ")}
Certifications : ISO 9001, ISO 22000, FSSC 22000, Bio, Halal
Objectif : 10 millions de caroubiers plantés d'ici 2035
`;

    const templatePrompts: Record<string, string> = {
      monthly_report: `Crée une présentation "Rapport Mensuel" pour Boublenza avec 6-8 slides couvrant :
1. Slide titre
2. KPIs clés du mois (CA, production, commandes)
3. Performance production par produit
4. Analyse des ventes par marché
5. Pipeline commercial
6. Objectifs du mois prochain
7. Points d'attention et recommandations`,

      client_presentation: `Crée une présentation commerciale pour un prospect client de Boublenza avec 6-8 slides :
1. Slide titre "Boublenza - Votre Partenaire Caroube"
2. Présentation de l'entreprise (30+ ans d'expertise)
3. Gamme de produits (CARUMA, CARANI, CAROB EXTRACT) avec avantages
4. Certifications et qualité (ISO, Bio, Halal)
5. Capacités de production et logistique export
6. Engagement développement durable (10M caroubiers 2035)
7. Références clients et marchés
8. Contact et prochaines étapes`,

      export_review: `Crée une présentation "Bilan Export" pour Boublenza avec 6-8 slides :
1. Slide titre
2. Vue d'ensemble export (pays, volumes, CA)
3. Performance par marché (top 5 pays)
4. Analyse par produit exporté
5. Tendances et saisonnalité
6. Opportunités de nouveaux marchés
7. Défis logistiques et réglementaires
8. Stratégie export prochain trimestre`,

      custom: customPrompt || "Crée une présentation professionnelle de 6-8 slides.",
    };

    const prompt = `${templatePrompts[templateType] || templatePrompts.custom}

Contexte business :
${businessContext}

Langue : ${language === "fr" ? "Français" : "English"}

IMPORTANT : Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "title": "Titre de la présentation",
  "slides": [
    {
      "title": "Titre du slide",
      "subtitle": "Sous-titre optionnel",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "note": "Note de bas de page optionnelle"
    }
  ]
}`;

    const model = getLanguageModel(providerId);
    const result = await generateText({ model, prompt, maxOutputTokens: 4000 });

    // Parse JSON from response
    const text = result.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const providers = getAvailableProviders();
    const providerName = providers.find((p) => p.id === providerId)?.name || providerId;

    return NextResponse.json({
      ...parsed,
      generatedBy: providerName,
    });
  } catch (error) {
    console.error("Slide generation error:", error);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Erreur de génération : ${msg}` }, { status: 500 });
  }
}
