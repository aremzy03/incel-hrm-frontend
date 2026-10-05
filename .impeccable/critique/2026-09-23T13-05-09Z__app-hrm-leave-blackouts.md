---
target: /leave/blackouts
total_score: 11
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
p2_count: 1
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/blackouts"
timestamp: 2026-09-23T13-05-09Z
slug: app-hrm-leave-blackouts
closed: true
---
Method: dual-agent (A: 4f5ad4b6-08c2-4ee2-aecc-5ec1c5e34677 · B: 81bafe7d-f3cd-41ba-9512-4dcb4ed201f5)

# Critique: /leave/blackouts

**Target:** `app/(hrm)/leave/blackouts` · Operate mode · HR-only policy surface
**Visual overlays:** visible in the Human tab after injecting `http://localhost:8400/detect.js` on the authenticated blackouts page (not login). Live-server port 8400 was stopped after the run.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No pending/success/error; empty indistinguishable from loading; HrOnly denial flash; Off/Active updates after silent refetch |
| 2 | Match System / Real World | 1 | BLOCK/WARN enums leaked; US mm/dd date widgets vs Nigeria product; ISO strings in the table; subtitle is developer comment |
| 3 | User Control and Freedom | 1 | No edit; no cancel/reset; no undo; Delete has no back-out; form stays dirty after create |
| 4 | Consistency and Standards | 1 | Ignores FieldLabel, DataTable, empty states, Button, primary-container used on Leave History |
| 5 | Error Prevention | 1 | Unconfirmed Delete; default BLOCK + all types + all depts; no end >= start; Create not disabled while mutating |
| 6 | Recognition Rather Than Recall | 1 | Unlabeled dates; table omits types/department; placeholders vanish; enums instead of words |
| 7 | Flexibility and Efficiency | 1 | No edit-in-place, filters, or bulk; power path is delete-and-retype |
| 8 | Aesthetic and Minimalist Design | 2 | Tokens are Incel; layout is an uncomposed CRUD dump |
| 9 | Error Recovery | 1 | Native required only; API errors have no home; no undo after Delete/Off |
| 10 | Help and Documentation | 1 | One unreadable subtitle; no example window; Help chrome is global, not this ritual |
| **Total** | | **11/40** | **Critical** |

## Design Specificity Verdict

**Start here.** Category-interchangeable CRUD scaffold wearing Incel tokens. Do not replace the identity.

**LLM assessment:** The page uses cool paper, indigo wells, `rounded-xl` cards, and Plus Jakarta, but the composition is a generic “name + date range + enum + checkbox list + CRUD table.” It could be a SaaS maintenance window. What would make it Incel-specific is absent: working-day / Lagos date literacy, leave-type policy as a first-class decision, BLOCK as “employees cannot submit” vs WARN as “they can proceed with a warning,” audit reason, and apply-flow consequence. The subtitle is a developer comment. Leave History already speaks in FieldLabel, DataTable, empty states, and `primary-container` actions. This page did not get that authorship.

**Deterministic scan:** CLI `impeccable detect --json "app/(hrm)/leave/blackouts"` exited 0 with `[]` (0 findings). Live overlay on the rendered page reported: undersized-ui-text (Leave Management / HR / Coming Soon — mostly shell), line-length on the helper paragraph (~94ch), cramped-padding on the table header, overused-font (100% Plus Jakarta; data dates should be tabular/mono), plus overlay-artifact false positives (text-occlusion of overlay labels, dark-glow #ffba00 from overlay boxes, duplicate shape-assembled-illustration on the shell SVG).

**Visual overlays:** Overlays were visible in the Human tab. Console flagged undersized-ui-text, line-length, cramped-padding, overused-font, shape-assembled-illustration (x2), dark-glow, and text-occlusion. Treat shell chips and overlay artifacts as false positives for this surface; the line-length helper and cramped table header are real.

## Overall Impression

The shell still knows this is an HR policy ritual (HrOnly, shield nav). The page itself is a REST client: unlabeled dates, leaked enums, silent Active/Off, unconfirmed Delete, and a ghost empty table. The single biggest opportunity is to design it as the Incel leave-policy tool Leave History already depends on — same FieldLabel / DataTable / empty-vs-error / primary-container language — without changing the indigo world.

## What's Working

1. **The shell still knows who this is for.** `HrOnly` + HR-gated nav is the right dual-primary split.
2. **Material is on-brand even when the page is not designed.** stitchCard / stitchField wells, cool paper, hyper-rounded card.
3. **The real policy levers exist.** Leave-type checkboxes and department (including organisation-wide) are the correct Incel mechanism; the UI refuses to explain or display them after save.

## Priority Issues

### [P1] Unlabeled fields + leaked BLOCK/WARN + date-format collision
- **Why it matters:** Start and end are two identical native date wells with no labels. Enforcement’s accessible name is the enum. Nigeria does not think in US month-first; the table then shows ISO. HR cannot be sure they froze the window they meant.
- **Fix:** FieldLabel on every control. Human options: “Block submit” / “Warn, allow submit.” Display dates in Lagos-readable form with tabular nums. Set min on end from start.
- **Suggested command:** `/impeccable clarify` (pair with typeset for tabular dates)

### [P1] Silent Active/Off (~36×16px) and unconfirmed Delete
- **Why it matters:** High-stakes policy on/off and destroy are 12px text links. Delete fires with no dialog, no name, no undo. Off lifts a BLOCK window with no copy. Hit targets fail WCAG 2.2 2.5.8.
- **Fix:** Status pill + adequate targets; confirm dialog that names the period, dates, enforcement, and who is affected; pending/error; reset on success.
- **Suggested command:** `/impeccable harden`

### [P1] Dangerous defaults, then the table hides scope
- **Why it matters:** Empty leave types = all types. Empty department = organisation-wide. Default enforcement = BLOCK. List columns omit types and department. HR can freeze the company and later cannot see that they did.
- **Fix:** Explicit scope (“All leave types” as a labeled choice). Show types + department on every row. Confirm when BLOCK is organisation-wide.
- **Suggested command:** `/impeccable distill`

### [P1] No edit, no reset, no status — double-create is the happy path
- **Why it matters:** After create, the form stays filled; Create stays enabled; mutations ignore isError. No edit: a date typo is Delete + retype. API `reason` unused.
- **Fix:** Reset on success; disable + spinner on mutate; inline error; row Edit; empty vs loading vs error.
- **Suggested command:** `/impeccable harden` (critique also tagged audit; states belong in harden)

### [P2] Ghost empty table vs the History twin
- **Why it matters:** Zero rows = thead only. Leave History’s DataTable distinguishes empty vs error. HR cannot tell empty, loading, or error. Create is parked in column 1, not the header. Detector: cramped-padding on table header; line-length on helper.
- **Fix:** DataTable + empty copy; skeleton on load; retry on error; Create in PageHeader.action; section the form vs list; mobile stacked rows.
- **Suggested command:** `/impeccable layout` then `/impeccable adapt`

## Persona Red Flags

**Alex (Power User):** Create does not reset → second click duplicates. No inline edit. Active looks like a status string. Nested scroll in leave-type well.

**Sam (Accessibility):** Unlabeled date inputs; enforcement named BLOCK/WARN; Department label not wired; Active/Delete 16px with no row-identifying aria-label; no aria-live; HrOnly false denial flash; two h1s.

**Amaka (Incel HR ops):** Default path blocks every leave type for every department. Table will not tell her. Off pauses a freeze like a label. Delete is faster than an employee Apply with no audit comment.

## Cognitive load

8/8 checklist failures → high.

## Minor Observations

- Create uses rounded-lg bg-primary vs spec primary-container, 12×24, rounded-xl.
- PageHeader mb-6 plus space-y-6 double-stacks.
- Sticky module nav eats breadcrumb on scroll (shell).
- Detector overused-font is expected for UI sans; dates should still be tabular/mono.
- Default create is_active: true with no control on the form.

## Questions to Consider

- If the table is empty, how does HR know the product is working rather than broken?
- Why is the safest-looking path (leave the defaults) the one that BLOCKS every leave type for the whole organisation?
- Why can HR destroy a BLOCK window faster than an employee can name a reliever and submit?
- Leave History already paid for FieldLabel, DataTable, empty states, and a real primary button. Why does the policy that History depends on still look like a REST client?
