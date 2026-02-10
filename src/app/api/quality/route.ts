import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tests = await prisma.qualityTest.findMany({
      orderBy: { testDate: "desc" },
      take: 200,
    });

    // Aggregate by product
    const byProduct: Record<string, { total: number; pass: number; fail: number; marginal: number }> = {};
    for (const t of tests) {
      if (!byProduct[t.product]) byProduct[t.product] = { total: 0, pass: 0, fail: 0, marginal: 0 };
      byProduct[t.product].total++;
      if (t.result === "pass") byProduct[t.product].pass++;
      else if (t.result === "fail") byProduct[t.product].fail++;
      else byProduct[t.product].marginal++;
    }

    const productSummary = Object.entries(byProduct).map(([product, stats]) => ({
      product,
      ...stats,
      passRate: Math.round(stats.pass / stats.total * 1000) / 10,
    }));

    // Aggregate by test type
    const byType: Record<string, { total: number; pass: number; fail: number }> = {};
    for (const t of tests) {
      if (!byType[t.testType]) byType[t.testType] = { total: 0, pass: 0, fail: 0 };
      byType[t.testType].total++;
      if (t.result === "pass") byType[t.testType].pass++;
      else if (t.result === "fail") byType[t.testType].fail++;
    }

    const typeSummary = Object.entries(byType).map(([testType, stats]) => ({
      testType,
      ...stats,
      passRate: Math.round(stats.pass / stats.total * 1000) / 10,
    }));

    // Recent failures
    const recentFailures = tests
      .filter((t) => t.result !== "pass")
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        product: t.product,
        lotNumber: t.lotNumber,
        testType: t.testType,
        spec: t.spec,
        actual: t.actual,
        result: t.result,
        testDate: t.testDate.toISOString().split("T")[0],
        certifiedBy: t.certifiedBy,
      }));

    // Overall stats
    const totalTests = tests.length;
    const totalPass = tests.filter((t) => t.result === "pass").length;
    const totalFail = tests.filter((t) => t.result === "fail").length;

    return NextResponse.json({
      productSummary,
      typeSummary,
      recentFailures,
      recentTests: tests.slice(0, 30).map((t) => ({
        id: t.id,
        product: t.product,
        lotNumber: t.lotNumber,
        testType: t.testType,
        spec: t.spec,
        actual: t.actual,
        result: t.result,
        testDate: t.testDate.toISOString().split("T")[0],
        certifiedBy: t.certifiedBy,
      })),
      overall: {
        totalTests,
        passRate: Math.round(totalPass / totalTests * 1000) / 10,
        failRate: Math.round(totalFail / totalTests * 1000) / 10,
        uniqueLots: [...new Set(tests.map((t) => t.lotNumber))].length,
      },
    });
  } catch (err) {
    console.error("Quality API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
