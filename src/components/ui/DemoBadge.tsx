"use client";

import { AlertTriangle } from "lucide-react";

export default function DemoBadge({ label = "Données partiellement simulées" }: { label?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </div>
  );
}
