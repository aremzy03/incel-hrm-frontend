"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  CheckCircle,
  CalendarDays,
  CalendarRange,
  Tags,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// ─── Nav config ───────────────────────────────────────────────────────────────

type RoleName =
  | "EMPLOYEE"
  | "LINE_MANAGER"
  | "TEAM_LEAD"
  | "SUPERVISOR"
  | "HR"
  | "EXECUTIVE_DIRECTOR"
  | "MANAGING_DIRECTOR";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** When set, the item is only visible to users that have at least one matching role. */
  allowedRoles?: RoleName[];
}

const HR_ROLES: RoleName[] = ["HR", "EXECUTIVE_DIRECTOR", "MANAGING_DIRECTOR"];

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/leave", icon: LayoutDashboard },
  { label: "Apply", href: "/leave/apply", icon: FilePlus },
  { label: "Leave History", href: "/leave/history", icon: FileText },
  {
    label: "Approvals",
    href: "/leave/admin",
    icon: CheckCircle,
    allowedRoles: [
      "TEAM_LEAD",
      "SUPERVISOR",
      "LINE_MANAGER",
      "HR",
      "EXECUTIVE_DIRECTOR",
      "MANAGING_DIRECTOR",
    ],
  },
  { label: "Calendar", href: "/leave/calendar", icon: CalendarDays },
  {
    label: "Public Holidays",
    href: "/leave/public-holidays",
    icon: CalendarRange,
    allowedRoles: HR_ROLES,
  },
  {
    label: "Leave Types",
    href: "/leave/types",
    icon: Tags,
    allowedRoles: HR_ROLES,
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function LeaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const navItems = useMemo(() => {
    const userRoles = (user?.roles ?? []) as RoleName[];
    return ALL_NAV_ITEMS.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some((r) => userRoles.includes(r));
    });
  }, [user?.roles]);

  return (
    /*
     * h-full fills the parent <main> (flex-1, height = 100vh - 56px).
     * This means <main> never scrolls for leave pages; instead the content
     * column below handles its own overflow-y-auto. The sidebar then fills
     * exactly the visible area without needing sticky/h-screen tricks.
     */
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-sidebar">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          // Fill the wrapper's height — keeps the sidebar pinned while the
          // content column scrolls independently.
          "flex h-full shrink-0 flex-col",
          "text-sidebar-foreground",
          // Collapse animation — overflow-hidden clips labels during transition
          "overflow-hidden transition-all duration-200 ease-in-out",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Header row — height matches top nav bar (h-14) */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!collapsed && (
            <span className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Leave
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav
          className="flex flex-col gap-0.5 px-2 py-3"
          aria-label="Leave module navigation"
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/leave" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/*
       * ── Content card ──────────────────────────────────────────────
       * rounded-tl-2xl gives the top-left curve that sits "above" the
       * sidebar surface. shadow elevates it visually off the bg-sidebar
       * backdrop. min-h ensures the card fills to the bottom of the
       * viewport even on short pages.
       */}
      {/* Content column scrolls independently; sidebar stays fixed above */}
      <div className="min-w-0 flex-1 overflow-y-auto rounded-tl-2xl bg-background shadow">
        {children}
      </div>
    </div>
  );
}
