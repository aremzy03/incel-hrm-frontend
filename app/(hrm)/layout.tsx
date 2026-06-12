"use client";

import { HrmShell } from "@/components/hrm/layout/HrmShell";

export default function HRMLayout({ children }: { children: React.ReactNode }) {
  return <HrmShell>{children}</HrmShell>;
}
