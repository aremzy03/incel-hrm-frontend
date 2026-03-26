import type { User } from "@/lib/types/auth";
import type { LeaveRequest, LeaveStatus } from "@/lib/types/leave";

type RoleName =
  | "EMPLOYEE"
  | "LINE_MANAGER"
  | "SUPERVISOR"
  | "HR"
  | "EXECUTIVE_DIRECTOR"
  | "MANAGING_DIRECTOR";

const APPROVER_STEP: Record<RoleName, LeaveStatus | null> = {
  EMPLOYEE: null,
  SUPERVISOR: "PENDING_SUPERVISOR",
  LINE_MANAGER: "PENDING_MANAGER",
  HR: "PENDING_HR",
  EXECUTIVE_DIRECTOR: "PENDING_ED",
  // Kept for backward compatibility with existing UI role list
  MANAGING_DIRECTOR: "PENDING_ED",
};

function getUserSupervisedUnitId(user: User | null | undefined): string | null {
  const u = user?.supervised_unit;
  if (u && typeof u === "object" && u.id) return u.id;
  return null;
}

function getEmployeeUnitId(req: LeaveRequest | null | undefined): string | null {
  const unit = req?.employee?.unit;
  if (unit && typeof unit === "object" && unit.id) return unit.id;
  return null;
}

export function canUserActOnLeaveRequest(
  user: User | null | undefined,
  request: LeaveRequest | null | undefined
): { canApprove: boolean; canReject: boolean } {
  if (!user || !request) return { canApprove: false, canReject: false };

  const status = request.status as LeaveStatus;
  const roles = (user.roles ?? []) as RoleName[];

  if (status === "PENDING_SUPERVISOR") {
    if (!roles.includes("SUPERVISOR")) return { canApprove: false, canReject: false };
    const userSupervisedUnitId = getUserSupervisedUnitId(user);
    const employeeUnitId = getEmployeeUnitId(request);
    if (!userSupervisedUnitId || !employeeUnitId)
      return { canApprove: false, canReject: false };
    const ok = userSupervisedUnitId === employeeUnitId;
    return { canApprove: ok, canReject: ok };
  }

  const can = roles.some((r) => {
    const step = APPROVER_STEP[r];
    return step ? status === step : false;
  });

  return { canApprove: can, canReject: can };
}

