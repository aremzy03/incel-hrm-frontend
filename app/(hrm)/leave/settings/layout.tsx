import { HrOnly } from "@/components/hrm/leave/HrOnly";
import { LeaveSettingsShell } from "@/components/hrm/leave/LeaveSettingsShell";

export default function LeaveSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HrOnly title="Leave settings">
      <LeaveSettingsShell>{children}</LeaveSettingsShell>
    </HrOnly>
  );
}
