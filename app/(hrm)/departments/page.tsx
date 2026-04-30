"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DepartmentsTab } from "@/components/hrm/users/DepartmentsTab";

export default function DepartmentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Departments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage departments and membership.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        <span
          className={cn(
            "flex items-center gap-2 rounded-lg bg-background px-4 py-1.5 text-sm font-medium text-foreground shadow-sm"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          Departments
        </span>
        <Link
          href="/users"
          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:text-foreground"
        >
          Users
        </Link>
      </div>

      <DepartmentsTab />
    </div>
  );
}

