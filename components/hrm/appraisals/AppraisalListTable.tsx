"use client";

import Link from "next/link";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { AppraisalStatusBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { PerformanceTierBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { formatAppraisalDate } from "@/lib/appraisals/utils";
import type { EmployeeAppraisalSummary } from "@/lib/types/appraisal";

const EMPLOYEE_COLUMNS = [
  { key: "cycle", label: "Cycle" },
  { key: "status", label: "Status" },
  { key: "score", label: "My Score" },
  { key: "tier", label: "Performance" },
  { key: "deadline", label: "Deadline" },
  { key: "action", label: "" },
];

const TEAM_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "cycle", label: "Cycle" },
  { key: "status", label: "Status" },
  { key: "selfScore", label: "Self Score" },
  { key: "supScore", label: "Mgr Score" },
  { key: "tier", label: "Performance" },
  { key: "deadline", label: "Deadline" },
  { key: "action", label: "" },
];

interface AppraisalListTableProps {
  appraisals: EmployeeAppraisalSummary[];
  mode?: "employee" | "team" | "all";
  emptyMessage?: string;
  header?: React.ReactNode;
  isLoading?: boolean;
}

function fullName(a: EmployeeAppraisalSummary): string {
  return `${a.employee?.first_name ?? ""} ${a.employee?.last_name ?? ""}`.trim() || "—";
}

export function AppraisalListTable({
  appraisals,
  mode = "employee",
  emptyMessage = "No appraisals found.",
  header,
}: AppraisalListTableProps) {
  const columns = mode === "employee" ? EMPLOYEE_COLUMNS : TEAM_COLUMNS;
  const list = Array.isArray(appraisals) ? appraisals : [];

  const rows = list.map((a) => {
    const base = {
      cycle: (
        <span className="font-medium text-foreground">{a.cycle?.name ?? "—"}</span>
      ),
      status: <AppraisalStatusBadge status={a.status} />,
      tier: (
        <PerformanceTierBadge
          category={a.performance_category}
          score={a.supervisor_score_total}
        />
      ),
      deadline: (
        <span className="text-muted-foreground">
          {formatAppraisalDate(a.cycle?.submission_deadline)}
        </span>
      ),
      action: (
        <Link
          href={`/appraisals/${a.id}`}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open
        </Link>
      ),
    };

    if (mode === "employee") {
      return {
        ...base,
        score: (
          <span className="text-muted-foreground">
            {a.self_score_total !== "0.00"
              ? `${Number(a.self_score_total).toFixed(1)}%`
              : "—"}
          </span>
        ),
      };
    }

    return {
      ...base,
      employee: (
        <span className="font-medium text-foreground">{fullName(a)}</span>
      ),
      selfScore: (
        <span className="text-muted-foreground">
          {a.self_score_total !== "0.00"
            ? `${Number(a.self_score_total).toFixed(1)}%`
            : "—"}
        </span>
      ),
      supScore: (
        <span className="text-muted-foreground">
          {a.supervisor_score_total !== "0.00"
            ? `${Number(a.supervisor_score_total).toFixed(1)}%`
            : "—"}
        </span>
      ),
    };
  });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      emptyMessage={emptyMessage}
      header={header}
    />
  );
}
