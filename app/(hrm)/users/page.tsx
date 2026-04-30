"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsersTab } from "@/components/hrm/users/UsersTab";

const TABS = [
  { id: "users", label: "Users", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          User Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, departments, and role assignments.
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
        <Link
          href="/departments"
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          Departments
        </Link>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}
