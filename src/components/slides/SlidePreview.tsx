"use client";

import type { SlideContent } from "@/types";

interface Props {
  slides: SlideContent[];
  title: string;
}

export default function SlidePreview({ slides, title }: Props) {
  return (
    <div className="space-y-4">
      {/* Title slide */}
      <div className="aspect-video overflow-hidden rounded-xl bg-[#1a1a2e] p-8 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[4px] text-green-400">
          BOUBLENZA
        </p>
        <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">
          {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
        </p>
        <div className="mt-4 h-1 w-20 rounded bg-green-500" />
      </div>

      {/* Content slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="aspect-video overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-4 h-1 w-full rounded bg-green-500" />
          <h3 className="text-xl font-bold text-gray-900">{slide.title}</h3>
          {slide.subtitle && (
            <p className="mt-1 text-sm text-gray-500">{slide.subtitle}</p>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {slide.bullets.map((bullet, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {slide.note && (
            <p className="mt-auto pt-4 text-xs italic text-gray-400">{slide.note}</p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2">
            <p className="text-[10px] text-gray-300">Boublenza SARL — Confidentiel</p>
            <p className="text-[10px] text-gray-300">{i + 2}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
