"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";
import { TourBanner } from "@/components/hrm/tutorials/TourBanner";
import { canManageUsers } from "@/lib/rbac";
import type { RoleName } from "@/lib/types/auth";
import {
  MODULE_CONFIGS,
  MODULE_TABS,
  detectModule,
  type ModuleTab,
} from "@/lib/nav/modules";
import { hasRole } from "@/lib/rbac";
import { useLoanAccessFlags } from "@/lib/loans/access";
import { ModuleSidebar } from "./ModuleSidebar";
import { TopModuleNav } from "./TopModuleNav";
import "driver.js/dist/driver.css";
import "@/components/hrm/tutorials/tour-theme.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatRoles(roles: string[] | undefined | null): string {
  if (!roles?.length) return "";
  const unique = Array.from(new Set(roles.filter(Boolean)));
  unique.sort((a, b) => {
    if (a === "EMPLOYEE" && b !== "EMPLOYEE") return 1;
    if (b === "EMPLOYEE" && a !== "EMPLOYEE") return -1;
    return a.localeCompare(b);
  });
  return unique.map((r) => r.replace(/_/g, " ")).join(", ");
}

export function HrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState({ open: false, path: "" });
  const mobileSidebarOpen =
    mobileSidebar.open && mobileSidebar.path === pathname;

  const moduleId = detectModule(pathname);
  const moduleConfig = MODULE_CONFIGS[moduleId];
  const tourModule =
    moduleId === "leave" || moduleId === "loans" ? moduleId : null;
  const userRoles = (user?.roles ?? []) as RoleName[];
  const { hasReportAccess } = useLoanAccessFlags();

  const loanExtraNavHrefs =
    moduleId === "loans" && hasReportAccess && !hasRole(user, "HR")
      ? ["/loans/reports"]
      : [];

  const tabs = useMemo<ModuleTab[]>(() => {
    const base = MODULE_TABS.filter((t) => t.id !== "users");
    if (canManageUsers(user)) {
      const loansIdx = base.findIndex((t) => t.id === "loans");
      const usersTab = MODULE_TABS.find((t) => t.id === "users")!;
      const next = [...base];
      next.splice(loansIdx + 1, 0, usersTab);
      return next;
    }
    return base;
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <TourProvider module={tourModule}>
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="fixed top-0 left-0 z-50 hidden h-screen lg:block">
        <ModuleSidebar
          config={moduleConfig}
          userRoles={userRoles}
          extraVisibleHrefs={loanExtraNavHrefs}
          showTours={tourModule !== null}
          onLogout={() => logout()}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-inverse-surface/40 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebar({ open: false, path: pathname })}
          />
          <div className="fixed top-0 left-0 z-50 h-screen lg:hidden">
            <ModuleSidebar
              config={moduleConfig}
              userRoles={userRoles}
              extraVisibleHrefs={loanExtraNavHrefs}
              showTours={tourModule !== null}
              onNavigate={() => setMobileSidebar({ open: false, path: pathname })}
              onLogout={() => logout()}
            />
          </div>
        </>
      ) : null}

      <TopModuleNav
        pathname={pathname}
        tabs={tabs}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleSidebar={() =>
          mobileSidebarOpen
            ? setMobileSidebar({ open: false, path: pathname })
            : setMobileSidebar({ open: true, path: pathname })
        }
        sidebarOpen={mobileSidebarOpen}
        userName={user?.full_name}
        userRoleLabel={formatRoles(user?.roles)}
        userInitials={user ? getInitials(user.full_name) : "??"}
      />

      <main
        className={cn(
          "min-h-screen pt-32 pb-10",
          "pl-gutter pr-gutter lg:pl-sidebar"
        )}
      >
        <div className="lg:ml-gutter">
          {tourModule ? <TourBanner /> : null}
          {children}
        </div>
      </main>
    </div>
    </TourProvider>
  );
}
