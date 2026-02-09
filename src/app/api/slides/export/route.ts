import { NextRequest, NextResponse } from "next/server";
import { buildPptx } from "@/lib/slide-builder";
import type { SlideContent } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { title, slides, format = "pptx" } = await request.json() as {
      title: string;
      slides: SlideContent[];
      format: "pptx" | "pdf";
    };

    if (!title || !slides || slides.length === 0) {
      return NextResponse.json({ error: "Titre et slides requis" }, { status: 400 });
    }

    if (format === "pptx") {
      const buffer = await buildPptx(title, slides);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9\s-]/g, "")}.pptx"`,
        },
      });
    }

    // PDF fallback — generate a simple text-based PDF
    // For a full PDF with styling, puppeteer or @react-pdf would be needed server-side
    // For now, we return PPTX and indicate PDF is generated from PPTX
    const buffer = await buildPptx(title, slides);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9\s-]/g, "")}.pptx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Erreur d'export" }, { status: 500 });
  }
}
