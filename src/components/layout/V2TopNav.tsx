"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronDown, Leaf, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Overview", href: "/v2/overview" },
  { name: "Portfolio", href: "/v2/portfolio", hasDropdown: true },
  { name: "Sales", href: "/v2/sales" },
  { name: "Plan & pitch", href: "/v2/plan", hasDropdown: true },
  { name: "Report", href: "/v2/report", hasDropdown: true },
  { name: "Engagements", href: "/v2/engagements", hasDropdown: true },
  { name: "Resources", href: "/v2/resources", hasDropdown: true },
  { name: "Support", href: "/v2/support", hasDropdown: true },
  { name: "War Room", href: "/v2/war-room" },
  { name: "Slides", href: "/v2/slides" },
  { name: "Import", href: "/v2/import" },
];

export default function V2TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center border-b border-gcs-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pl-4 pr-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gcs-blue">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-normal text-gcs-gray-500">Boublenza</span>
          <span className="text-[15px] font-medium text-gcs-gray-900">Sales</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex h-full items-stretch gap-0" aria-label="Main navigation">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 px-3 text-[13px] font-medium transition-colors border-b-[3px]",
                isActive
                  ? "border-gcs-blue text-gcs-blue"
                  : "border-transparent text-gcs-gray-700 hover:text-gcs-gray-900 hover:bg-gcs-gray-50"
              )}
            >
              {tab.name}
              {tab.hasDropdown && (
                <ChevronDown className="h-3.5 w-3.5 text-gcs-gray-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-3 pr-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gcs-gray-500" />
          <input
            type="text"
            placeholder="Search resources..."
            className="h-8 w-56 rounded-lg border border-gcs-gray-200 bg-gcs-gray-50 pl-8 pr-3 text-xs text-gcs-gray-700 placeholder-gcs-gray-500 outline-none focus:border-gcs-blue focus:bg-white"
          />
        </div>

        {/* Switch to V1 */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg border border-gcs-gray-200 px-2.5 py-1 text-[11px] font-medium text-gcs-gray-700 hover:bg-gcs-gray-50 hover:border-gcs-gray-300 transition-colors"
        >
          <ArrowRightLeft className="h-3 w-3 text-gcs-gray-500" />
          V1 Classic
        </Link>

        {/* User badge */}
        <div className="flex items-center gap-2 rounded border border-gcs-gray-200 px-2.5 py-1">
          <div className="h-5 w-5 rounded-full bg-gcs-blue flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">BZ</span>
          </div>
          <span className="text-[11px] font-medium text-gcs-gray-700">BZ-DZ-TLM-01-Export</span>
        </div>
      </div>
    </header>
  );
}
