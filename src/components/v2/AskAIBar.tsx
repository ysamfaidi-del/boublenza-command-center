"use client";

import { Leaf, ArrowRight } from "lucide-react";

export default function AskAIBar() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-gcs-gray-200 bg-gcs-gray-50 px-4 py-2.5 hover:border-gcs-blue/30 transition-colors">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gcs-blue">
        <Leaf className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-xs font-medium text-gcs-gray-700">Ask Boublenza AI</span>
      <div className="mx-2 h-4 w-px bg-gcs-gray-200" />
      <span className="flex-1 text-xs text-gcs-gray-500">What&apos;s each product&apos;s revenue share?</span>
      <button className="text-xs font-medium text-gcs-blue hover:underline flex items-center gap-1">
        Deep dive
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
