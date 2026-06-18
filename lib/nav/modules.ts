import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FilePlus,
  FileText,
  CheckCircle,
  CalendarRange,
  Tags,
  BarChart3,
  UserCircle,
  Building2,
  Settings,
} from "lucide-react";
import type { RoleName } from "@/lib/types/auth";
import { LOAN_APPROVAL_NAV_ROLES } from "@/lib/rbac";

export type ModuleId = "leave" | "loans" | "users" | "profile";

export interface ModuleTab {
  id: ModuleId | "dashboard" | "appraisals";
  label: string;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles?: RoleName[];
  /** `data-tour` target for guided module tours */
  tourTarget?: string;
}

export interface ModuleConfig {
  id: ModuleId;
  sectionLabel: string;
  cta?: { label: string; href: string };
  navItems: SidebarNavItem[];
}

const HR_ROLES: RoleName[] = ["HR", "EXECUTIVE_DIRECTOR", "MANAGING_DIRECTOR"];

const LEAVE_APPROVER_ROLES: RoleName[] = [
  "TEAM_LEAD",
  "SUPERVISOR",
  "LINE_MANAGER",
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

export const MODULE_TABS: ModuleTab[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", disabled: true },
  { id: "leave", label: "Leave Management", href: "/leave" },
  { id: "loans", label: "Staff Loans", href: "/loans" },
  { id: "users", label: "Users", href: "/users" },
  { id: "appraisals", label: "Appraisals", href: "/appraisals", comingSoon: true },
];

export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  leave: {
    id: "leave",
    sectionLabel: "Leave Management",
    cta: { label: "Request Leave", href: "/leave/apply" },
    navItems: [
      { label: "Leave Dashboard", href: "/leave", icon: LayoutDashboard },
      {
        label: "Apply for Leave",
        href: "/leave/apply",
        icon: FilePlus,
        tourTarget: "leave-nav-apply",
      },
      {
        label: "Leave History",
        href: "/leave/history",
        icon: FileText,
        tourTarget: "leave-nav-history",
      },
      {
        label: "Approvals",
        href: "/leave/admin",
        icon: CheckCircle,
        allowedRoles: LEAVE_APPROVER_ROLES,
      },
      {
        label: "Leave Calendar",
        href: "/leave/calendar",
        icon: CalendarDays,
        tourTarget: "leave-nav-calendar",
      },
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
    ],
  },
  loans: {
    id: "loans",
    sectionLabel: "Staff Loans",
    cta: { label: "Apply for Loan", href: "/loans/apply" },
    navItems: [
      { label: "Dashboard", href: "/loans", icon: LayoutDashboard },
      { label: "Apply for Loan", href: "/loans/apply", icon: FilePlus },
      { label: "My Loans", href: "/loans/history", icon: FileText },
      {
        label: "Approvals",
        href: "/loans/admin",
        icon: CheckCircle,
        allowedRoles: [...LOAN_APPROVAL_NAV_ROLES],
      },
      {
        label: "Reports",
        href: "/loans/reports",
        icon: BarChart3,
        allowedRoles: ["HR"],
      },
      {
        label: "Loan settings",
        href: "/loans/settings",
        icon: Settings,
        allowedRoles: ["HR"],
      },
    ],
  },
  users: {
    id: "users",
    sectionLabel: "User Management",
    navItems: [
      { label: "Users", href: "/users", icon: Users },
      { label: "Departments", href: "/departments", icon: Building2 },
    ],
  },
  profile: {
    id: "profile",
    sectionLabel: "Account",
    navItems: [
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
  },
};

export function detectModule(pathname: string): ModuleId {
  if (pathname.startsWith("/loans")) return "loans";
  if (pathname.startsWith("/users") || pathname.startsWith("/departments") || pathname.startsWith("/units"))
    return "users";
  if (pathname.startsWith("/profile")) return "profile";
  return "leave";
}

export function isModuleTabActive(pathname: string, href: string): boolean {
  if (href === "/leave") {
    return pathname === "/leave" || pathname.startsWith("/leave/");
  }
  if (href === "/loans") {
    return pathname === "/loans" || pathname.startsWith("/loans/");
  }
  if (href === "/users") {
    return (
      pathname === "/users" ||
      pathname.startsWith("/users/") ||
      pathname.startsWith("/departments") ||
      pathname.startsWith("/units")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSidebarItemActive(pathname: string, href: string): boolean {
  if (href === "/leave" || href === "/loans") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function filterNavByRoles(
  items: SidebarNavItem[],
  userRoles: RoleName[],
  extraVisibleHrefs: string[] = []
): SidebarNavItem[] {
  return items.filter((item) => {
    if (extraVisibleHrefs.includes(item.href)) return true;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.some((r) => userRoles.includes(r));
  });
}
