"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useDepartmentDetail,
  useDepartments,
} from "@/lib/api/departments";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Building2, Loader2 } from "lucide-react";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

function getLineManagerDisplay(
  lm: string | { first_name: string; last_name: string; email: string } | null
): string {
  if (!lm) return "—";
  if (typeof lm === "string") return lm;
  return getMemberName(lm);
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useDepartmentDetail(id);
  const { data: deptsData } = useDepartments();
  const [tab, setTab] = useState<"members" | "units">("members");

  const departments = deptsData?.results ?? [];
  const dept = departments.find((d) => d.id === id);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Department" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Department not found."}
        </div>
      </div>
    );
  }

  const { department, members, units } = data;
  const lineManager = department.line_manager;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/users"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <PageHeader title={department.name} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Department summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {department.name}
              </h2>
              {department.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {department.description}
                </p>
              )}
              {lineManager && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Line manager:
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {getLineManagerDisplay(lineManager)}
                  </span>
                  {typeof lineManager === "object" && (
                    <span className="text-xs text-muted-foreground">
                      {lineManager.email}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("members")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "members"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Members ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("units")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "units"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Units ({units.length})
            </button>
          </div>

          <div className="p-4">
            {tab === "members" && (
              <div className="overflow-x-auto">
                {members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this department.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {getMemberName(m)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "units" && (
              <div className="space-y-4">
                {units.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No units in this department.
                  </p>
                ) : (
                  units.map((u) => (
                    <Link
                      key={u.id}
                      href={`/units/${u.id}`}
                      className="block cursor-pointer rounded-lg border border-border p-4 transition-colors duration-200 hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {u.name}
                          </h3>
                          {u.supervisor && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Supervisor: {getMemberName(u.supervisor)}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {u.members?.length ?? 0} member
                          {(u.members?.length ?? 0) !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
