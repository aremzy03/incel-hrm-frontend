---
target: app/(hrm)/leave/settings/workflows
total_score: 11
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings/workflows"
timestamp: 2026-09-23T13-37-24Z
slug: app-hrm-leave-settings-workflows
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No loading/error; save has no feedback |
| 2 | Match System / Real World | 1 | PENDING_* and TEAM_LEAD enums |
| 3 | User Control and Freedom | 1 | Delete live template with no confirm; no cancel edit |
| 4 | Consistency and Standards | 1 | Unlabeled name; text-xs actions |
| 5 | Error Prevention | 0 | Destructive delete; live edit saves immediately |
| 6 | Recognition Rather Than Recall | 1 | JSON simulate; no stage meaning |
| 7 | Flexibility and Efficiency | 2 | Reorder arrows; simulate exists |
| 8 | Aesthetic and Minimalist Design | 1 | Three stacked raw tables |
| 9 | Error Recovery | 1 | Mutations unhandled in UI |
| 10 | Help and Documentation | 2 | Sequential-only subtitle |
| **Total** | | **11/40** | **Critical** |

#### Design Specificity Verdict
**LLM assessment**: Sequential Incel chain (TL → Sup → LM → HR → ED) is the product. The editor looks like an internal admin dump.
**Deterministic scan**: none.

#### Priority Issues
- **[P0] Delete template without confirm** — Live approval chain can disappear. Suggested command: `/impeccable harden`
- **[P1] No loading/error/pending/live region** — Suggested command: `/impeccable harden`
- **[P1] PENDING_* / source enums** — Human labels (Waiting on HR, Team Lead). Suggested command: `/impeccable clarify`
- **[P1] Simulate dumps JSON** — Stage list. Suggested command: `/impeccable distill`
- **[P1] Editor table unusable on mobile; tiny ↑↓** — Suggested command: `/impeccable adapt`

#### Persona Red Flags
**Riley**: Delete + save with no guards.
**Jordan**: Status codes.
**Casey**: Wide stage table.

#### Minor Observations
Named user / role fields are missing when source is NAMED_USER/ROLE — keep existing features; expose named user if already in the model.

#### Questions to Consider
- Should edit reset on cancel? Yes.
