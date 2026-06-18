"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLoanReportAccess } from "@/lib/api/loans";
import {
  canAccessLoanReports,
  isLoanObserver,
  isLoanPrivilegedList,
} from "@/lib/rbac";

export function useLoanAccessFlags() {
  const { user } = useAuth();
  const { hasAccess: hasReportAccess, isLoading } = useLoanReportAccess();

  const observer = isLoanObserver(user, hasReportAccess);

  return {
    hasReportAccess: canAccessLoanReports(user, hasReportAccess),
    isObserver: observer,
    isPrivilegedList: isLoanPrivilegedList(user, hasReportAccess),
    isLoading,
  };
}
