import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    // Aggregate by action type
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const l of logs) {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
      byEntity[l.entity] = (byEntity[l.entity] || 0) + 1;
      byUser[l.userId] = (byUser[l.userId] || 0) + 1;
    }

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        timestamp: l.timestamp.toISOString(),
      })),
      summary: {
        total: logs.length,
        byAction: Object.entries(byAction).map(([action, count]) => ({ action, count })),
        byEntity: Object.entries(byEntity).map(([entity, count]) => ({ entity, count })),
        byUser: Object.entries(byUser).map(([user, count]) => ({ user, count })),
      },
    });
  } catch (err) {
    console.error("Audit API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
