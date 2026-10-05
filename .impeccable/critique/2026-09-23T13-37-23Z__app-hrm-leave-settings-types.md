---
target: app/(hrm)/leave/settings/types
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings/types"
timestamp: 2026-09-23T13-37-23Z
slug: app-hrm-leave-settings-types
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading vs empty collide; delete errors swallowed |
| 2 | Match System / Real World | 2 | Filter chips “all/active/inactive”; “Fallback days” |
| 3 | User Control and Freedom | 2 | Overlay dismiss on backdrop; no Escape; no dialog role |
| 4 | Consistency and Standards | 1 | Raw table vs blackouts DataTable; icon-only actions |
| 5 | Error Prevention | 2 | Delete confirms; activate/deactivate do not |
| 6 | Recognition Rather Than Recall | 2 | Unassociated labels; color swatch unlabeled in table |
| 7 | Flexibility and Efficiency | 2 | Filters exist; no row href/search |
| 8 | Aesthetic and Minimalist Design | 2 | Wide 8-col table; primary fill vs primary-container |
| 9 | Error Recovery | 1 | Delete catch is empty; no list error/retry |
| 10 | Help and Documentation | 2 | Subtitle helps; form fields lack hints |
| **Total** | | **18/40** | **Poor** |

#### Design Specificity Verdict
**LLM assessment**: Leave-type codes and maternity/paternity eligibility are product-specific; the chrome is a generic admin table.
**Deterministic scan**: No findings in types/page.tsx.
**Visual overlays**: CLI-only this run.

#### Overall Impression
HR can manage types, but failures are silent and the table collapses on mobile.

#### What's Working
- Delete copy correctly steers toward deactivate when history exists.
- Eligibility is human (Female only / Male only / All).
- Color picker exists for calendar identity.

#### Priority Issues
- **[P1] List has no error/retry; delete errors swallowed** — Why: Failed delete looks like success. Fix: live region, role=alert, refetch. Suggested command: `/impeccable harden`
- **[P1] Overlay is not a dialog** — Why: No role, Escape, or focus. Fix: SettingsConfirm/form dialog pattern. Suggested command: `/impeccable harden`
- **[P1] Desktop-only table, icon actions under 44px** — Why: Unusable on phone. Fix: DataTable + stacked cards, labeled min-h-11 actions. Suggested command: `/impeccable adapt`
- **[P2] Filters and fields lack FieldLabel / human chips** — Why: “all” is not a label. Fix: All / Active / Inactive + FieldLabel. Suggested command: `/impeccable clarify`

#### Persona Red Flags
**Sam**: Icon-only edit/delete; modal not announced.
**Riley**: Delete failure is silent.
**Casey**: Horizontal table, tiny targets.

#### Minor Observations
bg-primary vs One Indigo Rule (primary-container).

#### Questions to Consider
- Should deactivate require the same confirm as delete?
