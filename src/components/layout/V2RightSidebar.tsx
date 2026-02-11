"use client";

import { ChevronRight, MoreVertical, AlertTriangle, DollarSign, Users, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  label: string;
  icon: string;
  value?: string;
  count?: number;
  severity: "critical" | "warning" | "info";
}

interface RecentLink {
  title: string;
  subtitle?: string;
  type: string;
}

interface V2RightSidebarProps {
  todos?: Todo[];
  recentLinks?: RecentLink[];
  anomaliesCount?: number;
  news?: { title: string; source: string }[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  alert: AlertTriangle,
  dollar: DollarSign,
  users: Users,
  calendar: Calendar,
  activity: Activity,
};

export default function V2RightSidebar({ todos = [], recentLinks = [], anomaliesCount = 0, news = [] }: V2RightSidebarProps) {
  return (
    <aside className="w-[300px] flex-shrink-0 border-l border-gcs-gray-200 bg-white overflow-y-auto">
      <div className="space-y-0">
        {/* Recently visited */}
        <div className="border-b border-gcs-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gcs-gray-900">Recently visited</h3>
            <MoreVertical className="h-4 w-4 text-gcs-gray-500 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {recentLinks.length > 0 ? (
              recentLinks.slice(0, 5).map((link, i) => (
                <div key={i} className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-xs text-gcs-gray-500">→</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gcs-blue truncate group-hover:underline">{link.title}</p>
                    {link.subtitle && (
                      <p className="text-[10px] text-gcs-gray-500 truncate">{link.subtitle}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-gcs-gray-500 italic">Aucune page visitée récemment</p>
            )}
            {recentLinks.length > 5 && (
              <button className="text-xs text-gcs-blue hover:underline">
                View {recentLinks.length - 5} more
              </button>
            )}
          </div>
        </div>

        {/* To-Dos */}
        <div className="border-b border-gcs-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gcs-gray-900">To-Dos</h3>
            <MoreVertical className="h-4 w-4 text-gcs-gray-500 cursor-pointer" />
          </div>
          <div className="space-y-2">
            {todos.map((todo) => {
              const IconComp = iconMap[todo.icon] || AlertTriangle;
              return (
                <div key={todo.id} className="flex items-center gap-2.5 group cursor-pointer">
                  <IconComp
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      todo.severity === "critical" ? "text-gcs-red" :
                      todo.severity === "warning" ? "text-gcs-yellow" : "text-gcs-gray-500"
                    )}
                  />
                  <span className="flex-1 text-xs text-gcs-gray-700 group-hover:text-gcs-blue truncate">
                    {todo.label}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {todo.value && (
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        todo.severity === "critical" ? "bg-red-50 text-gcs-red" :
                        todo.severity === "warning" ? "bg-amber-50 text-amber-700" : "bg-gcs-gray-100 text-gcs-gray-700"
                      )}>
                        {todo.value}
                      </span>
                    )}
                    {todo.count !== undefined && (
                      <span className="text-[10px] font-medium text-gcs-gray-500 bg-gcs-gray-100 rounded px-1.5 py-0.5">
                        {todo.count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {todos.length === 0 && (
              <p className="text-[11px] text-gcs-gray-500 italic">Aucune tâche en attente</p>
            )}
          </div>
        </div>

        {/* Review daily anomalies */}
        <div className="border-b border-gcs-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gcs-gray-900">Review daily anomalies</h3>
            <MoreVertical className="h-4 w-4 text-gcs-gray-500 cursor-pointer" />
          </div>
          {anomaliesCount === 0 ? (
            <div className="flex flex-col items-center py-3">
              <Activity className="h-8 w-8 text-gcs-gray-300 mb-2" />
              <p className="text-xs text-gcs-gray-500">No anomalies detected.</p>
              <p className="text-[10px] text-gcs-gray-500">All accounts performing as expected.</p>
            </div>
          ) : (
            <div className="text-xs text-gcs-red font-medium">
              {anomaliesCount} anomalie{anomaliesCount > 1 ? "s" : ""} détectée{anomaliesCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* News */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gcs-gray-900">News</h3>
            <MoreVertical className="h-4 w-4 text-gcs-gray-500 cursor-pointer" />
          </div>
          <div className="space-y-2">
            {news.slice(0, 3).map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-xs text-gcs-gray-700 group-hover:text-gcs-blue line-clamp-2">{item.title}</p>
                <p className="text-[10px] text-gcs-gray-500">{item.source}</p>
              </div>
            ))}
            {news.length === 0 && (
              <p className="text-[11px] text-gcs-gray-500 italic">Chargement des actualités...</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
