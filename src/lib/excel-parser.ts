import * as XLSX from "xlsx";
import type { ColumnMapping } from "@/types";

const FIELD_SYNONYMS: Record<string, string[]> = {
  // Client fields
  "client.name": ["client", "nom client", "customer", "nom", "name", "société", "company", "raison sociale"],
  "client.country": ["pays", "country", "nation"],
  "client.city": ["ville", "city"],
  "client.email": ["email", "e-mail", "mail", "courriel"],
  "client.phone": ["téléphone", "phone", "tel", "tél"],

  // Order fields
  "order.status": ["statut", "status", "état", "etat"],
  "order.totalAmount": ["montant", "total", "amount", "montant total", "prix total", "total amount"],
  "order.currency": ["devise", "currency", "monnaie"],
  "order.date": ["date commande", "order date", "date", "created"],
  "order.deliveryDate": ["date livraison", "delivery date", "livraison"],

  // Product fields
  "product.name": ["produit", "product", "nom produit", "product name", "article"],
  "product.category": ["catégorie", "category", "type"],
  "product.pricePerKg": ["prix/kg", "prix au kg", "price per kg", "prix unitaire", "unit price"],

  // OrderLine fields
  "orderline.quantity": ["quantité", "quantity", "qty", "qté", "volume", "poids", "weight"],
  "orderline.unitPrice": ["prix unitaire", "unit price", "prix", "price", "pu"],

  // Production fields
  "production.quantity": ["quantité produite", "production", "qty produced", "quantité", "quantity"],
  "production.date": ["date production", "production date", "date", "jour"],
  "production.shift": ["équipe", "shift", "poste", "quart"],
  "production.quality": ["qualité", "quality", "grade", "note"],

  // Stock fields
  "stock.quantity": ["quantité", "quantity", "stock", "qty"],
  "stock.type": ["type", "mouvement", "movement", "entrée/sortie"],
  "stock.reason": ["motif", "reason", "raison", "cause"],
  "stock.date": ["date", "date mouvement"],
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[_\-\.]/g, " ").replace(/\s+/g, " ");
}

function matchColumn(header: string): { field: string; confidence: number } | null {
  const normalized = normalize(header);

  // Exact match
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (normalized === synonym) {
        return { field, confidence: 1.0 };
      }
    }
  }

  // Partial match
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (normalized.includes(synonym) || synonym.includes(normalized)) {
        return { field, confidence: 0.7 };
      }
    }
  }

  return null;
}

function detectDataType(mappings: ColumnMapping[]): "clients" | "orders" | "production" | "stocks" {
  const fields = mappings.map((m) => m.dbField);

  const hasClient = fields.some((f) => f.startsWith("client."));
  const hasOrder = fields.some((f) => f.startsWith("order.") || f.startsWith("orderline."));
  const hasProduction = fields.some((f) => f.startsWith("production."));
  const hasStock = fields.some((f) => f.startsWith("stock."));

  if (hasProduction && !hasOrder) return "production";
  if (hasStock && !hasOrder && !hasProduction) return "stocks";
  if (hasOrder || fields.some((f) => f === "orderline.quantity")) return "orders";
  return "clients";
}

export function parseExcelBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (jsonData.length === 0) {
    return { headers: [], rows: [], totalRows: 0, mapping: [], dataType: "clients" as const };
  }

  const headers = Object.keys(jsonData[0]);
  const rows = jsonData.map((row) => {
    const r: Record<string, string> = {};
    for (const h of headers) {
      r[h] = String(row[h] ?? "");
    }
    return r;
  });

  // Auto-map columns
  const mapping: ColumnMapping[] = headers.map((header) => {
    const match = matchColumn(header);
    const sampleValues = rows.slice(0, 5).map((r) => r[header]).filter(Boolean);
    return {
      excelColumn: header,
      dbField: match?.field || "",
      sampleValues,
      confidence: match?.confidence || 0,
    };
  });

  const dataType = detectDataType(mapping);

  return {
    headers,
    rows: rows.slice(0, 100), // Preview first 100 rows
    totalRows: rows.length,
    mapping,
    dataType,
    allRows: rows, // Keep all for import
  };
}

export function generateTemplate(type: "clients" | "orders" | "production" | "stocks"): Buffer {
  const wb = XLSX.utils.book_new();

  const templates: Record<string, string[][]> = {
    clients: [
      ["Nom Client", "Pays", "Ville", "Email", "Téléphone"],
      ["Exemple SPA", "Algérie", "Alger", "contact@exemple.dz", "+213 555 1234"],
    ],
    orders: [
      ["Client", "Pays", "Produit", "Quantité (kg)", "Prix Unitaire", "Devise", "Statut", "Date Commande"],
      ["Exemple SPA", "Algérie", "CARUMA", "5000", "4.50", "USD", "confirmed", "2026-01-15"],
    ],
    production: [
      ["Produit", "Quantité (kg)", "Date Production", "Équipe", "Qualité"],
      ["CARUMA", "2000", "2026-01-15", "Matin", "A"],
    ],
    stocks: [
      ["Produit", "Quantité (kg)", "Type (in/out)", "Motif", "Date"],
      ["CARUMA", "5000", "in", "production", "2026-01-15"],
    ],
  };

  const data = templates[type] || templates.clients;
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, type);
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
