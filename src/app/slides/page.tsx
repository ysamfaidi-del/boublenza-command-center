"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import ModelSelector from "@/components/slides/ModelSelector";
import TemplateSelector from "@/components/slides/TemplateSelector";
import SlidePreview from "@/components/slides/SlidePreview";
import type { AIProviderInfo, SlideContent } from "@/types";
import DemoBadge from "@/components/ui/DemoBadge";

export default function SlidesPage() {
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [templateType, setTemplateType] = useState("monthly_report");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [title, setTitle] = useState("");
  const [generatedBy, setGeneratedBy] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slides/generate")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers || []);
        const firstAvailable = data.providers?.find((p: AIProviderInfo) => p.available);
        if (firstAvailable) setSelectedProvider(firstAvailable.id);
      });
  }, []);

  const handleGenerate = async () => {
    if (!selectedProvider) return;
    setGenerating(true);
    setError(null);
    setSlides([]);

    try {
      const res = await fetch("/api/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider,
          templateType,
          customPrompt: templateType === "custom" ? customPrompt : undefined,
          language: "fr",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de génération");
      }

      const data = await res.json();
      setTitle(data.title || "Présentation Boublenza");
      setSlides(data.slides || []);
      setGeneratedBy(data.generatedBy || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: "pptx" | "pdf") => {
    if (slides.length === 0) return;
    setExporting(true);

    try {
      const res = await fetch("/api/slides/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slides, format }),
      });

      if (!res.ok) throw new Error("Erreur d'export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, "")}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur lors du téléchargement");
    } finally {
      setExporting(false);
    }
  };

  const noProviderAvailable = providers.length > 0 && !providers.some((p) => p.available);

  return (
    <div className="space-y-8">
      <DemoBadge />
      {/* Provider Warning */}
      {noProviderAvailable && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Aucun modèle IA configuré. Ajoutez vos clés API dans le fichier <code className="rounded bg-yellow-100 px-1">.env</code> pour activer la génération.
        </div>
      )}

      {/* Model Selector */}
      <ModelSelector
        providers={providers}
        selected={selectedProvider}
        onSelect={setSelectedProvider}
      />

      {/* Template Selector */}
      <TemplateSelector
        selected={templateType}
        onSelect={setTemplateType}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
      />

      {/* Generate Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedProvider}
          className="flex items-center gap-2 rounded-lg bg-forest-600 px-6 py-3 text-sm font-medium text-white hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Génération en cours..." : "Générer la présentation"}
        </button>

        {slides.length > 0 && (
          <>
            <button
              onClick={() => handleExport("pptx")}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              PPTX
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Preview */}
      {slides.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Aperçu ({slides.length + 1} slides)
            </h3>
            {generatedBy && (
              <span className="badge bg-gray-100 text-gray-600">
                Généré par {generatedBy}
              </span>
            )}
          </div>
          <SlidePreview slides={slides} title={title} />
        </div>
      )}
    </div>
  );
}
