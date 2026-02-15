"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Sparkles, FileText, ChevronRight, AlertCircle } from "lucide-react";
import V2Card from "@/components/v2/V2Card";
import { cn } from "@/lib/utils";

interface AIProvider { id: string; name: string; available: boolean; description?: string; }
interface Slide { title: string; content: string; type?: string; }

const TEMPLATES = [
  { id: "monthly_report", label: "Monthly Report", description: "Executive summary with KPIs, P&L, and trends", icon: "📊" },
  { id: "quarterly_review", label: "Quarterly Review", description: "Comprehensive Q review with forecasts", icon: "📈" },
  { id: "investor_deck", label: "Investor Deck", description: "Company overview for investors and partners", icon: "💼" },
  { id: "sales_pitch", label: "Sales Pitch", description: "Product catalog and commercial proposal", icon: "🎯" },
  { id: "custom", label: "Custom Prompt", description: "Describe what you want the AI to generate", icon: "✨" },
];

export default function V2SlidesPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [templateType, setTemplateType] = useState("monthly_report");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState("");
  const [generatedBy, setGeneratedBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch("/api/slides/generate")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers || []);
        const firstAvailable = data.providers?.find((p: AIProvider) => p.available);
        if (firstAvailable) setSelectedProvider(firstAvailable.id);
      })
      .catch((err) => {
        console.error("[V2 Slides] Failed to load providers:", err);
        setProviders([
          { id: "demo", name: "Demo Mode", available: true, description: "Simulated AI generation" },
        ]);
        setSelectedProvider("demo");
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
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setTitle(data.title || "Boublenza Presentation");
      setSlides(data.slides || []);
      setGeneratedBy(data.generatedBy || "");
      setCurrentSlide(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
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

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, "")}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download error");
    } finally {
      setExporting(false);
    }
  };

  const noProviderAvailable = providers.length > 0 && !providers.some((p) => p.available);

  return (
    <div className="px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-lg font-medium text-gcs-gray-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gcs-blue" />
          AI Slide Generator
        </h1>
        <p className="text-xs text-gcs-gray-500">Generate presentations from live Boublenza data using AI</p>
      </div>

      {/* ── Provider Warning ── */}
      {noProviderAvailable && (
        <div className="flex items-center gap-3 rounded-lg border border-gcs-yellow bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          No AI model configured. Add API keys in <code className="rounded bg-yellow-100 px-1">.env</code> to enable generation.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Config ── */}
        <div className="space-y-4">
          {/* Model Selector */}
          <V2Card title="AI Model">
            <div className="px-4 py-2 space-y-2">
              {providers.map((p) => (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                    p.id === selectedProvider ? "border-gcs-blue bg-gcs-blue-light" : "border-gcs-gray-200 hover:bg-gcs-gray-50",
                    !p.available && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={p.id === selectedProvider}
                    disabled={!p.available}
                    onChange={() => setSelectedProvider(p.id)}
                    className="accent-gcs-blue"
                  />
                  <div>
                    <p className="text-xs font-medium text-gcs-gray-900">{p.name}</p>
                    {p.description && <p className="text-[10px] text-gcs-gray-500">{p.description}</p>}
                    {!p.available && <p className="text-[10px] text-gcs-red">API key missing</p>}
                  </div>
                </label>
              ))}
            </div>
          </V2Card>

          {/* Template Selector */}
          <V2Card title="Template">
            <div className="px-4 py-2 space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateType(t.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                    t.id === templateType ? "border-gcs-blue bg-gcs-blue-light" : "border-gcs-gray-200 hover:bg-gcs-gray-50"
                  )}
                >
                  <span className="text-base">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gcs-gray-900">{t.label}</p>
                    <p className="text-[10px] text-gcs-gray-500 truncate">{t.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gcs-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </V2Card>

          {/* Custom Prompt */}
          {templateType === "custom" && (
            <V2Card title="Custom Prompt">
              <div className="px-4 py-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the presentation you want..."
                  className="w-full h-24 rounded-lg border border-gcs-gray-200 px-3 py-2 text-xs text-gcs-gray-700 placeholder-gcs-gray-500 outline-none focus:border-gcs-blue resize-none"
                />
              </div>
            </V2Card>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProvider}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gcs-blue px-4 py-2.5 text-xs font-medium text-white hover:bg-gcs-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : "Generate Presentation"}
          </button>
        </div>

        {/* ── Right: Preview ── */}
        <div className="lg:col-span-2">
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-gcs-red bg-red-50 px-4 py-3 text-xs text-gcs-red mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {slides.length > 0 ? (
            <V2Card title={title} subtitle={`${slides.length + 1} slides${generatedBy ? ` · Generated by ${generatedBy}` : ""}`}>
              <div className="px-4 py-4">
                {/* Slide navigation */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {["Title", ...slides.map((s, i) => `Slide ${i + 1}`)].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-full transition-colors",
                        i === currentSlide ? "bg-gcs-blue text-white" : "bg-gcs-gray-100 text-gcs-gray-500 hover:bg-gcs-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Slide content */}
                <div className="rounded-lg border border-gcs-gray-200 bg-white p-6 min-h-[300px]">
                  {currentSlide === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <FileText className="h-12 w-12 text-gcs-blue mb-4" />
                      <h2 className="text-xl font-medium text-gcs-gray-900">{title}</h2>
                      <p className="text-xs text-gcs-gray-500 mt-2">Boublenza SARL — Tlemcen, Algeria</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-gcs-gray-900 mb-3">{slides[currentSlide - 1].title}</h3>
                      <div className="text-xs text-gcs-gray-700 whitespace-pre-line leading-relaxed">
                        {slides[currentSlide - 1].content}
                      </div>
                    </div>
                  )}
                </div>

                {/* Export buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleExport("pptx")}
                    disabled={exporting}
                    className="flex items-center gap-1.5 rounded-lg border border-gcs-gray-200 px-3 py-1.5 text-xs font-medium text-gcs-gray-700 hover:bg-gcs-gray-50 disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    PPTX
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="flex items-center gap-1.5 rounded-lg border border-gcs-gray-200 px-3 py-1.5 text-xs font-medium text-gcs-gray-700 hover:bg-gcs-gray-50 disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </button>
                </div>
              </div>
            </V2Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 rounded-lg border border-dashed border-gcs-gray-200 bg-gcs-gray-50">
              <FileText className="h-16 w-16 text-gcs-gray-300 mb-4" />
              <p className="text-sm text-gcs-gray-500">No presentation generated yet</p>
              <p className="text-xs text-gcs-gray-400 mt-1">Select a model and template, then click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
