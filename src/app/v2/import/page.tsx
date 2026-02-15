"use client";

import { useState } from "react";
import { Upload, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, ArrowRight, X } from "lucide-react";
import V2Card from "@/components/v2/V2Card";
import { cn } from "@/lib/utils";

interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  dataType: string;
  mapping: ColumnMapping[];
}

interface ColumnMapping {
  source: string;
  target: string;
  matched: boolean;
}

interface ImportResult {
  imported: number;
  errors: number;
  skipped: number;
  details: string[];
}

const DATA_TYPE_LABELS: Record<string, string> = {
  clients: "Clients",
  orders: "Orders",
  production: "Production",
  stocks: "Stocks",
};

const TEMPLATES = [
  { type: "clients", label: "Clients", description: "Client database import" },
  { type: "orders", label: "Orders", description: "Sales orders import" },
  { type: "production", label: "Production", description: "Production batches" },
  { type: "stocks", label: "Stocks", description: "Stock levels update" },
];

const STEP_LABELS = ["Upload", "Map Columns", "Importing", "Done"];

export default function V2ImportPage() {
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "done">("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const stepIndex = step === "upload" ? 0 : step === "mapping" ? 1 : step === "importing" ? 2 : 3;

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/import/parse", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Parse error");

      const data: ParseResult = await res.json();
      setParseResult(data);
      setMapping(data.mapping);
      setStep("mapping");
    } catch {
      setError("Unable to read file. Check format (.xlsx, .xls, .csv).");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
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
      if (!res.ok) throw new Error("Import error");

      const result: ImportResult = await res.json();
      setImportResult(result);
      setStep("done");
    } catch {
      setError("Import failed. Please try again.");
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

  const handleMappingChange = (index: number, target: string) => {
    setMapping((prev) => prev.map((m, i) => i === index ? { ...m, target, matched: target !== "" } : m));
  };

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-lg font-medium text-gcs-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5 text-gcs-blue" />
          Data Import
        </h1>
        <p className="text-xs text-gcs-gray-500">Import data from Excel or CSV files into Boublenza</p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1",
              i === stepIndex ? "bg-gcs-blue text-white" :
              i < stepIndex ? "bg-gcs-green text-white" :
              "bg-gcs-gray-100 text-gcs-gray-500"
            )}>
              <span className="text-[10px] font-bold">{i + 1}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </div>
            {i < 3 && <ArrowRight className="h-3 w-3 text-gcs-gray-300" />}
          </div>
        ))}
      </div>

      {/* ── Templates Download ── */}
      <V2Card title="Excel Templates" subtitle="Download pre-formatted templates for easy import">
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {TEMPLATES.map((t) => (
            <a
              key={t.type}
              href={`/api/import/templates/${t.type}`}
              download
              className="flex items-center gap-2 rounded-lg border border-gcs-gray-200 px-3 py-2 text-xs font-medium text-gcs-gray-700 hover:bg-gcs-gray-50 hover:border-gcs-gray-300 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-gcs-blue" />
              {t.label}
            </a>
          ))}
        </div>
      </V2Card>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-gcs-red bg-red-50 px-4 py-3 text-xs text-gcs-red">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <V2Card>
          <div
            className={cn(
              "m-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 transition-colors cursor-pointer",
              dragOver ? "border-gcs-blue bg-gcs-blue-light" : "border-gcs-gray-200 hover:border-gcs-gray-300 hover:bg-gcs-gray-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".xlsx,.xls,.csv";
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gcs-blue mb-3" />
                <p className="text-xs text-gcs-gray-500">Analyzing file...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-12 w-12 text-gcs-gray-300 mb-3" />
                <p className="text-sm font-medium text-gcs-gray-700">Drop your file here or click to browse</p>
                <p className="text-[10px] text-gcs-gray-500 mt-1">Supported: .xlsx, .xls, .csv</p>
              </>
            )}
          </div>
        </V2Card>
      )}

      {/* ── Step 2: Mapping ── */}
      {step === "mapping" && parseResult && (
        <div className="space-y-4">
          {/* Detection info */}
          <div className="flex items-center gap-3 rounded-lg border border-gcs-blue bg-gcs-blue-light px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gcs-blue text-white">
              <span className="text-xs font-bold">{parseResult.totalRows}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gcs-gray-900">
                Detected: <strong>{DATA_TYPE_LABELS[parseResult.dataType] || parseResult.dataType}</strong>
              </p>
              <p className="text-[10px] text-gcs-gray-500">
                {parseResult.totalRows} rows found · {parseResult.headers.length} columns
              </p>
            </div>
          </div>

          {/* Data Preview */}
          <V2Card title="Data Preview" subtitle={`First 5 rows of ${parseResult.totalRows}`}>
            <div className="overflow-x-auto">
              <table className="v2-table">
                <thead>
                  <tr>
                    {parseResult.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {parseResult.headers.map((h) => (
                        <td key={h} className="max-w-[200px] truncate">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </V2Card>

          {/* Column Mapping */}
          <V2Card title="Column Mapping" subtitle="Match source columns to Boublenza fields">
            <div className="px-4 py-3 space-y-2">
              {mapping.map((m, i) => (
                <div key={m.source} className="flex items-center gap-3">
                  <span className="text-xs text-gcs-gray-700 w-32 truncate font-medium">{m.source}</span>
                  <ArrowRight className="h-3 w-3 text-gcs-gray-300 flex-shrink-0" />
                  <select
                    value={m.target}
                    onChange={(e) => handleMappingChange(i, e.target.value)}
                    className="flex-1 rounded-lg border border-gcs-gray-200 px-3 py-1.5 text-xs text-gcs-gray-700 outline-none focus:border-gcs-blue"
                  >
                    <option value="">— Skip —</option>
                    <option value={m.source}>{m.source}</option>
                  </select>
                  {m.matched && <CheckCircle className="h-3.5 w-3.5 text-gcs-green flex-shrink-0" />}
                </div>
              ))}
            </div>
          </V2Card>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gcs-gray-200 px-4 py-2 text-xs font-medium text-gcs-gray-700 hover:bg-gcs-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-gcs-blue px-6 py-2 text-xs font-medium text-white hover:bg-gcs-blue-dark"
            >
              Import {parseResult.totalRows.toLocaleString()} rows
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Importing ── */}
      {step === "importing" && (
        <V2Card>
          <div className="flex flex-col items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gcs-blue" />
            <p className="mt-4 text-xs text-gcs-gray-500">Importing data...</p>
            <p className="text-[10px] text-gcs-gray-400 mt-1">This may take a moment</p>
          </div>
        </V2Card>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && importResult && (
        <V2Card>
          <div className="py-8">
            <div className="flex flex-col items-center mb-6">
              <CheckCircle className="h-10 w-10 text-gcs-green" />
              <h3 className="mt-3 text-sm font-medium text-gcs-gray-900">Import Complete</h3>
            </div>

            <div className="mx-auto grid max-w-md grid-cols-3 gap-4 px-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-xl font-bold text-gcs-green">{importResult.imported}</p>
                <p className="text-[10px] text-gcs-gray-500">Imported</p>
              </div>
              <div className={cn("rounded-lg p-4 text-center", importResult.errors > 0 ? "bg-red-50" : "bg-gcs-gray-50")}>
                <p className={cn("text-xl font-bold", importResult.errors > 0 ? "text-gcs-red" : "text-gcs-gray-300")}>
                  {importResult.errors}
                </p>
                <p className="text-[10px] text-gcs-gray-500">Errors</p>
              </div>
              <div className="rounded-lg bg-gcs-gray-50 p-4 text-center">
                <p className="text-xl font-bold text-gcs-gray-400">{importResult.skipped}</p>
                <p className="text-[10px] text-gcs-gray-500">Skipped</p>
              </div>
            </div>

            {importResult.details.length > 0 && (
              <div className="mt-4 mx-4 rounded-lg bg-gcs-gray-50 p-4">
                <p className="text-xs font-medium text-gcs-gray-700 mb-2">Details:</p>
                <ul className="space-y-0.5 text-[10px] text-gcs-gray-500">
                  {importResult.details.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleReset}
                className="rounded-lg bg-gcs-blue px-6 py-2 text-xs font-medium text-white hover:bg-gcs-blue-dark"
              >
                New Import
              </button>
            </div>
          </div>
        </V2Card>
      )}
    </div>
  );
}
