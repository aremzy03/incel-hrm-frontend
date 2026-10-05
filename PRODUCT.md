# Product



## Platform

web

## Users

**Dual primary.** Employee self-service and HR/approver operations are equally in-scope. Role-specific dashboards and navigation are the product, not a later skin.

- **Employees** use the portal at their desk or on a phone to apply for leave and staff loans, name a reliever, check balances and repayment schedules, complete self-appraisal when cycles open, and see results. They replace email and informal requests.
- **Team Leads, Supervisors, and Line Managers** approve or reject requests in their org scope, cover team calendars, and complete appraisal evaluations. A Line Manager heads one department; a Supervisor heads a unit; a Team Lead heads a team.
- **HR** enforces policy, edits or cancels leave, reviews and disburses loans, confirms liquidation, manages users/org structure/personnel, configures leave and loan settings, calibrates appraisal scores, and generates reports.
- **Executive Director (ED) and Managing Director (MD)** make final leave and loan decisions. ED is the last leave stage; MD is the last loan stage.
- **Payroll / Finance** is a later audience for payroll viewing, loan deduction visibility, and leave encashment handoff. Finance-style **loan observers** (a configured department or unit) already have read-only loan access.

Every new user is assigned `EMPLOYEE`. Elevated roles are `TEAM_LEAD`, `SUPERVISOR`, `LINE_MANAGER`, `HR`, `EXECUTIVE_DIRECTOR`, `MANAGING_DIRECTOR`. The backend currently treats role assignment as one elevated role at a time plus the default employee assignment path; the frontend already reasons over a role list.

## Product Purpose

Incel Group HR Portal (product chrome: **Incel Group** / **HR Portal**; document title **Incel HRM**) digitizes and streamlines critical HR processes for Incel Group staff so policy is enforced in the system, not in email.

Phase 1 core modules:

1. **Leave Management**
2. **Staff Loan Management**
3. **Staff Appraisal Management** (not implemented yet; must be factored into information architecture, eligibility, and navigation)

The product exists to:

- replace manual and email-based HR processes and the previous HRM system
- enforce HR policy through automated validation
- make multi-level approval transparent and accountable
- keep audit trails for governance
- produce performance and financial insight

Success is less manual processing time, shorter approval delays, higher policy compliance, clearer performance visibility, and lower loan financial risk.

Later product-of-record modules (not fully shipped, still in scope for design and IA): **role-based dashboards**, **payroll viewing**, and **attendance**. Full payroll computation, recruitment, and multi-company tenancy are not the current product; the running system is a single Incel Group organization.

## Positioning

This is a **rule-driven internal enterprise system**, not a generic request inbox. Neighboring tools can collect forms; this product’s mechanism is **policy validation before a request can proceed**, plus a **visible multi-stage approval chain** with comments, timestamps, and immutable-enough logs.

Leave working days, relievers, gender-specific types, org-scoped exclusivity, and loan eligibility (confirmed staff, no active loan, tenure and installment caps) are product behavior. Appraisal-gated loan eligibility is specified and must be wired when appraisals ship; the backend currently placeholders that check as always-pass.

## Operating Context

Internal authenticated web app used during the workday in Nigeria (`Africa/Lagos`). Staff submit and approve from the Next.js client; Django REST + PostgreSQL + Redis + Celery hold workflows, email, and in-app SSE notifications. Production target is a containerized VPS behind Traefik; this repo is the frontend (`incel-hrm-frontend`) talking to `incel-hrm-backend` under `/api/v1`.

**Organization model:** Department → Unit → Team. Special departments include Human Resources (HR) and Management. Personnel records (staff ID, next of kin, contract, confirmation status, completeness) live on the user.

**Leave ritual:** draft or create-and-submit → optional Team Lead / Supervisor stages → Line Manager → HR → ED. Rejection at any stage ends the request. Final approval deducts balance and lands on the department calendar. HR can modify or cancel approved leave. Reliever (cover person) is required at submit for Annual/Casual and similar types; Sick, Maternity, Paternity, emergencies, and ED/MD requesters are exempt. Types in use: Annual, Sick, Casual, Maternity, Paternity. Weekends and public holidays are excluded from working-day counts unless a policy says otherwise.

**Loan ritual:** draft → submit (confirmed staff only) → optional Line Manager → HR → ED → MD (MD comment required) → HR disburses to ACTIVE and generates a repayment schedule. HR can liquidate, mark installments, or close on resignation. Types are interest-free (Personal, Compassionate). Default max tenure is 12 months. Loan observers get Finance-style visibility without approval power.

**Appraisal ritual (specified, unbuilt):** HR creates a cycle (90-day check, 6-month confirmation, July/December bi-annual). Employee self-appraisal → manager evaluation → weighted KPI + competency score → HR calibration → results visible to the employee. Outcomes may later inform increments, promotions, bonuses, and training needs — and loan eligibility.

**Notifications:** email plus in-app list and SSE when requests move. Guided tours exist for leave and loans.

## Capabilities and Constraints

**Shipped in this frontend today**

- Auth (login/register, HTTP-only session cookie via Next API proxy, password change)
- Leave: apply, history, approvals, calendar, blackouts, reports, delegates/out-of-office, reconciliation, HR settings (types, policies, assignments, workflows, calendars, public holidays, general)
- Staff loans: apply, history, approvals, reports, settings, disbursement/liquidation/resignation actions, repayment schedule
- Users, departments, units, teams, roles, personnel
- Profile, notifications bell/drawer
- Dark theme toggle in the shell

**Specified and must be factored (unshipped or stubbed)**

- Staff Appraisal Management (`/appraisals` is a coming-soon surface; keep the module tab)
- Role-based dashboards (`/dashboard` is currently disabled)
- Payroll viewing and attendance (later modules; leave already records ENCASH ledger rows as a payroll handoff, with no payroll posting API)
- Appraisal-based loan eligibility (backend TODO)
- Full loan affordability vs 33.3% of take-home / annual net (PRD); current backend enforces confirmed staff, no overlapping active loan, tenure ≤ 12 months

**Hard product rules**

- Access is role-scoped. Confidential PII. Audit logs on approvals, rejections, comments, and HR edits.
- Leave status vocabulary: `DRAFT`, `PENDING_TEAM_LEAD`, `PENDING_SUPERVISOR`, `PENDING_MANAGER`, `PENDING_HR`, `PENDING_ED`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Loan status vocabulary: `DRAFT`, `PENDING_MANAGER`, `PENDING_HR`, `PENDING_ED`, `PENDING_MD`, `APPROVED`, `REJECTED`, `ACTIVE`, `CLOSED`, `LIQUIDATED`.
- Half-day leave is not a Phase 1 leave policy (PRD). No carry-forward unless a later policy setting says otherwise.
- Reports must be exportable (PRD).
- Do not invent a multi-tenant or multi-company UX; this is Incel Group only unless product scope changes.
- Do not ship a public marketing site as the product; unauthenticated surfaces are login/register only.

**Open**

- Whether a full payroll engine (vs viewing/handoff) ever lands in this product
- Whether attendance is biometric, manual, or both
- Whether loan observers remain Finance-only or expand



## Brand Commitments

- **Name:** Incel Group. Product labels: **HR Portal**, **Incel HRMS**.
- **Voice:** calm, precise, internal. Existing chrome: “Join your team’s HR workspace.” Prefer policy-plain language over SaaS hype. Do not invent customer quotes.
- **Assets:** `public/hrm.svg`, `public/hrm-logo.png`, `public/incel-icon-optimized.svg`, `public/INCEL GLOBAL.svg`, `public/INCEL GLOBAL.png`. Sidebar lockup is the mark plus “Incel Group” / “HR Portal”.
- **Visual world (binding):** `ui-design/incel_group_hr_portal/DESIGN.md` is the committed identity (deep indigo, Plus Jakarta Sans, JetBrains Mono for data, hyper-rounded workspace). Root `DESIGN.md` is the agent-facing carbonization of that world plus the tokens already in `app/globals.css`. Do not replace it with a generic admin aesthetic.



## Evidence on Hand

- `Incel Group - HRM Application PRD (1).pdf` — Phase 1 product and Phase 2/3 technical blueprint (treat Phase 1 modules as product truth; later technical pages mix in attendance/payroll/multi-tenant schema that is not the running system)
- `../incel-hrm-backend/README.md` and module docs under `apps/leave` and `apps/loan` — implemented workflow, RBAC, notifications
- `ui-design/incel_group_hr_portal/DESIGN.md` — Stitch design system for this portal
- Running Next.js App Router UI under `app/(hrm)/`
- No customer testimonials, press, or fabricated metrics. Do not invent them.



## Product Principles

1. **Policy before paperwork.** If a request violates a rule, it does not enter the chain.
2. **The chain is the interface.** Approvers, stage, comments, and next action must be obvious on every request.
3. **One portal, two jobs.** Self-service and HR operations share a shell; roles change what you can see and do, not the product’s identity.
4. **Confidential by construction.** Employee data, loans, and appraisals are access-controlled and auditable.
5. **Design for the unbuilt Phase 1.** Appraisals, dashboards, payroll viewing, and attendance must fit the same IA and visual world instead of arriving as a second product.



## Accessibility & Inclusion

WCAG 2.2 AA is required. The product is used by the whole staff, not only power users: forms, status, and approval actions must remain usable with keyboard, sufficient contrast, and clear labels. Gender-specific leave types (Maternity / Paternity) are policy, not optional copy.