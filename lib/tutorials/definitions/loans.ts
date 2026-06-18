import type { TourDefinition } from "../types";

export const LOANS_TOURS: TourDefinition[] = [
  {
    id: "loans-employee",
    module: "loans",
    label: "Staff loans",
    description: "Apply for loans and track applications.",
    isPrimary: true,
    steps: [
      {
        route: "/loans",
        element: '[data-tour="loans-stats"]',
        title: "Loans dashboard",
        description:
          "Overview of your draft applications, items pending approval, and active loans with repayments.",
      },
      {
        route: "/loans",
        element: '[data-tour="loans-apply-btn"]',
        title: "Apply for a loan",
        description: "Create a new loan application. It starts as a draft until you submit it.",
      },
      {
        route: "/loans/apply",
        element: '[data-tour="loans-type-select"]',
        title: "Loan type",
        description: "Select the loan product that matches your need.",
      },
      {
        route: "/loans/apply",
        element: '[data-tour="loans-amount-tenure"]',
        title: "Amount and tenure",
        description: "Enter the amount in NGN and repayment period between 1 and 12 months.",
      },
      {
        route: "/loans/apply",
        element: '[data-tour="loans-purpose"]',
        title: "Purpose",
        description: "Briefly explain why you need the loan. This is required before creating the draft.",
      },
      {
        route: "/loans/apply",
        element: '[data-tour="loans-confirmation-notice"]',
        title: "Staff confirmation",
        description:
          "Only confirmed staff can apply. HR must update your confirmation status if you see a warning here.",
      },
      {
        route: "/loans/history",
        element: '[data-tour="loans-history-table"]',
        title: "Loan history",
        description: "View all your applications, filter by status, and open any row for details.",
      },
      {
        route: "/loans/history",
        element: '[data-tour="loans-workflow-tip"]',
        title: "Submit and repayments",
        description:
          "Open a draft to submit it for approval. After HR disburses an approved loan, the repayment schedule appears on the request detail page.",
      },
    ],
  },
  {
    id: "loans-approver",
    module: "loans",
    label: "Loan approvals",
    description: "Review and action loan applications in your stage.",
    requiredRoles: [
      "LINE_MANAGER",
      "HR",
      "EXECUTIVE_DIRECTOR",
      "MANAGING_DIRECTOR",
    ],
    steps: [
      {
        route: "/loans/admin",
        element: '[data-tour="loans-approvals-queue"]',
        title: "Approvals queue",
        description:
          "Applications awaiting your role appear here — line manager, HR, Executive Director, or Managing Director depending on workflow stage.",
      },
      {
        route: "/loans/admin",
        element: '[data-tour="loans-approval-actions"]',
        title: "Approve or reject",
        description:
          "Review amount, tenure, and purpose. Reject with a comment, or approve to advance the application. Managing Director approval requires a comment.",
      },
    ],
  },
  {
    id: "loans-hr",
    module: "loans",
    label: "Loan administration",
    description: "Settings, reports, and HR loan actions.",
    requiredRoles: ["HR"],
    steps: [
      {
        route: "/loans/settings",
        element: '[data-tour="loans-settings-lm"]',
        title: "Line manager approval",
        description:
          "Toggle whether applications need line manager approval before HR review.",
      },
      {
        route: "/loans/settings",
        element: '[data-tour="loans-settings-observer"]',
        title: "Observer access",
        description:
          "Optionally grant a department or unit read-only observer access for Finance-style visibility.",
      },
      {
        route: "/loans/reports",
        element: '[data-tour="loans-reports-nav"]',
        title: "Loan reports",
        description:
          "Outstanding loans, schedule summary, and per-employee ledgers. Export CSV for offline analysis.",
      },
      {
        route: "/loans/admin",
        element: '[data-tour="loans-hr-actions"]',
        title: "Disburse and manage",
        description:
          "After final approval, HR disburses loans to activate repayment. HR can also liquidate active loans or handle resignation.",
      },
    ],
  },
  {
    id: "loans-observer",
    module: "loans",
    label: "Loan observer",
    description: "Read-only loan visibility for observers.",
    requiresObserver: true,
    steps: [
      {
        route: "/loans/reports",
        element: '[data-tour="loans-reports-nav"]',
        title: "Reports access",
        description:
          "As an observer you can view loan reports without approval permissions.",
      },
      {
        route: "/loans/history",
        element: '[data-tour="loans-history-table"]',
        title: "Application list",
        description: "Browse loan applications across the organisation in read-only mode.",
      },
    ],
  },
];
