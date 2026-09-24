---
target: app/(hrm)/leave/settings/policies
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings/policies"
timestamp: 2026-09-23T13-37-23Z
slug: app-hrm-leave-settings-policies
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading row; no error; filtered-empty is a blank tbody |
| 2 | Match System / Real World | 2 | DRAFT/ACTIVE/ARCHIVED; PATCH jargon on detail |
| 3 | User Control and Freedom | 2 | window.confirm; delete draft has no in-app dialog |
| 4 | Consistency and Standards | 1 | Raw table; PolicyForm labels not wired to inputs |
| 5 | Error Prevention | 2 | Publish warns via native confirm; archive/delete weaker |
| 6 | Recognition Rather Than Recall | 2 | Diffs show raw field keys; filters unlabeled |
| 7 | Flexibility and Efficiency | 2 | Filters; row link to detail |
| 8 | Aesthetic and Minimalist Design | 2 | Long PolicyForm wall; JSON-ish diffs |
| 9 | Error Recovery | 2 | Create/save errors exist; list load failure does not |
| 10 | Help and Documentation | 2 | Clone-to-change subtitle; form jargon (AUTO, BLOCK) |
| **Total** | | **19/40** | **Poor** |

#### Design Specificity Verdict
**LLM assessment**: Versioned publish/clone/archive is Incel policy truth. Presentation is an unlabelled admin form.
**Deterministic scan**: PolicyForm clean.
**Visual overlays**: CLI-only.

#### Overall Impression
The lifecycle is right; the list and form fail scanability, a11y, and mobile.

#### What's Working
- Clone-to-edit published policies is the correct product rule.
- StatusBadge on the list.
- Impact preview exists.

#### Priority Issues
- **[P1] List empty/error/filtered-empty missing** — Why: HR cannot tell load failure from no drafts. Suggested command: `/impeccable harden`
- **[P1] PolicyForm labels not associated; BLOCK/AUTO jargon** — Why: Screen readers and first-time HR fail. Suggested command: `/impeccable clarify`
- **[P1] window.confirm + delete without in-app dialog** — Why: Inconsistent with blackouts; easy misclick. Suggested command: `/impeccable harden`
- **[P1] List is desktop table only** — Why: Name + status + entitlement must stack on mobile. Suggested command: `/impeccable adapt`
- **[P2] Diffs use raw keys (annual_entitlement)** — Why: Not HR language. Suggested command: `/impeccable clarify`

#### Persona Red Flags
**Jordan**: “Do not PATCH ACTIVE” is engineer-speak.
**Sam**: Unlabeled PolicyForm fields.
**Casey**: Wide policy table and form.

#### Minor Observations
Keep existing / departmental pack is a real rule — keep it, label it.

#### Questions to Consider
- Should new draft stay a separate route (yes — keep)?
