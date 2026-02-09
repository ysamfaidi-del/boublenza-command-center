"use client";

import { FileText, Users, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "monthly_report",
    label: "Rapport Mensuel",
    description: "KPIs, production, ventes, objectifs",
    icon: FileText,
  },
  {
    id: "client_presentation",
    label: "Présentation Client",
    description: "Offre commerciale, produits, certifications",
    icon: Users,
  },
  {
    id: "export_review",
    label: "Bilan Export",
    description: "Marchés, pays, tendances, opportunités",
    icon: Globe,
  },
  {
    id: "custom",
    label: "Personnalisé",
    description: "Décrivez votre présentation",
    icon: Sparkles,
  },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  customPrompt: string;
  onCustomPromptChange: (v: string) => void;
}

export default function TemplateSelector({ selected, onSelect, customPrompt, onCustomPromptChange }: Props) {
  return (
    <div className="card">
      <h3 className="card-header">Type de présentation</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              selected === t.id
                ? "border-forest-500 bg-forest-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <t.icon className={cn("h-6 w-6", selected === t.id ? "text-forest-600" : "text-gray-400")} />
            <p className="mt-2 text-sm font-medium text-gray-900">{t.label}</p>
            <p className="mt-1 text-xs text-gray-500">{t.description}</p>
          </button>
        ))}
      </div>

      {selected === "custom" && (
        <div className="mt-4">
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Décrivez le contenu souhaité pour votre présentation..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
          />
        </div>
      )}
    </div>
  );
}
