"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange?: (value: string) => void;
}

export default function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    []
  );

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div ref={ref} className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        className="v2-filter-chip"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-gcs-gray-500">{label}</span>
        <span className="font-medium">{selectedLabel}</span>
        <ChevronDown className={cn("h-3 w-3 text-gcs-gray-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-gcs-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label={label}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange?.(opt.value); setOpen(false); }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                opt.value === value
                  ? "bg-gcs-blue-light text-gcs-blue font-medium"
                  : "text-gcs-gray-700 hover:bg-gcs-gray-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
