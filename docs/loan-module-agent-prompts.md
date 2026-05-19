# Staff Loans Module — Frontend Agent Prompt Playbook

Sequential prompts for an AI coding agent to implement the **Staff Loans** module in `incel-hrm-frontend` from foundation through HR finance reports. Each prompt is self-contained: copy one block into a fresh agent session and run it before moving to the next.

**Backend:** Read-only reference in `../incel-hrm-backend/` (API already implemented).  
**Mirror:** Leave module patterns in this repo (`app/(hrm)/leave/`, `lib/types/leave.ts`, `lib/leave/approval.ts`).

---

## How to use this playbook

1. Run prompts **in numeric order** (1 → 18). Do not skip foundation prompts (2–5).
2. Work **only** in `incel-hrm-frontend`. Do not change the Django backend unless the user explicitly asks.
3. Before Prompt 1, ensure the backend is running and migrations are applied (`loan` app).
4. After each prompt: run `npm run lint` and `npm run build` from `incel-hrm-frontend/`, then smoke-test the routes listed in that prompt’s acceptance criteria.
5. All API calls go through the existing BFF: `lib/api-client.ts` → `/api/proxy/{path}` with `credentials: "include"`.
6. API paths below are **proxy paths** (no `/api/v1/` prefix in the client).

---

## Prompt index

| # | Phase | Title | Primary files / routes | Roles |
|---|-------|-------|------------------------|-------|
| 1 | Discovery | Read Leave + Loan API contract | — (checklist only) | All |
| 2 | Foundation | Loan types + status constants | `lib/types/loan.ts` | All |
| 3 | Foundation | API hooks layer | `lib/api/loans.ts` | All |
| 4 | Foundation | Approval rules | `lib/loans/approval.ts` | HR, ED, MD |
| 5 | Foundation | RBAC helpers | `lib/rbac.ts` | HR, ED, MD |
| 6 | Shell | Top nav + module layout | `app/(hrm)/layout.tsx`, `app/(hrm)/loans/layout.tsx` | All |
| 7 | Employee | Loans dashboard | `app/(hrm)/loans/page.tsx` | All |
| 8 | Employee | Apply for loan | `app/(hrm)/loans/apply/page.tsx` | Employee |
| 9 | Employee | My loan history | `app/(hrm)/loans/history/page.tsx` | All |
| 10 | Shared | Loan detail page | `app/(hrm)/loans/requests/[id]/page.tsx` | All |
| 11 | Workflow | Employee draft actions | Detail page (PATCH, submit) | Employee |
| 12 | Workflow | Approver actions | Detail page (approve, reject) | HR, ED, MD |
| 13 | HR | Approvals queue | `app/(hrm)/loans/admin/page.tsx` | HR, ED, MD |
| 14 | HR | Disburse + schedule display | Detail page | HR |
| 15 | HR | Liquidate + resignation | Detail page | HR |
| 16 | Privileged | Approval logs panel | Detail page or component | HR, ED, MD |
| 17 | HR | Finance reports | `app/(hrm)/loans/reports/page.tsx` | HR |
| 18 | Polish | Errors, loading, empty states | Loans module-wide | All |

---

## Sequential prompts

---

### Prompt 1 — Discovery: Read Leave + Loan API contract

**Role:** You are a senior frontend engineer onboarding to the Incel HRM Next.js application.

**Context:** Read these files before writing any loan UI code:

- Backend contract: `../incel-hrm-backend/README.md` (section **Loan management**)
- Backend serializers: `../incel-hrm-backend/apps/loan/serializers.py`
- Backend views (workflow + reports): `../incel-hrm-backend/apps/loan/views.py`
- Frontend patterns to mirror:
  - `lib/api-client.ts`
  - `lib/types/leave.ts`
  - `lib/leave/approval.ts`
  - `app/(hrm)/leave/layout.tsx`
  - `app/(hrm)/leave/requests/[id]/page.tsx`
  - `app/(hrm)/leave/admin/page.tsx`
- Current placeholder: `app/(hrm)/loans/page.tsx` (`ComingSoon`)
- Top nav: `app/(hrm)/layout.tsx` (Staff Loans is in `soonModules`, not linked)

**Task:** Produce a **short implementation checklist** (markdown bullet list, max 25 items) covering: routes to create, TypeScript types needed, React Query hooks, role-gated nav items, workflow actions per status, and HR-only report pages. Do **not** write application code in this step.

**Constraints:**

- Checklist must align with backend statuses: `DRAFT`, `PENDING_HR`, `PENDING_ED`, `PENDING_MD`, `APPROVED`, `REJECTED`, `ACTIVE`, `CLOSED`, `LIQUIDATED`.
- Note that `DELETE` on loan applications returns **405** (do not implement delete UI).
- Note eligibility: confirmed staff only; one active/approved loan at a time (enforced on create and submit).

**Output format:** Markdown checklist grouped by: Foundation, Routes, Employee flows, Approver flows, HR operations, Reports, Polish.

**Acceptance criteria:**

- [ ] Checklist mentions all proxy API paths listed in Appendix A
- [ ] Approval chain HR → ED → MD is documented
- [ ] MD approve and all rejects require `comment` in checklist

---

### Prompt 2 — Foundation: Loan types + status constants

**Role:** You are a senior TypeScript engineer on the Incel HRM frontend.

**Context:** Mirror `lib/types/leave.ts` for naming and display maps. Backend read shape is in `LoanApplicationReadSerializer` and `LoanTypeSerializer` (`../incel-hrm-backend/apps/loan/serializers.py`).

**Task:** Create `lib/types/loan.ts` with:

- `LoanStatus` union type (all 9 statuses)
- `LOAN_STATUS_DISPLAY: Record<LoanStatus, string>` (human-readable labels)
- `LoanType`, `LoanEmployeeMinimal`, `LoanRepaymentScheduleItem`, `LoanApplication`, `LoanApprovalLog`
- `LoanApplicationCreatePayload` (`loan_type`, `amount`, `tenure_months`, `purpose`)
- `LoanApplicationPatchPayload` (partial of create fields + optional `loan_type` for HR)
- `PaginatedLoanList` or reuse a generic paginated wrapper if one exists in leave types
- Report types: `OutstandingLoanRow`, `ScheduleSummaryMonth`, `EmployeeLoanLedgerResponse`

**Constraints:**

- `amount`, `monthly_installment`, `outstanding_balance` as `string` (decimal from API) or `number` — **match leave** if leave uses strings for money.
- `employee` on read responses: `{ first_name, last_name, email }` (no `id` in nested employee serializer — use top-level `id` on application).
- `repayment_schedule` items: `installment_number`, `due_date`, `amount_due`.
- Export types used by later prompts; no React components in this file.

**Output format:** Single new file `lib/types/loan.ts`.

**Acceptance criteria:**

- [ ] File compiles with `tsc` / `npm run build`
- [ ] Every backend status from serializers is represented
- [ ] `LOAN_STATUS_DISPLAY` covers all statuses

---

### Prompt 3 — Foundation: API hooks layer

**Role:** You are a senior frontend engineer implementing the loan API integration layer.

**Context:**

- Use `apiGet`, `apiPost`, `apiPatch` from `lib/api-client.ts`
- Proxy paths (no `/api/v1/` prefix):
  - `loan-types/`
  - `loan-applications/` (GET list, POST create)
  - `loan-applications/{id}/` (GET, PATCH)
  - `loan-applications/{id}/submit/`
  - `loan-applications/{id}/approve/`
  - `loan-applications/{id}/reject/`
  - `loan-applications/{id}/disburse/`
  - `loan-applications/{id}/liquidate/`
  - `loan-applications/{id}/handle-resignation/`
  - `loan-applications/{id}/logs/`
  - `loans/reports/outstanding/?loan_type=&employee=&format=csv`
  - `loans/reports/schedule-summary/?format=csv`
  - `loans/reports/employee-ledger/{employeeId}/?format=csv`
- Reference: `lib/api/leave-types.ts` for React Query hook style

**Task:** Create `lib/api/loans.ts` with:

- Stable query keys: `loanKeys.all`, `loanKeys.list(filters)`, `loanKeys.detail(id)`, `loanKeys.types`, `loanKeys.logs(id)`, report keys
- `useLoanTypes()`, `useLoanApplications(params?)`, `useLoanApplication(id)`
- Mutations: `useCreateLoanApplication`, `usePatchLoanApplication`, `useSubmitLoan`, `useApproveLoan`, `useRejectLoan`, `useDisburseLoan`, `useLiquidateLoan`, `useHandleResignationLoan`
- `useLoanLogs(id)` — only call when enabled (privileged users)
- Report hooks: `useOutstandingLoansReport`, `useScheduleSummaryReport`, `useEmployeeLedgerReport`
- Helper `downloadLoanReportCsv(pathWithQuery)` — `window.open` or fetch blob for `?format=csv` with credentials

**Constraints:**

- List query params for privileged users: `employee`, `status`, `loan_type` (match backend `get_queryset`)
- POST approve/reject/disburse bodies: `{ comment?: string }`; reject **must** send non-empty `comment`
- Invalidate `loanKeys.detail` and `loanKeys.list` after successful mutations
- Do not implement DELETE

**Output format:** `lib/api/loans.ts` only.

**Acceptance criteria:**

- [ ] All endpoints from Appendix A have a hook or documented function
- [ ] Mutations invalidate relevant queries
- [ ] TypeScript types imported from `lib/types/loan.ts`

---

### Prompt 4 — Foundation: Approval rules

**Role:** You are a frontend engineer implementing loan workflow authorization logic.

**Context:** Backend mapping (`../incel-hrm-backend/apps/loan/views.py`):

| Status | Approve role | Reject role |
|--------|--------------|-------------|
| `PENDING_HR` | HR | HR |
| `PENDING_ED` | EXECUTIVE_DIRECTOR | EXECUTIVE_DIRECTOR |
| `PENDING_MD` | MANAGING_DIRECTOR | MANAGING_DIRECTOR |

Mirror `lib/leave/approval.ts` API: export `canUserActOnLoanApplication(user, loan) → { canApprove, canReject }`.

**Task:** Create `lib/loans/approval.ts` with:

- `canUserActOnLoanApplication(user, loan)`
- `canEmployeeEditLoan(user, loan)` — owner + `DRAFT` only
- `canEmployeeSubmitLoan(user, loan)` — owner + `DRAFT`
- `canHrPatchLoan(user, loan)` — HR + not terminal (`REJECTED`, `CLOSED`, `LIQUIDATED`)
- `canHrDisburse(user, loan)` — HR + `APPROVED`
- `canHrLiquidate(user, loan)` — HR + `ACTIVE`
- `canHrHandleResignation(user, loan)` — HR + `ACTIVE`
- `requiresCommentOnApprove(status)` — true when `PENDING_MD`

**Constraints:**

- Use `hasRole` from `lib/rbac.ts`
- No API calls in this file
- Loans have **no** supervisor unit scoping (unlike leave)

**Output format:** `lib/loans/approval.ts`.

**Acceptance criteria:**

- [ ] HR cannot approve when status is `PENDING_ED`
- [ ] MD step flagged as requiring comment on approve
- [ ] Employee never gets approve/reject true

---

### Prompt 5 — Foundation: RBAC helpers

**Role:** You are a frontend engineer extending role helpers for the loans module.

**Context:** `lib/rbac.ts` already has `hasRole`, `canManageUsers`. Backend: logs visible to HR, ED, MD, and `is_staff` (map staff to same UI access if `user` exposes no is_staff — use roles only: HR, EXECUTIVE_DIRECTOR, MANAGING_DIRECTOR). Reports: HR only. Employee ledger: self OR HR/ED/MD.

**Task:** Extend `lib/rbac.ts` (minimal diff) with:

- `LOAN_APPROVER_ROLES`: `HR`, `EXECUTIVE_DIRECTOR`, `MANAGING_DIRECTOR`
- `canViewLoanLogs(user)`
- `canAccessLoanReports(user)` — HR only
- `canViewEmployeeLoanLedger(user, employeeId)` — `user.id === employeeId` OR approver roles
- `isLoanPrivilegedList(user)` — can see all employees’ loans in list filters (HR, ED, MD)

**Constraints:**

- Do not break existing exports
- Reuse `RoleName` from `lib/types/auth.ts`

**Output format:** Updated `lib/rbac.ts` only.

**Acceptance criteria:**

- [ ] Helpers used by layout nav and later prompts compile
- [ ] Employee without approver role cannot access reports helper

---

### Prompt 6 — Shell: Enable top nav + module layout

**Role:** You are a senior Next.js engineer wiring the loans module shell.

**Context:**

- Mirror `app/(hrm)/leave/layout.tsx` (collapsible sidebar, `allowedRoles` filter)
- Update `app/(hrm)/layout.tsx`: move **Staff Loans** from `soonModules` into `BASE_MODULES` with `href: "/loans"` and `DollarSign` icon (already imported)
- Remove or replace `app/(hrm)/loans/page.tsx` placeholder in Prompt 7

**Task:**

1. Edit `app/(hrm)/layout.tsx` — enable Staff Loans link to `/loans`
2. Create `app/(hrm)/loans/layout.tsx` with sidebar nav:
   - Dashboard → `/loans`
   - Apply for Loan → `/loans/apply`
   - My Loans / History → `/loans/history`
   - Approvals → `/loans/admin` (`allowedRoles`: HR, EXECUTIVE_DIRECTOR, MANAGING_DIRECTOR)
   - Reports → `/loans/reports` (`allowedRoles`: HR only)
   - Primary CTA button: “Apply for loan” → `/loans/apply`
3. Create stub pages (minimal `PageHeader` + “Coming soon” text) for routes not yet built: `apply`, `history`, `admin`, `reports`, `requests/[id]` — so navigation does not 404

**Constraints:**

- `"use client"` on layout
- Same visual language as leave sidebar (`bg-sidebar`, collapse toggle)
- `h-[calc(100vh-56px)]` content area pattern from leave layout

**Output format:** List of created/edited files.

**Acceptance criteria:**

- [ ] Top nav “Staff Loans” navigates to `/loans`
- [ ] Sidebar items hide/show based on `user.roles`
- [ ] No 404 when clicking sidebar links

---

### Prompt 7 — Employee: Loans dashboard

**Role:** You are a senior frontend engineer building the loans home dashboard.

**Context:**

- Replace `app/(hrm)/loans/page.tsx` (remove `ComingSoon`)
- Use `useLoanApplications()` — employees see only own loans; privileged users see all (optional: show message if privileged)
- Reuse `components/hrm/ui/PageHeader.tsx`, `StatCard.tsx`, `DataTable.tsx` or card list from `app/(hrm)/leave/page.tsx`

**Task:** Implement `/loans` dashboard with:

- Page title “Staff Loans”
- Stat cards: count by status (e.g. draft, pending approval, active) derived from list data
- Table or list of **recent** applications (last 5–10), columns: type, amount, status, created date, link to detail
- Prominent CTA: Apply for loan → `/loans/apply`
- Empty state when no applications

**Constraints:**

- `"use client"`
- Link detail rows to `/loans/requests/[id]`
- Loading skeletons while fetching

**Output format:** `app/(hrm)/loans/page.tsx` (and small presentational components under `components/hrm/loans/` only if needed).

**Acceptance criteria:**

- [ ] Dashboard loads for authenticated employee
- [ ] Recent loans link to detail route
- [ ] Apply CTA visible

---

### Prompt 8 — Employee: Apply for loan

**Role:** You are a senior frontend engineer building the loan application form.

**Context:**

- Backend `POST loan-applications/` creates **DRAFT**; runs eligibility on validate (confirmed staff, no active loan)
- Validations: `amount > 0`, `tenure_months` 1–12
- Mirror `app/(hrm)/leave/apply/page.tsx` form patterns (react-hook-form or controlled inputs — match leave)
- `useLoanTypes()` for dropdown

**Task:** Implement `app/(hrm)/loans/apply/page.tsx`:

- Fields: loan type (select), amount (decimal input), tenure months (1–12, number), purpose (textarea)
- Submit → `useCreateLoanApplication` → redirect to `/loans/requests/{id}` on success
- On 400: show API errors (e.g. “Only confirmed staff…”, “You already have an active loan”)
- Optional: if profile exposes `confirmation_status` via personnel API, show banner when not `CONFIRMED` and disable submit

**Constraints:**

- Do not call submit/approve on this page — create only
- Currency formatting for display (NGN or locale-neutral per project convention)

**Output format:** `app/(hrm)/loans/apply/page.tsx`.

**Acceptance criteria:**

- [ ] Valid create returns 201 and navigates to detail
- [ ] `tenure_months=13` shows validation error (client and/or server)
- [ ] `amount=0` rejected
- [ ] Unconfirmed user sees server error message on create (if test user available)

---

### Prompt 9 — Employee: My loan history

**Role:** You are a senior frontend engineer building the loan history list.

**Context:** `GET loan-applications/` with optional filters for privileged users. Mirror `app/(hrm)/leave/history/page.tsx`.

**Task:** Implement `app/(hrm)/loans/history/page.tsx`:

- `DataTable` or table: loan type, amount, tenure, status (badge), outstanding balance (if set), created date
- Status badge using `LOAN_STATUS_DISPLAY` — extend `StatusBadge` in `components/hrm/ui/StatusBadge.tsx` for loan statuses **or** add `LoanStatusBadge` component
- Row click → `/loans/requests/[id]`
- Privileged users: filter dropdowns for `status`, `loan_type` (from `useLoanTypes`), optional `employee` id text/uuid field or user search if available elsewhere

**Constraints:**

- Employees see only their loans (backend-enforced); do not client-filter away data incorrectly
- Pagination: if API returns array not paginated, client-side sort by `-created_at`

**Output format:** `app/(hrm)/loans/history/page.tsx` (+ optional `LoanStatusBadge.tsx`).

**Acceptance criteria:**

- [ ] History lists user’s loans with correct status labels
- [ ] Filters appear only for `isLoanPrivilegedList(user)`
- [ ] Links to detail work

---

### Prompt 10 — Shared: Loan detail page

**Role:** You are a senior frontend engineer building the loan application detail view.

**Context:** `GET loan-applications/{id}/`. Mirror `app/(hrm)/leave/requests/[id]/page.tsx` layout: summary card + sections. Include `repayment_schedule` when present (after disburse).

**Task:** Implement `app/(hrm)/loans/requests/[id]/page.tsx`:

- Fetch with `useLoanApplication(id)`
- Display: employee name, loan type, amount, tenure, monthly installment, purpose, status badge, outstanding balance, disbursed/closed dates, resignation_deducted flag
- **Repayment schedule** table when `repayment_schedule.length > 0` (installment #, due date, amount)
- Permission: non-privileged users only view own loan (backend returns 403 otherwise — show error state)
- Placeholder action toolbar (wired in prompts 11–15)

**Constraints:**

- `"use client"`
- Use `PageHeader` with back link to `/loans/history`
- Format dates and currency consistently

**Output format:** Detail page + optional `components/hrm/loans/RepaymentScheduleTable.tsx`.

**Acceptance criteria:**

- [ ] Detail loads for owner on draft loan
- [ ] Schedule section hidden for DRAFT; visible after ACTIVE disburse
- [ ] 403/404 handled gracefully

---

### Prompt 11 — Workflow: Employee draft actions

**Role:** You are a senior frontend engineer implementing employee edit and submit on loan detail.

**Context:**

- PATCH allowed fields for employee in DRAFT: `amount`, `tenure_months`, `purpose` only
- POST `submit/` — DRAFT → `PENDING_HR`; runs `LoanEligibilityService.check_eligibility` (confirmed + no active loan)
- Use `canEmployeeEditLoan`, `canEmployeeSubmitLoan` from `lib/loans/approval.ts`

**Task:** On `app/(hrm)/loans/requests/[id]/page.tsx` add:

- **Edit mode** for DRAFT (inline form or dialog) calling `usePatchLoanApplication`
- **Submit for approval** button with confirmation dialog → `useSubmitLoan`
- Disable submit when not owner or not DRAFT
- Show validation errors from API on submit (e.g. active loan, unconfirmed staff)

**Constraints:**

- Do not show edit/submit to HR viewing someone else’s draft unless HR patch rules apply (HR uses different fields — separate button in HR tools or same page with role branch)
- After submit, refresh detail and show success toast

**Output format:** Updates to detail page.

**Acceptance criteria:**

- [ ] Owner can PATCH draft fields
- [ ] Submit changes status to `PENDING_HR` on success
- [ ] Submit blocked with message when duplicate active loan exists

---

### Prompt 12 — Workflow: Approver actions

**Role:** You are a senior frontend engineer implementing approve and reject for HR, ED, and MD.

**Context:**

- Approve: HR at `PENDING_HR` → `PENDING_ED` → `PENDING_MD` → `APPROVED`
- MD approve **requires** `comment` in request body
- Reject: stage approver only; **comment required**
- Use `canUserActOnLoanApplication`; dialog pattern from leave detail approve/reject

**Task:** On loan detail page add:

- **Approve** button + modal (optional comment; **required** when status is `PENDING_MD`)
- **Reject** button + modal (**required** comment)
- Call `useApproveLoan` / `useRejectLoan`
- Hide buttons when `canApprove` / `canReject` false

**Constraints:**

- After action, invalidate loan query and show toast
- Terminal statuses: no approve/reject buttons

**Output format:** Updates to detail page (and optional `LoanActionDialog.tsx`).

**Acceptance criteria:**

- [ ] HR sees approve only at `PENDING_HR`
- [ ] Reject without comment returns 400 and UI prevents empty submit
- [ ] MD approve without comment shows validation error

---

### Prompt 13 — HR: Approvals queue

**Role:** You are a senior frontend engineer building the loan approvals inbox.

**Context:** Mirror `app/(hrm)/leave/admin/page.tsx`. List loans in pending statuses relevant to current user’s role.

**Task:** Implement `app/(hrm)/loans/admin/page.tsx`:

- Fetch applications with `status` filter (or fetch all privileged and client-filter):
  - HR: `PENDING_HR`
  - ED: `PENDING_ED`
  - MD: `PENDING_MD`
- Table: employee name, type, amount, tenure, status, submitted date (use `created_at` or latest log)
- `canUserActOnLoanApplication` — show quick Approve/Reject or link to detail
- Link row to `/loans/requests/[id]`

**Constraints:**

- Page only linked from sidebar for approver roles (layout already gates)
- Empty state: “No pending approvals”

**Output format:** `app/(hrm)/loans/admin/page.tsx`.

**Acceptance criteria:**

- [ ] HR user sees `PENDING_HR` items
- [ ] ED user sees `PENDING_ED` items only
- [ ] Row navigates to detail for full action

---

### Prompt 14 — HR: Disburse + post-disburse display

**Role:** You are a senior frontend engineer implementing loan disbursement UI.

**Context:** POST `disburse/` — HR only, status must be `APPROVED` → `ACTIVE`. Backend generates repayment schedule and sets `outstanding_balance` to principal.

**Task:** On loan detail page (HR only):

- **Disburse** button when `canHrDisburse`
- Confirmation dialog → `useDisburseLoan`
- After success: show `monthly_installment`, `outstanding_balance`, `disbursed_at`, full **repayment schedule** table

**Constraints:**

- Only HR role (not ED/MD unless they have HR role)
- Refresh loan data after disburse

**Output format:** Updates to detail page.

**Acceptance criteria:**

- [ ] Disburse visible only on `APPROVED` for HR
- [ ] After disburse: 3 rows in schedule for tenure=3 test loan
- [ ] Status shows `ACTIVE`

---

### Prompt 15 — HR: Liquidate + resignation

**Role:** You are a senior frontend engineer implementing HR terminal actions on active loans.

**Context:**

- POST `liquidate/` — `ACTIVE` → `LIQUIDATED`, `outstanding_balance = 0`
- POST `handle-resignation/` — `ACTIVE` → `CLOSED`, `resignation_deducted = true`, balance 0

**Task:** On loan detail page add HR-only actions:

- **Liquidate loan** — confirm destructive dialog → `useLiquidateLoan`
- **Close on resignation** — confirm with explanation text → `useHandleResignationLoan`
- Use `canHrLiquidate` / `canHrHandleResignation`

**Constraints:**

- Only show on `ACTIVE`
- Hide after terminal transition
- Clear copy: resignation = payroll/final entitlement deduction per product policy

**Output format:** Updates to detail page.

**Acceptance criteria:**

- [ ] Liquidate sets status `LIQUIDATED` and balance 0 in UI
- [ ] Resignation sets `CLOSED`, `resignation_deducted` true
- [ ] Buttons not shown on `APPROVED` or `DRAFT`

---

### Prompt 16 — Privileged: Approval logs panel

**Role:** You are a senior frontend engineer adding the loan audit trail UI.

**Context:** `GET loan-applications/{id}/logs/` — HR, ED, MD only (not plain employees). Response shape: `LoanApprovalLogSerializer` (actor first/last name, action, comment, previous/new status, timestamp).

**Task:**

- `useLoanLogs(id, { enabled: canViewLoanLogs(user) })`
- Add **Approval history** section on detail page: chronological table (timestamp, actor, action, status transition, comment)
- Or extract `components/hrm/loans/LoanApprovalLogs.tsx`

**Constraints:**

- Do not fetch logs for employees (enabled: false)
- Match leave logs presentation if present on leave detail

**Output format:** Component + detail page integration.

**Acceptance criteria:**

- [ ] HR/ED/MD see logs after workflow actions
- [ ] Employee does not see section and no logs request fired
- [ ] Reject comment visible in log row

---

### Prompt 17 — HR: Finance reports

**Role:** You are a senior frontend engineer building HR finance report screens.

**Context:** HR-only report endpoints (see Appendix C). CSV via `?format=csv` returns file download with `Content-Disposition: attachment`.

**Task:** Implement `app/(hrm)/loans/reports/page.tsx` with tabs or sections:

1. **Outstanding loans** — `useOutstandingLoansReport({ loan_type, employee })`, filters, table per Appendix C, **Export CSV** button
2. **Schedule summary** — monthly `month_label`, `total_amount_due`, `installment_count`, Export CSV
3. **Employee ledger** — input/select `employee_id` (reuse user search from `/users` if available, or UUID field for v1), show nested loans with schedules; Export CSV

**Constraints:**

- `canAccessLoanReports(user)` — redirect or message if unauthorized
- CSV download: open `/api/proxy/loans/reports/outstanding/?format=csv&...` with credentials (same pattern as leave CSV export if exists)
- Currency formatting in tables

**Output format:** `app/(hrm)/loans/reports/page.tsx` (+ small tab components if needed).

**Acceptance criteria:**

- [ ] HR can load outstanding report JSON table
- [ ] Schedule summary shows monthly buckets
- [ ] Ledger loads for valid employee UUID
- [ ] CSV export triggers download for each report

---

### Prompt 18 — Polish: Errors, loading, empty states

**Role:** You are a senior frontend engineer hardening the loans module UX.

**Context:** Review all files under `app/(hrm)/loans/` and `components/hrm/loans/`.

**Task:**

1. Consistent **loading** skeletons on list, detail, reports
2. **Empty states** with guidance (apply CTA on history empty)
3. **API error** extraction helper — map DRF `{ detail }`, field errors, `ValidationError` messages to toast (use same toast library as leave module)
4. **403** on detail: “You don’t have permission to view this loan”
5. Disable double-submit on all mutation buttons
6. Ensure `npm run build` passes; fix any `LoanStatus` exhaustiveness in badges

**Constraints:**

- No new features; polish only
- Do not add DELETE support

**Output format:** Touch-up commits across loans module files.

**Acceptance criteria:**

- [ ] `npm run build` succeeds
- [ ] No console errors on happy-path navigation: dashboard → apply → detail → submit
- [ ] Loading states present on every data fetch view

---

## Appendix A — API proxy paths (quick reference)

| Method | Proxy path | Notes |
|--------|------------|-------|
| GET | `loan-types/` | All types |
| GET | `loan-applications/` | Query: `employee`, `status`, `loan_type` |
| POST | `loan-applications/` | Body: create payload → DRAFT |
| GET | `loan-applications/{id}/` | Detail |
| PATCH | `loan-applications/{id}/` | Partial update |
| POST | `loan-applications/{id}/submit/` | Owner, DRAFT |
| POST | `loan-applications/{id}/approve/` | Body: `{ "comment": "..." }` |
| POST | `loan-applications/{id}/reject/` | Body: `{ "comment": "..." }` **required** |
| POST | `loan-applications/{id}/disburse/` | HR, APPROVED |
| POST | `loan-applications/{id}/liquidate/` | HR, ACTIVE |
| POST | `loan-applications/{id}/handle-resignation/` | HR, ACTIVE |
| GET | `loan-applications/{id}/logs/` | HR, ED, MD |
| GET | `loans/reports/outstanding/` | HR; CSV: `?format=csv` |
| GET | `loans/reports/schedule-summary/` | HR; CSV: `?format=csv` |
| GET | `loans/reports/employee-ledger/{employee_id}/` | Self or HR/ED/MD; CSV: `?format=csv` |

`DELETE loan-applications/{id}/` → **405** (not supported).

---

## Appendix B — Status → UI action matrix

| Status | Employee (owner) | HR | ED | MD |
|--------|------------------|----|----|-----|
| DRAFT | Edit, Submit | Patch (non-terminal fields) | — | — |
| PENDING_HR | View | Approve, Reject | — | — |
| PENDING_ED | View | — | Approve, Reject | — |
| PENDING_MD | View | — | — | Approve (comment req), Reject |
| APPROVED | View | Disburse | View | View |
| ACTIVE | View | Liquidate, Resignation close | View | View |
| REJECTED | View | — | — | — |
| CLOSED | View | — | — | — |
| LIQUIDATED | View | — | — | — |

**Logs panel:** HR, ED, MD only (all non-draft statuses once logs exist).  
**Reports pages:** HR only.

---

## Appendix C — Example payloads & report shapes

### Create application

```json
POST loan-applications/
{
  "loan_type": "<uuid>",
  "amount": "5000.00",
  "tenure_months": 6,
  "purpose": "Medical expenses"
}
```

### Approve (MD stage — comment required)

```json
POST loan-applications/{id}/approve/
{
  "comment": "Approved by Managing Director per policy."
}
```

### Reject (comment required)

```json
POST loan-applications/{id}/reject/
{
  "comment": "Insufficient tenure in role."
}
```

### Outstanding report row (`GET loans/reports/outstanding/`)

```json
{
  "results": [
    {
      "employee_name": "Jane Doe",
      "loan_type": "Personal Loan",
      "original_amount": "5000.00",
      "outstanding_balance": "5000.00",
      "disbursed_at": "2025-03-01T10:00:00Z",
      "remaining_installments_count": 4,
      "loan_id": "<uuid>"
    }
  ]
}
```

### Schedule summary row

```json
{
  "results": [
    {
      "month_label": "2025-06",
      "total_amount_due": "15000.00",
      "installment_count": 5
    }
  ]
}
```

### Employee ledger

```json
{
  "employee_id": "<uuid>",
  "loans": [
    {
      "id": "<uuid>",
      "status": "ACTIVE",
      "loan_type": { "id": "...", "name": "Personal Loan", "description": "..." },
      "amount": "5000.00",
      "repayment_schedule": [
        { "installment_number": 1, "due_date": "2025-04-01", "amount_due": "1667.00" }
      ],
      "logs": [
        {
          "id": "<uuid>",
          "actor": { "first_name": "HR", "last_name": "User" },
          "action": "DISBURSE",
          "action_display": "Disburse",
          "comment": "",
          "previous_status": "APPROVED",
          "new_status": "ACTIVE",
          "timestamp": "2025-03-01T12:00:00Z"
        }
      ]
    }
  ]
}
```

---

## Appendix D — Out of scope

- Loan type CRUD (types are read-only from API)
- DELETE loan applications (backend returns 405)
- Celery notification delivery UI / email templates
- Payroll deduction automation or accounting integration
- Mobile-native layouts (responsive web only, consistent with leave)
- Backend changes unless a documented API bug blocks the UI

---

## Appendix E — Suggested folder structure (target)

```
incel-hrm-frontend/
├── app/(hrm)/
│   ├── layout.tsx                 # Staff Loans in BASE_MODULES
│   └── loans/
│       ├── layout.tsx
│       ├── page.tsx               # dashboard
│       ├── apply/page.tsx
│       ├── history/page.tsx
│       ├── admin/page.tsx
│       ├── reports/page.tsx
│       └── requests/[id]/page.tsx
├── lib/
│   ├── types/loan.ts
│   ├── loans/approval.ts
│   ├── api/loans.ts
│   └── rbac.ts                    # extended helpers
└── components/hrm/loans/
    ├── LoanStatusBadge.tsx
    ├── RepaymentScheduleTable.tsx
    ├── LoanApprovalLogs.tsx
    └── LoanActionDialog.tsx
```

---

*Generated for the Incel HRM frontend. Backend reference: `incel-hrm-backend` loan app (models, views, serializers, tests in `apps/loan/tests/test_api.py`).*
