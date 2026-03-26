"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUnitDetail } from "@/lib/api/units";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Loader2 } from "lucide-react";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

export default function UnitDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useUnitDetail(id);

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
        <PageHeader title="Unit" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Unit not found."}
        </div>
      </div>
    );
  }

  const { name, department, supervisor, members } = data;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={department ? `/departments/${department.id}` : "/users"}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {department?.name ?? "Users"}
        </Link>
      </div>

      <PageHeader title={name} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Unit summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{name}</h2>
              {department && (
                <Link
                  href={`/departments/${department.id}`}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  {department.name}
                </Link>
              )}
              {supervisor && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Supervisor:
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {getMemberName(supervisor)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {supervisor.email}
                  </span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {members?.length ?? 0} member
                {(members?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-medium text-foreground">Members</h3>
          </div>
          <div className="p-4">
            {!members?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No members in this unit.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
