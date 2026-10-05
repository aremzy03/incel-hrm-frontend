"use client";

import Link from "next/link";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { canManageLeaveSettings } from "@/lib/leave/access";

export function HrOnly({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8" aria-busy="true">
        <div className="h-5 w-48 animate-pulse rounded-md bg-surface-container-high" />
        <div className="space-y-3">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container-high" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded-md bg-surface-container-high" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-surface-container-high" />
        <p className="sr-only">Checking whether you can manage this setting.</p>
      </div>
    );
  }

  if (!canManageLeaveSettings(user)) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader title={title} subtitle="HR access required" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage this leave setting.
        </p>
        <Link href="/leave" className="text-sm text-primary hover:underline">
          Back to Leave
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
