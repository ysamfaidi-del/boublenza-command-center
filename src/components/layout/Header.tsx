"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/production": "Production",
  "/ventes": "Ventes & Export",
  "/stocks": "Stocks",
  "/slides": "Présentations IA",
  "/import": "Import de données",
  "/previsions": "Prévisions & Marchés",
  "/war-room": "War Room",
  "/commodities": "Commodity Intelligence",
  "/risk": "Risk Management",
  "/supply-chain": "Supply Chain Control Tower",
  "/commercial": "Intelligence Commerciale",
  "/executive": "Reporting Exécutif",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Tableau de bord";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-8 backdrop-blur-sm">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-forest-600 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">BZ</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">Admin</p>
            <p className="text-xs text-gray-400">Boublenza SARL</p>
          </div>
        </div>
      </div>
    </header>
  );
}
