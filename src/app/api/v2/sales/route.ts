import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDemoSalesData } from "@/lib/demo/sales-demo-data";
import { pipelineSummary, repPerformance } from "@/lib/analytics/sales-forecast";
import { isOAuthConfigured, isRepConnected } from "@/lib/google-oauth";
import type { V2SalesData, V2SalesRep, V2Deal, V2Lead, V2Activity, DealStage } from "@/types/v2";

/**
 * GET /api/v2/sales
 * Returns complete sales data: reps, deals, leads, activities, pipeline, forecasts.
 * Falls back to demo data if no records exist in DB.
 */
export async function GET() {
  try {
    // Try to load from database first
    const [repsDb, dealsDb, leadsDb, activitiesDb] = await Promise.all([
      prisma.salesRep.findMany({ include: { googleToken: true } }),
      prisma.deal.findMany({ include: { rep: true, lead: true }, orderBy: { createdAt: "desc" } }),
      prisma.lead.findMany({ include: { rep: true }, orderBy: { updatedAt: "desc" } }),
      prisma.activity.findMany({ include: { rep: true, lead: true, deal: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

    // If we have real data, use it
    if (repsDb.length > 0) {
      const deals: V2Deal[] = dealsDb.map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        currency: d.currency,
        stage: d.stage as DealStage,
        probability: d.probability,
        product: d.product,
        quantity: d.quantity || undefined,
        repId: d.repId,
        repName: d.rep.name,
        leadCompany: d.lead?.company,
        expectedClose: d.expectedClose?.toISOString(),
        closedAt: d.closedAt?.toISOString(),
        notes: d.notes || undefined,
        createdAt: d.createdAt.toISOString(),
      }));

      const oauthConfigured = isOAuthConfigured();
      const reps: V2SalesRep[] = await Promise.all(
        repsDb.map(async (r) => {
          const perf = repPerformance(deals, r.id, r.quota);
          const connected = oauthConfigured ? await isRepConnected(r.id) : false;
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            territory: r.territory,
            quota: r.quota,
            avatar: r.avatar || undefined,
            phone: r.phone || undefined,
            dealsWon: perf.dealsWon,
            dealsLost: perf.dealsLost,
            pipelineValue: perf.pipelineValue,
            quotaAttainment: perf.quotaAttainment,
            activitiesCount: activitiesDb.filter((a) => a.repId === r.id).length,
            googleConnected: connected,
          };
        }),
      );

      const leads: V2Lead[] = leadsDb.map((l) => ({
        id: l.id,
        company: l.company,
        contactName: l.contactName,
        contactEmail: l.contactEmail,
        contactPhone: l.contactPhone || undefined,
        source: l.source as V2Lead["source"],
        status: l.status as V2Lead["status"],
        notes: l.notes || undefined,
        repId: l.repId,
        repName: l.rep.name,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }));

      const activities: V2Activity[] = activitiesDb.map((a) => ({
        id: a.id,
        type: a.type as V2Activity["type"],
        subject: a.subject,
        body: a.body || undefined,
        repName: a.rep.name,
        leadCompany: a.lead?.company,
        dealTitle: a.deal?.title,
        dueDate: a.dueDate?.toISOString(),
        completed: a.completed,
        createdAt: a.createdAt.toISOString(),
      }));

      const pipeline = pipelineSummary(deals);

      // Load forecasts from DB or compute
      const forecastsDb = await prisma.salesForecast.findMany({ include: { rep: true } });
      const forecasts = forecastsDb.length > 0
        ? forecastsDb.map((f) => ({
            period: f.period,
            weighted: f.weighted,
            bestCase: f.bestCase,
            worstCase: f.worstCase,
            aiAdjusted: f.aiAdjusted || undefined,
            repId: f.repId,
            repName: f.rep.name,
          }))
        : getDemoSalesData().forecasts;

      const data: V2SalesData = { reps, deals, leads, activities, pipeline, forecasts };
      return NextResponse.json(data);
    }

    // Fallback to demo data
    const demo = getDemoSalesData();
    return NextResponse.json(demo);
  } catch (error) {
    console.error("[V2 Sales API] Error:", error);
    // Ultimate fallback
    return NextResponse.json(getDemoSalesData());
  }
}
