import { NextRequest, NextResponse } from "next/server";
import { generateTemplate } from "@/lib/excel-parser";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const validTypes = ["clients", "orders", "production", "stocks"];

  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const buffer = generateTemplate(type as "clients" | "orders" | "production" | "stocks");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=template_${type}.xlsx`,
    },
  });
}
