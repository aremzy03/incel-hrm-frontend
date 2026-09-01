import {
  CalendarRange,
  GitBranch,
  ScrollText,
  Settings,
  Tags,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

export const LEAVE_SETTINGS_HUB = "/leave/settings";

export interface LeaveSettingsNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface LeaveSettingsNavGroup {
  id: string;
  label: string;
  description: string;
  items: LeaveSettingsNavItem[];
}

/** Grouped leave settings navigation (HR only). */
export const LEAVE_SETTINGS_GROUPS: LeaveSettingsNavGroup[] = [
  {
    id: "general",
    label: "General",
    description: "Organisation-wide leave year, notifications, SLA, and HR balance tools.",
    items: [
      {
        label: "General settings",
        href: `${LEAVE_SETTINGS_HUB}/general`,
        description: "Leave year, cross-year rules, notifications, encashment, and accrual preview.",
        icon: Settings,
      },
    ],
  },
  {
    id: "types-policies",
    label: "Leave types & policies",
    description: "Entitlements, rules, and which employees receive which policy pack.",
    items: [
      {
        label: "Leave types",
        href: `${LEAVE_SETTINGS_HUB}/types`,
        description: "Codes, active status, fallback days, and calendar colours.",
        icon: Tags,
      },
      {
        label: "Policies",
        href: `${LEAVE_SETTINGS_HUB}/policies`,
        description: "Draft, publish, clone, and archive versioned leave policies.",
        icon: ScrollText,
      },
      {
        label: "Policy assignments",
        href: `${LEAVE_SETTINGS_HUB}/assignments`,
        description: "Map policies to departments, teams, or individual employees.",
        icon: GitBranch,
      },
    ],
  },
  {
    id: "calendars-holidays",
    label: "Calendars & holidays",
    description: "Working-day schedules and holiday lists used in leave calculations.",
    items: [
      {
        label: "Calendars",
        href: `${LEAVE_SETTINGS_HUB}/calendars`,
        description: "Working and holiday calendar definitions and assignments.",
        icon: CalendarRange,
      },
      {
        label: "Public holidays",
        href: `${LEAVE_SETTINGS_HUB}/public-holidays`,
        description: "Upload and review organisation public holidays (CSV).",
        icon: CalendarRange,
      },
    ],
  },
  {
    id: "approval",
    label: "Approval",
    description: "Configurable sequential approval chains.",
    items: [
      {
        label: "Approval workflows",
        href: `${LEAVE_SETTINGS_HUB}/workflows`,
        description: "Build, simulate, and maintain approval templates.",
        icon: CheckCircle,
      },
    ],
  },
];

export const LEAVE_SETTINGS_NAV_ITEMS = LEAVE_SETTINGS_GROUPS.flatMap((g) => g.items);

export function isLeaveSettingsPath(pathname: string): boolean {
  return pathname === LEAVE_SETTINGS_HUB || pathname.startsWith(`${LEAVE_SETTINGS_HUB}/`);
}

export function isLeaveSettingsNavActive(pathname: string, href: string): boolean {
  if (href.endsWith("/policies")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getLeaveSettingsNavMeta(pathname: string): LeaveSettingsNavItem | null {
  return (
    LEAVE_SETTINGS_NAV_ITEMS.find((item) => isLeaveSettingsNavActive(pathname, item.href)) ??
    null
  );
}
