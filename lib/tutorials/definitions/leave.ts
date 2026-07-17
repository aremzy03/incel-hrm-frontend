import type { TourDefinition } from "../types";

export const LEAVE_TOURS: TourDefinition[] = [
  {
    id: "leave-employee",
    module: "leave",
    label: "Leave basics",
    description: "Apply for leave, review your history, and use the leave calendar.",
    isPrimary: true,
    steps: [
      // —— Dashboard ——
      {
        route: "/leave",
        element: '[data-tour="leave-stats"]',
        title: "Leave dashboard",
        description:
          "Overview of your annual balance, leave taken this year, pending requests, and who is on leave today.",
      },
      {
        route: "/leave",
        element: '[data-tour="leave-apply-btn"]',
        title: "Apply for leave",
        description:
          "Click here to start a new leave request. You can also use the sidebar or the Request Leave button below it.",
      },
      {
        element: '[data-tour="leave-nav-apply"]',
        title: "Apply from the sidebar",
        description:
          "Apply for Leave is always available in the sidebar when you need to submit a new request.",
        side: "right",
        align: "start",
      },
      // —— Applying for leave ——
      {
        route: "/leave/apply",
        element: '[data-tour="leave-apply-intro"]',
        title: "Applying for leave",
        description:
          "Create a new leave request here. You can save a draft or submit when you are ready.",
      },
      {
        route: "/leave/apply",
        element: '[data-tour="leave-type-select"]',
        title: "Choose leave type",
        description:
          "Select Annual, Sick, Casual, or other types you are eligible for. Maternity and Paternity depend on your gender.",
      },
      {
        route: "/leave/apply",
        element: '[data-tour="leave-date-range"]',
        title: "Pick your dates",
        description:
          "Set start and end dates. Working days are calculated automatically, excluding weekends and public holidays.",
      },
      {
        route: "/leave/apply",
        element: '[data-tour="leave-cover-person"]',
        title: "Reliever",
        description:
          "Nominate an org-scoped colleague (team, unit, or department) to cover your duties. Required before submit for most leave types; optional when saving a draft.",
      },
      {
        route: "/leave/apply",
        element: '[data-tour="leave-approval-chain"]',
        title: "Approval workflow",
        description:
          "After submit, your request moves through Team Lead, Unit Supervisor (if applicable), Line Manager, HR, and Executive Director.",
        side: "left",
      },
      {
        route: "/leave/apply",
        element: '[data-tour="leave-submit-actions"]',
        title: "Save or submit",
        description:
          "Save as draft to finish later, or submit for approval. A line manager must be assigned to your department before you can submit.",
      },
      // —— Leave history ——
      {
        element: '[data-tour="leave-nav-history"]',
        title: "Leave history in the sidebar",
        description:
          "Open Leave History from the sidebar to review all your past and in-progress requests.",
        side: "right",
        align: "start",
      },
      {
        route: "/leave/history",
        element: '[data-tour="leave-history-intro"]',
        title: "Leave history",
        description:
          "All your leave requests live here — drafts, pending approvals, approved, and rejected.",
      },
      {
        route: "/leave/history",
        element: '[data-tour="leave-history-balances"]',
        title: "Balances at a glance",
        description:
          "See how many days you have used and remaining for each leave type this year.",
      },
      {
        route: "/leave/history",
        element: '[data-tour="leave-history-filters"]',
        title: "Filter your requests",
        description:
          "Narrow the list by status or leave type to find a specific request quickly.",
      },
      {
        route: "/leave/history",
        element: '[data-tour="leave-history-table"]',
        title: "Request details",
        description:
          "Open any row to view full details. You can cancel a request while it is still pending approval.",
      },
      // —— Leave calendar ——
      {
        element: '[data-tour="leave-nav-calendar"]',
        title: "Leave calendar in the sidebar",
        description:
          "Use Leave Calendar in the sidebar to see approved leave across your department.",
        side: "right",
        align: "start",
      },
      {
        route: "/leave/calendar",
        element: '[data-tour="leave-calendar-intro"]',
        title: "Leave calendar",
        description:
          "A monthly view of approved leave in your department so you can plan around colleagues' time off.",
      },
      {
        route: "/leave/calendar",
        element: '[data-tour="leave-calendar-view"]',
        title: "Switch view",
        description:
          "Toggle between the full department calendar and a view focused on your own approved leave.",
      },
      {
        route: "/leave/calendar",
        element: '[data-tour="leave-calendar-grid"]',
        title: "Monthly calendar",
        description:
          "Navigate months and see who is on leave each day. Annual and Casual leave cannot overlap for colleagues in the same team or unit.",
      },
    ],
  },
  {
    id: "leave-approver",
    module: "leave",
    label: "Leave approvals",
    description: "Review and action pending leave requests.",
    requiredRoles: [
      "TEAM_LEAD",
      "SUPERVISOR",
      "LINE_MANAGER",
      "HR",
      "EXECUTIVE_DIRECTOR",
      "MANAGING_DIRECTOR",
    ],
    steps: [
      {
        route: "/leave/admin",
        element: '[data-tour="leave-approvals-queue"]',
        title: "Approvals queue",
        description:
          "Pending leave requests that need your action appear here, scoped to your role and department.",
      },
      {
        route: "/leave/admin",
        element: '[data-tour="leave-approval-filters"]',
        title: "Search and filter",
        description:
          "Find requests by employee name, leave type, or status before approving or rejecting.",
      },
      {
        route: "/leave/admin",
        element: '[data-tour="leave-approval-actions"]',
        title: "Approve or reject",
        description:
          "Open a request to review dates and balance impact. Rejections should include a reason in the comment.",
      },
    ],
  },
  {
    id: "leave-hr",
    module: "leave",
    label: "Leave administration",
    description: "Manage public holidays and leave types.",
    requiredRoles: ["HR", "EXECUTIVE_DIRECTOR", "MANAGING_DIRECTOR"],
    steps: [
      {
        route: "/leave/public-holidays",
        element: '[data-tour="leave-holidays-upload"]',
        title: "Public holidays",
        description:
          "Upload a CSV of holidays so they are excluded from working-day calculations and highlighted in the date picker.",
      },
      {
        route: "/leave/public-holidays",
        element: '[data-tour="leave-holidays-list"]',
        title: "Holiday list",
        description: "Review holidays for the selected year after upload.",
      },
      {
        route: "/leave/types",
        element: '[data-tour="leave-types-list"]',
        title: "Leave types",
        description:
          "Configure leave types, default days, and policies that drive entitlements and validation rules.",
      },
    ],
  },
];
