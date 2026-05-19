"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsersTab } from "@/components/hrm/users/UsersTab";

const TABS = [
  { id: "users", label: "Users", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const pathname = usePathname();
  const onDepartments = pathname.startsWith("/departments");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-1 border-b border-border/80 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          User Management
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Manage users, departments, and role assignments.
        </p>
      </div>

      <div className="flex w-fit flex-wrap items-center gap-1 rounded-full border border-border/90 bg-muted/50 p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activeTab === tab.id && !onDepartments
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
        <Link
          href="/departments"
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            onDepartments
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
              : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          Departments
        </Link>
      </div>

      <div>{activeTab === "users" && <UsersTab />}</div>
    </div>
  );
}
