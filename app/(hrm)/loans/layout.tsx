"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  CheckCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LOAN_APPROVER_ROLES } from "@/lib/rbac";
import type { RoleName } from "@/lib/types/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles?: RoleName[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/loans", icon: LayoutDashboard },
  { label: "Apply for Loan", href: "/loans/apply", icon: FilePlus },
  { label: "My Loans", href: "/loans/history", icon: FileText },
  {
    label: "Approvals",
    href: "/loans/admin",
    icon: CheckCircle,
    allowedRoles: [...LOAN_APPROVER_ROLES],
  },
  {
    label: "Reports",
    href: "/loans/reports",
    icon: BarChart3,
    allowedRoles: ["HR"],
  },
];

export default function LoansLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-sidebar">
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col",
          "text-sidebar-foreground",
          "overflow-hidden transition-all duration-200 ease-in-out",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!collapsed && (
            <span className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Staff Loans
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div
          className={cn(
            "shrink-0 px-2 pb-2",
            collapsed && "flex justify-center"
          )}
        >
          {collapsed ? (
            <Button
              nativeButton={false}
              render={
                <Link href="/loans/apply" aria-label="Apply for loan" />
              }
              size="icon-lg"
              className="shrink-0 rounded-full"
            >
              <FilePlus className="size-4" />
            </Button>
          ) : (
            <Button
              nativeButton={false}
              render={<Link href="/loans/apply" />}
              size="lg"
              className="h-9 w-full gap-2 rounded-full px-3 text-sm font-medium shadow-sm"
            >
              <FilePlus className="size-4 shrink-0" />
              Apply for loan
            </Button>
          )}
        </div>

        <nav
          className="flex flex-col gap-0.5 px-2 py-2"
          aria-label="Staff loans navigation"
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/loans" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-full px-2.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/90"
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

      <div className="min-w-0 flex-1 overflow-y-auto rounded-tl-2xl border-l border-t border-border bg-background shadow-sm">
        {children}
      </div>
    </div>
  );
}
