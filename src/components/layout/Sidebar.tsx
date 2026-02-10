"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Factory, ShoppingCart, Package, Settings, Leaf,
  Presentation, Upload, TrendingUp, Wallet, BookOpen,
  Activity, BarChart3, Shield, Truck, Users, FileText, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; premium?: boolean };

const mainNav: NavItem[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Ventes & Export", href: "/ventes", icon: ShoppingCart },
  { name: "Stocks", href: "/stocks", icon: Package },
  { name: "Présentations", href: "/slides", icon: Presentation },
  { name: "Import Excel", href: "/import", icon: Upload },
  { name: "Prévisions & Marchés", href: "/previsions", icon: TrendingUp },
  { name: "Finances", href: "/finances", icon: Wallet },
];

const premiumNav: NavItem[] = [
  { name: "War Room", href: "/war-room", icon: Activity, premium: true },
  { name: "Trading Book", href: "/trading", icon: BookOpen, premium: true },
  { name: "Marché Mondial", href: "/marche-mondial", icon: Globe, premium: true },
  { name: "Commodities", href: "/commodities", icon: BarChart3, premium: true },
  { name: "Risques", href: "/risk", icon: Shield, premium: true },
  { name: "Supply Chain", href: "/supply-chain", icon: Truck, premium: true },
  { name: "Commercial", href: "/commercial", icon: Users, premium: true },
  { name: "Reporting", href: "/executive", icon: FileText, premium: true },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? item.premium ? "bg-wr-card text-wr-green" : "bg-forest-50 text-forest-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive
            ? item.premium ? "text-wr-green" : "text-forest-600"
            : "text-gray-400"
        )}
      />
      {item.name}
      {item.premium && (
        <span className="ml-auto rounded bg-wr-card px-1.5 py-0.5 text-[9px] font-bold text-wr-green">
          PRO
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Boublenza</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Command Center
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>

        {/* Premium Divider */}
        <div className="my-4 flex items-center gap-2 px-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Premium</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-1">
          {premiumNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
        <div className="mt-3 px-3 text-[10px] text-gray-400">
          Boublenza SARL &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}
