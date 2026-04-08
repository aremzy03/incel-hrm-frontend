"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  DollarSign,
  Star,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canManageUsers } from "@/lib/rbac";
import { NotificationsBell } from "@/components/hrm/notifications/NotificationsBell";

// ─── Nav config ───────────────────────────────────────────────────────────────

const BASE_MODULES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disabled: true },
  { label: "Leave Management", href: "/leave", icon: CalendarDays },
];

const USERS_MODULE = { label: "Users", href: "/users", icon: Users };

const soonModules = [
  { label: "Staff Loans", icon: DollarSign },
  { label: "Appraisals", icon: Star },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function HRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeModules = useMemo(
    () =>
      [
        ...BASE_MODULES,
        ...(canManageUsers(user) ? [USERS_MODULE] : []),
      ],
    [user]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top navigation bar ──────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-md p-1.5 text-sidebar-foreground transition hover:bg-sidebar-accent lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Logo */}
        <Link
          href="/leave"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2.5 mr-2"
        >
          <img
            src="/incel-icon.png"
            alt="Incel Group logo"
            className="h-10 w-10"
          />
          <div className="hidden sm:block leading-none">
            <span className="block font-serif font-semibold text-base text-foreground">
              Incel Group
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
              HR Portal
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-sidebar-border lg:block" />

        {/* Desktop module nav */}
        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Main navigation"
        >
          {activeModules.map((item) => {
            const isActive =
              item.href === "/leave"
                ? pathname === "/leave" || pathname.startsWith("/leave/")
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            if ("disabled" in item && item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex cursor-not-allowed select-none items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground opacity-50"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {soonModules.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed select-none items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground opacity-50"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Soon
              </span>
            </div>
          ))}
        </nav>

        {/* Push right-side actions to the far right */}
        <div className="flex-1" />

        {/* Dark mode + bell */}
        <div className="flex items-center gap-1">
          <button
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark((d) => !d)}
            className="rounded-md p-1.5 text-sidebar-foreground transition hover:bg-sidebar-accent"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationsBell />
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-sidebar-border" />

        {/* User pill */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="View profile"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user ? getInitials(user.full_name) : "??"}
            </div>
          <div className="hidden leading-none sm:block">
            <p className="text-sm font-medium text-sidebar-foreground">
              {user?.full_name ?? "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.roles?.[0] ?? ""}
            </p>
          </div>
          </Link>
          <button
            aria-label="Logout"
            onClick={() => logout()}
            className="ml-1 rounded-md p-1.5 text-muted-foreground transition hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown nav ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="shrink-0 border-b border-sidebar-border bg-sidebar px-4 py-2 lg:hidden">
          <nav className="space-y-0.5">
            {activeModules.map((item) => {
              const isActive =
                item.href === "/leave"
                  ? pathname === "/leave" || pathname.startsWith("/leave/")
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");

              if ("disabled" in item && item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            {soonModules.map((item) => (
              <div
                key={item.label}
                className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  Soon
                </span>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
