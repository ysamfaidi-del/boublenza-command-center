"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIProviderInfo } from "@/types";

interface Props {
  providers: AIProviderInfo[];
  selected: string;
  onSelect: (id: string) => void;
}

const PROVIDER_ICONS: Record<string, string> = {
  claude: "A",
  gemini: "G",
  glm4: "Z",
  kimi: "K",
  minimax: "M",
};

const PROVIDER_COLORS: Record<string, string> = {
  claude: "bg-orange-100 text-orange-700 border-orange-200",
  gemini: "bg-blue-100 text-blue-700 border-blue-200",
  glm4: "bg-purple-100 text-purple-700 border-purple-200",
  kimi: "bg-cyan-100 text-cyan-700 border-cyan-200",
  minimax: "bg-pink-100 text-pink-700 border-pink-200",
};

export default function ModelSelector({ providers, selected, onSelect }: Props) {
  return (
    <div className="card">
      <h3 className="card-header flex items-center gap-2">
        <Bot className="h-4 w-4" />
        Modèle IA
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => p.available && onSelect(p.id)}
            disabled={!p.available}
            className={cn(
              "rounded-xl border-2 p-4 text-center transition-all",
              selected === p.id
                ? "border-forest-500 bg-forest-50 ring-2 ring-forest-200"
                : p.available
                ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
            )}
          >
            <div
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                PROVIDER_COLORS[p.id] || "bg-gray-100 text-gray-600"
              )}
            >
              {PROVIDER_ICONS[p.id] || "?"}
            </div>
            <p className="mt-2 text-xs font-medium text-gray-900">{p.name}</p>
            {!p.available && (
              <p className="mt-1 text-[10px] text-gray-400">Non configuré</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
