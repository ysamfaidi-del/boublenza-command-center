"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

export default function DropZone({ onFileSelect, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  function isValidFile(file: File): boolean {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    return validTypes.includes(file.type) || file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-12 text-center transition-all",
        dragOver
          ? "border-forest-400 bg-forest-50"
          : selectedFile
          ? "border-forest-300 bg-forest-50/50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400",
        loading && "pointer-events-none opacity-60"
      )}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center gap-3">
          <FileSpreadsheet className="h-12 w-12 text-forest-600" />
          <div>
            <p className="font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} Ko
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
            Changer de fichier
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700">
              Glissez votre fichier Excel ici
            </p>
            <p className="mt-1 text-sm text-gray-500">
              ou cliquez pour parcourir (.xlsx, .xls, .csv)
            </p>
          </div>
        </div>
      )}
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}
