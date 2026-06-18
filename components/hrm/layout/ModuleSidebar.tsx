"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ModuleConfig,
  isSidebarItemActive,
  filterNavByRoles,
} from "@/lib/nav/modules";
import type { RoleName } from "@/lib/types/auth";
import { TourReplayPanel } from "@/components/hrm/tutorials/TourReplayPanel";

interface ModuleSidebarProps {
  config: ModuleConfig;
  userRoles: RoleName[];
  extraVisibleHrefs?: string[];
  showTours?: boolean;
  onNavigate?: () => void;
  onLogout?: () => void;
}

export function ModuleSidebar({
  config,
  userRoles,
  extraVisibleHrefs = [],
  showTours = false,
  onNavigate,
  onLogout,
}: ModuleSidebarProps) {
  const pathname = usePathname();
  const navItems = filterNavByRoles(config.navItems, userRoles, extraVisibleHrefs);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low">
      <div className="p-6">
        <Link
          href="/leave"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <Image
            src="/hrm.svg"
            alt="Incel Group"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
            priority
          />
          <div className="min-w-0">
            <h1 className="text-headline-md font-bold text-primary">
              Incel Group
            </h1>
            <p className="text-label-md text-on-surface-variant">HR Portal</p>
          </div>
        </Link>
      </div>

      <nav
        className="mt-2 flex-1 overflow-y-auto"
        aria-label={`${config.sectionLabel} navigation`}
      >
        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          {config.sectionLabel}
        </div>
        {navItems.map((item) => {
          const isActive = isSidebarItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tourTarget}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-body-md transition-colors duration-200",
                isActive
                  ? "border-l-4 border-primary-container bg-secondary-container font-bold text-on-secondary-fixed"
                  : "border-l-4 border-transparent text-on-surface-variant hover:bg-surface-variant"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {config.cta ? (
        <div className="p-4">
          <Link
            href={config.cta.href}
            onClick={onNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-label-md font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {config.cta.label}
          </Link>
        </div>
      ) : null}

      {showTours ? <TourReplayPanel onNavigate={onNavigate} /> : null}

      {onLogout ? (
        <div className="border-t border-outline-variant p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      ) : null}
    </aside>
  );
}
