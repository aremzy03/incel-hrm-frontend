"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { stitchCardClass } from "@/lib/design/field-styles";
import {
  LEAVE_SETTINGS_GROUPS,
  LEAVE_SETTINGS_HUB,
  getLeaveSettingsNavMeta,
  isLeaveSettingsNavActive,
} from "@/lib/nav/leave-settings";

function SettingsHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Leave settings"
        subtitle="Configure leave types, policies, calendars, and approval workflows in one place."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {LEAVE_SETTINGS_GROUPS.map((group) => (
          <section
            key={group.id}
            className={cn(stitchCardClass, "flex flex-col p-5 transition-colors hover:border-primary/30")}
          >
            <h2 className="text-title-sm font-semibold text-on-surface">{group.label}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{group.description}</p>
            <ul className="mt-4 space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="mt-0.5 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-on-surface group-hover:text-primary">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-on-surface-variant">
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant opacity-40 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function SettingsSubNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className={cn(stitchCardClass, "overflow-hidden p-2 lg:sticky lg:top-32 lg:w-60 lg:shrink-0")}
      aria-label="Leave settings sections"
    >
      <Link
        href={LEAVE_SETTINGS_HUB}
        aria-current={pathname === LEAVE_SETTINGS_HUB ? "page" : undefined}
        className={cn(
          "mb-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          pathname === LEAVE_SETTINGS_HUB
            ? "bg-secondary-container text-on-secondary-fixed"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        )}
      >
        <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
        Overview
      </Link>
      {LEAVE_SETTINGS_GROUPS.map((group) => (
        <div key={group.id} className="border-t border-outline-variant/60 px-1 py-2 first:border-t-0">
          <p className="px-2 py-1.5 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isLeaveSettingsNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-secondary-container font-semibold text-on-secondary-fixed"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function LeaveSettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHub = pathname === LEAVE_SETTINGS_HUB;
  const current = getLeaveSettingsNavMeta(pathname);

  if (isHub) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Leave Management", href: "/leave" },
            { label: "Leave settings" },
          ]}
        />
        <SettingsHub />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb
        items={[
          { label: "Leave Management", href: "/leave" },
          { label: "Leave settings", href: LEAVE_SETTINGS_HUB },
          ...(current ? [{ label: current.label }] : []),
        ]}
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsSubNav pathname={pathname} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
