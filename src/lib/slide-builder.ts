import PptxGenJS from "pptxgenjs";
import type { SlideContent } from "@/types";

const COLORS = {
  forest: "3a9348",
  carob: "b07a3b",
  dark: "1a1a2e",
  white: "FFFFFF",
  lightGray: "f5f5f5",
  gray: "6b7280",
};

export async function buildPptx(title: string, slides: SlideContent[]): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Boublenza Dashboard";
  pptx.title = title;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: COLORS.dark };
  titleSlide.addText("BOUBLENZA", {
    x: 0.8, y: 1.0, w: 8.4, h: 0.6,
    fontSize: 14, color: COLORS.forest, fontFace: "Arial",
    bold: true, charSpacing: 4,
  });
  titleSlide.addText(title, {
    x: 0.8, y: 1.8, w: 8.4, h: 1.2,
    fontSize: 32, color: COLORS.white, fontFace: "Arial", bold: true,
  });
  titleSlide.addText(new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" }), {
    x: 0.8, y: 3.2, w: 8.4, h: 0.5,
    fontSize: 14, color: COLORS.gray, fontFace: "Arial",
  });
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 4.0, w: 2.0, h: 0.05, fill: { color: COLORS.forest },
  });

  // Content slides
  for (const content of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.white };

    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.08, fill: { color: COLORS.forest },
    });

    // Title
    slide.addText(content.title, {
      x: 0.8, y: 0.4, w: 8.4, h: 0.6,
      fontSize: 22, color: COLORS.dark, fontFace: "Arial", bold: true,
    });

    // Subtitle
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.8, y: 1.0, w: 8.4, h: 0.4,
        fontSize: 13, color: COLORS.gray, fontFace: "Arial",
      });
    }

    // Bullets
    if (content.bullets && content.bullets.length > 0) {
      const bulletText = content.bullets.map((b) => ({
        text: b,
        options: { fontSize: 14, color: COLORS.dark, bullet: { code: "25CF", color: COLORS.forest } as unknown as boolean },
      }));
      slide.addText(bulletText, {
        x: 0.8, y: 1.6, w: 8.4, h: 3.5,
        fontFace: "Arial", lineSpacingMultiple: 1.5,
        valign: "top",
      });
    }

    // Note
    if (content.note) {
      slide.addText(content.note, {
        x: 0.8, y: 4.8, w: 8.4, h: 0.4,
        fontSize: 10, color: COLORS.gray, fontFace: "Arial", italic: true,
      });
    }

    // Footer
    slide.addText("Boublenza SARL — Confidentiel", {
      x: 0.8, y: 5.2, w: 4, h: 0.3,
      fontSize: 8, color: COLORS.gray, fontFace: "Arial",
    });
  }

  const data = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(data as ArrayBuffer);
}
