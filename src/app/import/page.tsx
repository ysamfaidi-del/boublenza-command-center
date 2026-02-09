"use client";

import { useState } from "react";
import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import DropZone from "@/components/import/DropZone";
import DataPreview from "@/components/import/DataPreview";
import ColumnMapper from "@/components/import/ColumnMapper";
import type { ImportParseResult, ImportExecuteResult, ColumnMapping } from "@/types";

const DATA_TYPE_LABELS: Record<string, string> = {
  clients: "Clients",
  orders: "Commandes",
  production: "Production",
  stocks: "Stocks",
};

const TEMPLATES = [
  { type: "clients", label: "Clients" },
  { type: "orders", label: "Commandes" },
  { type: "production", label: "Production" },
  { type: "stocks", label: "Stocks" },
];

export default function ImportPage() {
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "done">("upload");
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportExecuteResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/import/parse", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erreur de parsing");

      const data: ImportParseResult = await res.json();
      setParseResult(data);
      setMapping(data.mapping);
      setStep("mapping");
    } catch {
      setError("Impossible de lire ce fichier. Vérifiez le format (.xlsx, .xls, .csv).");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !parseResult) return;
    setStep("importing");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dataType", parseResult.dataType);
      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/import/execute", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erreur d'import");

      const result: ImportExecuteResult = await res.json();
      setImportResult(result);
      setStep("done");
    } catch {
      setError("Erreur lors de l'import. Veuillez réessayer.");
      setStep("mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setParseResult(null);
    setMapping([]);
    setImportResult(null);
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Templates Download */}
      <div className="card">
        <h3 className="card-header">Templates Excel</h3>
        <p className="mb-4 text-sm text-gray-500">
          Téléchargez un template pré-formaté pour faciliter l&apos;import de vos données.
        </p>
        <div className="flex flex-wrap gap-3">
          {TEMPLATES.map((t) => (
            <a
              key={t.type}
              href={`/api/import/templates/${t.type}`}
              download
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-forest-600" />
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <DropZone onFileSelect={handleFileSelect} loading={loading} />
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && step === "upload" && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-forest-600" />
          <span className="text-sm text-gray-500">Analyse du fichier en cours...</span>
        </div>
      )}

      {/* Mapping Step */}
      {step === "mapping" && parseResult && (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-bold text-blue-700">
                {parseResult.totalRows}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Type détecté : <strong>{DATA_TYPE_LABELS[parseResult.dataType]}</strong>
              </p>
              <p className="text-xs text-blue-600">
                {parseResult.totalRows} lignes trouvées dans le fichier
              </p>
            </div>
          </div>

          <DataPreview
            headers={parseResult.headers}
            rows={parseResult.rows}
            totalRows={parseResult.totalRows}
          />

          <ColumnMapper
            mapping={mapping}
            dataType={parseResult.dataType}
            onMappingChange={setMapping}
          />

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-forest-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-forest-700"
            >
              Importer {formatNumber(parseResult.totalRows)} lignes
            </button>
          </div>
        </>
      )}

      {/* Importing */}
      {step === "importing" && (
        <div className="card flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
          <p className="mt-4 text-sm text-gray-500">Import en cours...</p>
        </div>
      )}

      {/* Done */}
      {step === "done" && importResult && (
        <div className="card">
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Import terminé</h3>
          </div>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
              <p className="text-xs text-green-600">Importées</p>
            </div>
            <div className={cn("rounded-lg p-4 text-center", importResult.errors > 0 ? "bg-red-50" : "bg-gray-50")}>
              <p className={cn("text-2xl font-bold", importResult.errors > 0 ? "text-red-700" : "text-gray-400")}>
                {importResult.errors}
              </p>
              <p className="text-xs text-gray-500">Erreurs</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{importResult.skipped}</p>
              <p className="text-xs text-gray-500">Ignorées</p>
            </div>
          </div>

          {importResult.details.length > 0 && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Détails :</p>
              <ul className="space-y-1 text-xs text-gray-500">
                {importResult.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleReset}
              className="rounded-lg bg-forest-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-forest-700"
            >
              Nouvel import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
