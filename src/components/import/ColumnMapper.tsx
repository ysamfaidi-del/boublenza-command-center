"use client";

import { cn } from "@/lib/utils";
import type { ColumnMapping } from "@/types";

const DB_FIELD_OPTIONS: Record<string, { label: string; fields: { value: string; label: string }[] }> = {
  clients: {
    label: "Client",
    fields: [
      { value: "client.name", label: "Nom client" },
      { value: "client.country", label: "Pays" },
      { value: "client.city", label: "Ville" },
      { value: "client.email", label: "Email" },
      { value: "client.phone", label: "Téléphone" },
    ],
  },
  orders: {
    label: "Commandes",
    fields: [
      { value: "client.name", label: "Client" },
      { value: "client.country", label: "Pays client" },
      { value: "product.name", label: "Produit" },
      { value: "orderline.quantity", label: "Quantité" },
      { value: "orderline.unitPrice", label: "Prix unitaire" },
      { value: "order.currency", label: "Devise" },
      { value: "order.status", label: "Statut" },
      { value: "order.date", label: "Date" },
    ],
  },
  production: {
    label: "Production",
    fields: [
      { value: "product.name", label: "Produit" },
      { value: "production.quantity", label: "Quantité" },
      { value: "production.date", label: "Date" },
      { value: "production.shift", label: "Équipe" },
      { value: "production.quality", label: "Qualité" },
    ],
  },
  stocks: {
    label: "Stocks",
    fields: [
      { value: "product.name", label: "Produit" },
      { value: "stock.quantity", label: "Quantité" },
      { value: "stock.type", label: "Type (in/out)" },
      { value: "stock.reason", label: "Motif" },
      { value: "stock.date", label: "Date" },
    ],
  },
};

interface Props {
  mapping: ColumnMapping[];
  dataType: string;
  onMappingChange: (mapping: ColumnMapping[]) => void;
}

export default function ColumnMapper({ mapping, dataType, onMappingChange }: Props) {
  const options = DB_FIELD_OPTIONS[dataType] || DB_FIELD_OPTIONS.clients;

  const handleChange = (index: number, newField: string) => {
    const updated = [...mapping];
    updated[index] = { ...updated[index], dbField: newField, confidence: newField ? 1.0 : 0 };
    onMappingChange(updated);
  };

  return (
    <div className="card">
      <h3 className="card-header">Mapping des colonnes — {options.label}</h3>
      <div className="space-y-3">
        {mapping.map((col, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
            <div className="w-1/3">
              <p className="text-sm font-medium text-gray-900">{col.excelColumn}</p>
              <p className="text-xs text-gray-400 truncate">
                ex: {col.sampleValues.slice(0, 2).join(", ") || "—"}
              </p>
            </div>

            <div className="text-gray-300">→</div>

            <div className="flex-1">
              <select
                value={col.dbField}
                onChange={(e) => handleChange(i, e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none",
                  col.confidence >= 0.7
                    ? "border-green-200 bg-green-50"
                    : col.dbField
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <option value="">— Ignorer cette colonne —</option>
                {options.fields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {col.confidence >= 0.7 && (
              <span className="badge bg-green-100 text-green-700">Auto</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
