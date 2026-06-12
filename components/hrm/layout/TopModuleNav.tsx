"use client";

import Link from "next/link";
import { Settings, HelpCircle, Sun, Moon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/hrm/notifications/NotificationsBell";
import { isModuleTabActive, type ModuleTab } from "@/lib/nav/modules";

interface TopModuleNavProps {
  pathname: string;
  tabs: ModuleTab[];
  dark: boolean;
  onToggleDark: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  userName?: string;
  userRoleLabel?: string;
  userInitials?: string;
}

export function TopModuleNav({
  pathname,
  tabs,
  dark,
  onToggleDark,
  onToggleSidebar,
  sidebarOpen,
  userName,
  userRoleLabel,
  userInitials = "??",
}: TopModuleNavProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 border-b border-outline-variant bg-surface/80 backdrop-blur-md pl-0 lg:pl-sidebar">
      <div className="flex h-16 items-center justify-between gap-4 px-gutter">
        <div className="flex flex-1 items-center gap-3">
          {onToggleSidebar ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="cursor-pointer rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high lg:hidden"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleDark}
            className="cursor-pointer rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationsBell />
          <button
            type="button"
            aria-label="Settings"
            className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high sm:block"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Help"
            className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high sm:block"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="mx-2 hidden h-6 w-px bg-outline-variant sm:block" />
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface-container-high sm:flex"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-white">
              {userInitials}
            </span>
            <span className="hidden min-w-0 text-left md:block">
              <span className="block truncate text-sm font-semibold text-on-surface">
                {userName ?? "Loading..."}
              </span>
              {userRoleLabel ? (
                <span className="block truncate text-[10px] text-on-surface-variant">
                  {userRoleLabel}
                </span>
              ) : null}
            </span>
          </Link>
        </div>
      </div>

      <nav
        className="flex h-12 items-center gap-6 overflow-x-auto px-gutter"
        aria-label="Module navigation"
      >
        {tabs.map((tab) => {
          if (tab.disabled) {
            return (
              <span
                key={tab.id}
                className="flex h-full shrink-0 cursor-not-allowed items-center px-1 text-sm font-medium text-on-surface-variant/50"
              >
                {tab.label}
              </span>
            );
          }

          if (tab.comingSoon) {
            return (
              <span
                key={tab.id}
                className="flex h-full shrink-0 cursor-not-allowed items-center gap-2 px-1 text-sm font-medium text-on-surface-variant/50"
              >
                {tab.label}
                <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold uppercase">
                  Coming Soon
                </span>
              </span>
            );
          }

          const isActive = isModuleTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative flex h-full shrink-0 items-center px-1 text-sm transition-colors",
                isActive
                  ? "font-bold text-primary"
                  : "font-medium text-on-surface-variant hover:text-primary"
              )}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-container" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
