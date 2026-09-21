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
  const { user } = useAuth();
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
