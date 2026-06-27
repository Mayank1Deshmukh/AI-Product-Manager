"use client";

import { Briefcase, LayoutList, BarChart2, Share, RefreshCw, ChevronsLeft, ChevronsRight } from "lucide-react";

type ActiveTab = "brd" | "prd" | "market";

interface SidebarProps {
  activeTab: ActiveTab;
  collapsed: boolean;
  onTabChange: (tab: ActiveTab) => void;
  onCollapse: () => void;
  onExport: () => void;
  onReset: () => void;
}

const TABS = [
  { id: "brd" as const, icon: Briefcase, label: "Business case" },
  { id: "prd" as const, icon: LayoutList, label: "Product specs" },
  { id: "market" as const, icon: BarChart2, label: "Market intel" },
] as const;

export function Sidebar({
  activeTab,
  collapsed,
  onTabChange,
  onCollapse,
  onExport,
  onReset,
}: SidebarProps) {
  return (
    <aside
      className="flex flex-col shrink-0 border-r bg-background overflow-hidden transition-[width] duration-200 ease-in-out"
      style={{ width: collapsed ? 48 : 200 }}
    >
      {/* Header */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Blueprint
          </p>
        </div>
      )}

      {/* Nav tabs */}
      <nav className="flex flex-col gap-0.5 px-1 pt-2 flex-1">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              title={collapsed ? label : undefined}
              onClick={() => onTabChange(id)}
              className={[
                "flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm transition-colors",
                "border-l-2",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <button
          title={collapsed ? "Export" : undefined}
          onClick={onExport}
          className="flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Share className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Export</span>}
        </button>

        <button
          title={collapsed ? "Start over" : undefined}
          onClick={onReset}
          className="flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Start over</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="border-t px-1 py-1">
        <button
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onCollapse}
          className="flex items-center justify-center w-full rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
