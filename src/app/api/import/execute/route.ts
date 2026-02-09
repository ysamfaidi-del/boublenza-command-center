import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseExcelBuffer } from "@/lib/excel-parser";
import type { ColumnMapping } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dataType = formData.get("dataType") as string;
    const mappingJson = formData.get("mapping") as string;

    if (!file || !dataType || !mappingJson) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer);
    const mapping: ColumnMapping[] = JSON.parse(mappingJson);
    const rows = parsed.allRows || parsed.rows;

    let imported = 0;
    let errors = 0;
    let skipped = 0;
    const details: string[] = [];

    const getField = (row: Record<string, string>, dbField: string): string => {
      const col = mapping.find((m) => m.dbField === dbField);
      return col ? (row[col.excelColumn] || "").trim() : "";
    };

    if (dataType === "clients") {
      for (let i = 0; i < rows.length; i++) {
        try {
          const name = getField(rows[i], "client.name");
          if (!name) { skipped++; continue; }
          await prisma.client.create({
            data: {
              name,
              country: getField(rows[i], "client.country") || "Non spécifié",
              city: getField(rows[i], "client.city") || null,
              email: getField(rows[i], "client.email") || null,
              phone: getField(rows[i], "client.phone") || null,
            },
          });
          imported++;
        } catch (e) {
          errors++;
          details.push(`Ligne ${i + 2}: ${(e as Error).message}`);
        }
      }
    } else if (dataType === "orders") {
      for (let i = 0; i < rows.length; i++) {
        try {
          const clientName = getField(rows[i], "client.name");
          const productName = getField(rows[i], "product.name");
          if (!clientName || !productName) { skipped++; continue; }

          // Find or create client
          let client = await prisma.client.findFirst({ where: { name: clientName } });
          if (!client) {
            client = await prisma.client.create({
              data: { name: clientName, country: getField(rows[i], "client.country") || "Non spécifié" },
            });
          }

          // Find product
          const product = await prisma.product.findFirst({ where: { name: productName } });
          if (!product) { skipped++; details.push(`Ligne ${i + 2}: produit "${productName}" inconnu`); continue; }

          const quantity = parseFloat(getField(rows[i], "orderline.quantity")) || 0;
          const unitPrice = parseFloat(getField(rows[i], "orderline.unitPrice")) || product.pricePerKg;
          const dateStr = getField(rows[i], "order.date");
          const orderDate = dateStr ? new Date(dateStr) : new Date();

          await prisma.order.create({
            data: {
              clientId: client.id,
              status: getField(rows[i], "order.status") || "confirmed",
              totalAmount: quantity * unitPrice,
              currency: getField(rows[i], "order.currency") || "USD",
              createdAt: orderDate,
              lines: { create: { productId: product.id, quantity, unitPrice } },
            },
          });
          imported++;
        } catch (e) {
          errors++;
          details.push(`Ligne ${i + 2}: ${(e as Error).message}`);
        }
      }
    } else if (dataType === "production") {
      for (let i = 0; i < rows.length; i++) {
        try {
          const productName = getField(rows[i], "product.name");
          if (!productName) { skipped++; continue; }

          const product = await prisma.product.findFirst({ where: { name: productName } });
          if (!product) { skipped++; details.push(`Ligne ${i + 2}: produit "${productName}" inconnu`); continue; }

          const dateStr = getField(rows[i], "production.date");
          await prisma.productionEntry.create({
            data: {
              productId: product.id,
              quantity: parseFloat(getField(rows[i], "production.quantity")) || 0,
              date: dateStr ? new Date(dateStr) : new Date(),
              shift: getField(rows[i], "production.shift") || null,
              quality: getField(rows[i], "production.quality") || null,
            },
          });
          imported++;
        } catch (e) {
          errors++;
          details.push(`Ligne ${i + 2}: ${(e as Error).message}`);
        }
      }
    } else if (dataType === "stocks") {
      for (let i = 0; i < rows.length; i++) {
        try {
          const productName = getField(rows[i], "product.name");
          if (!productName) { skipped++; continue; }

          const product = await prisma.product.findFirst({ where: { name: productName } });
          if (!product) { skipped++; continue; }

          const dateStr = getField(rows[i], "stock.date");
          await prisma.stockEntry.create({
            data: {
              productId: product.id,
              quantity: parseFloat(getField(rows[i], "stock.quantity")) || 0,
              type: getField(rows[i], "stock.type") || "in",
              reason: getField(rows[i], "stock.reason") || null,
              date: dateStr ? new Date(dateStr) : new Date(),
            },
          });
          imported++;
        } catch (e) {
          errors++;
          details.push(`Ligne ${i + 2}: ${(e as Error).message}`);
        }
      }
    }

    return NextResponse.json({ imported, errors, skipped, details: details.slice(0, 20) });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}
