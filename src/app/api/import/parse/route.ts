import { NextRequest, NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/excel-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = parseExcelBuffer(buffer);

    return NextResponse.json({
      dataType: result.dataType,
      headers: result.headers,
      rows: result.rows,
      totalRows: result.totalRows,
      mapping: result.mapping,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Erreur lors du parsing du fichier" }, { status: 500 });
  }
}
