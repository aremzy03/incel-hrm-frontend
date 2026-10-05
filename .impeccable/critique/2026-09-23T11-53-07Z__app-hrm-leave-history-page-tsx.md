---
target: /leave/history
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/history/page.tsx"
target_fingerprint: "sha256:09613e2c29db7377b91261befef673c6fc17201a0ae107a7969d56069ed5ad46"
target_path: /home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/history/page.tsx
timestamp: 2026-09-23T11-53-07Z
slug: app-hrm-leave-history-page-tsx
closed: true
---
Method: dual-agent (A: 889114e2-5bf5-42ab-93ee-de2781f6de8d · B: df8e4e72-b528-491f-868c-f8c6c1ff8ce1)

Live inspection hit the login wall (`/?next=/leave/history`). Overlay injection ran on the login page, not this surface. Source review is complete.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Pills and “Showing n–m of total” exist; fetch is only opacity-70. No year on balances, no waiting-on, no error vs empty. |
| 2 | Match System / Real World | 2 | Chain labels are good. The list talks like a database: ISO dates, “records,” nine workflow enums in a filter. |
| 3 | User Control and Freedom | 2 | Status/type filters and Clear filters exist. Filters are not in the URL. Rows are not the control — a View chip is. |
| 4 | Consistency and Standards | 2 | Breaks Leave dashboard: no row href, no mono days, no Apply, ISO dates vs formatLeaveDuration. |
| 5 | Error Prevention | 3 | Native selects; filter change resets page. Does not prevent “empty because the API failed.” |
| 6 | Recognition Rather Than Recall | 2 | Pills beat status codes. Finding a request still means recalling type + two ISO dates + which pending stage. |
| 7 | Flexibility and Efficiency | 1 | No search, sort, date/year, row activate, or deep-linkable filters. |
| 8 | Aesthetic and Minimalist Design | 2 | Balance card and table belong in this world. Full-width filter fields and a 7-column grid fight for first look. |
| 9 | Error Recovery | 1 | isError unused. Failure renders “No records match the selected filters.” No retry. |
| 10 | Help and Documentation | 2 | data-tour hooks exist; empty state does not teach Apply. Tour says open any row; rows are not links. |
| **Total** | | **19/40** | **Poor** |

#### Design Specificity Verdict

**Start here.** Category-interchangeable admin table wearing Incel chrome, not an authored leave ledger.

**LLM assessment**: Shell pieces are specific — StatusBadge speaks Team Lead → ED, LeaveBalanceStrip is a year entitlement readout, cool indigo cards. The job of the page (find a past request and open it) is a generic directory: seven unlabeled columns, ISO dates, a 10-option status select, a hairline View chip, copy that says “records.” It is a scoped clone of `/leave/requests`, not the employee twin of the Leave dashboard.

**Deterministic scan**: `impeccable detect` exit 0, **1 advisory**. Rule `design-system-font-size` on `components/hrm/ui/StatusBadge.tsx:43` (`text-[10px]` vs YAML `label-md` 12px). No hits on `history/page.tsx`, DataTable, PageHeader, Breadcrumb, or LeaveBalanceStrip. Treat the 10px badge as a **false positive vs DESIGN.md prose** (uppercase 10px labels are documented for section tags/stat cards); true vs the YAML ramp only.

**Visual overlays**: No reliable user-visible overlay for `/leave/history`. Mutation and `detect.js` succeeded on the **login wall** (undersized “HR Portal” text, assembled SVG illustration). Those hits are not evidence for this page.

#### Overall Impression

Competent Incel chrome around the wrong object. The biggest opportunity is to make this *my leave ledger*: distinguishable empty/error/filtered states, a findable list (grouped status, year, row as the hit target), and the same duration/Apply/row patterns as `/leave`.

#### What's Working

1. **Chain-literate status.** `LEAVE_STATUS_DISPLAY` + StatusBadge make Team Lead / Unit Supervisor / Manager / HR / ED readable without decoding enums.
2. **Balance strip as a real HR object.** Remaining/allocated in tabular/mono treatment, progressbar with a spoken label, carry-forward line.
3. **Pagination is operated.** Range text, aria-current, labeled Previous/Next, filter change resets to page 1, Clear filters only when dirty.

#### Priority Issues

**[P1] Cannot tell failure from “you have no leave.”**
- **Why it matters**: `isError` is never read. Empty copy is always “No records match the selected filters.” A downed API and a first-timer with no history look identical. No Retry.
- **Fix**: Branch empty vs error vs filtered-empty. Error: “Could not load your leave history” + Retry. True empty: dashboard language + link to `/leave/apply`. Filtered empty: keep the current sentence and Clear filters.
- **Suggested command**: `/impeccable harden`

**[P1] Primary task is scan-the-grid; the status filter is a workflow exam.**
- **Why it matters**: Find-and-open has no search, year, or date range. Filter by status lists all nine statuses. Employees look for Waiting / Approved / Rejected, not PENDING_SUPERVISOR. Balances are this year; the table is all-time.
- **Fix**: Default chips: All / Waiting / Approved / Rejected / Draft (≤4). Nested pending stages behind Waiting. Add year or date range aligned with the strip.
- **Suggested command**: `/impeccable distill`

**[P1] Rejected and pending are emotionally mute.**
- **Why it matters**: Rejected is a red 10px pill plus a 160px truncated reason. Pending stages share one amber. High-stakes decisions have no “waiting on {role}” or “open for the comment.”
- **Fix**: Keep pills. For REJECTED, promise the comment on the detail. For PENDING_*, short “Waiting on {role}.”
- **Suggested command**: `/impeccable clarify`

**[P2] This page disagrees with Leave dashboard and with its own tour.**
- **Why it matters**: Dashboard uses formatLeaveDuration, mono days, getRowHref, Apply in the header. History uses ISO dates, a 12px View chip, no header action. Tour: “Open any row.”
- **Fix**: Same duration formatter, mono on Days, whole-row link with unique aria-label, header **Apply for Leave**.
- **Suggested command**: `/impeccable layout`

**[P2] Filters and badges fight WCAG 2.2 AA and the type spec.**
- **Why it matters**: Selects are aria-label only (no visible Status/Type labels). Every View is named “View.” stitchSelectClass is w-full, so filters become stacked application fields.
- **Fix**: Visible label-md above compact selects; unique link names; announce result count in a live region.
- **Suggested command**: `/impeccable adapt`

#### Persona Red Flags

**Alex (Power User)**: No sort, search, or URL’d filters. View is an extra target at the end of seven columns. Fetch = whole table at 70% opacity. Cannot jump “rejected this year” without a 10-option select.

**Sam (Accessibility)**: Native selects and pagination nav are usable. Failures: identical View links; filter purpose only in aria-label; no table caption; visually clipped reason with no title; 10px badge type; no live region for 0 results vs error.

**Jordan (First-Timer)**: Title “My Leave History” before they have a history. Empty state blames filters. No Apply on the header (dashboard and loans/history both have it). Status control teaches the org chart before they have a request.

#### Minor Observations

- PageHeader mb-6 + Breadcrumb mb-8 + parent space-y-8 — extra air before the work.
- Pagination sits in a second card instead of joining the table.
- Emergency leave and reliever never appear in the row.
- isFetching dimming looks disabled, not refreshing.
- View / pagination / skeletons use border-border and rounded-md; table uses outline-variant + custom-shadow.
- Balance bar stays primary-container at 0% remaining — no warning.

#### Questions to Consider

- If this is *my* leave, why does it share a skeleton with org-wide Leave Requests instead of the dashboard’s duration, row, and Apply patterns?
- The product says the chain *is* the interface — why are five pending stages homework in a select?
- Why can Jordan apply from Dashboard and My Loans, but the page that proves they have no leave offers only “No records match the selected filters”?
- Balances already live on `/leave`. What job do they do here except steal the first look from “find that request”?
