"use client";

import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface V2CardProps {
  title?: string;
  subtitle?: string;
  menu?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function V2Card({ title, subtitle, menu = true, className, children }: V2CardProps) {
  return (
    <div className={cn("v2-card", className)}>
      {(title || subtitle) && (
        <div className="v2-card-header">
          <div>
            {title && <h3 className="v2-section-title">{title}</h3>}
            {subtitle && <p className="text-[11px] text-gcs-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {menu && (
            <button className="rounded p-1 text-gcs-gray-500 hover:bg-gcs-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
