---
target: app/(hrm)/leave/settings/general
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings/general"
timestamp: 2026-09-23T13-37-24Z
slug: app-hrm-leave-settings-general
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | “Loading…”; success and error share one msg |
| 2 | Match System / Real World | 1 | CALENDAR/FISCAL/SPLIT/START_YEAR |
| 3 | User Control and Freedom | 2 | Save only; no cancel/reset |
| 4 | Consistency and Standards | 1 | Unlabeled timezone/select; checkboxes as a wall |
| 5 | Error Prevention | 2 | Encashment/self-approval notes exist |
| 6 | Recognition Rather Than Recall | 1 | Placeholders as labels; raw tx types |
| 7 | Flexibility and Efficiency | 2 | Accrual preview + adjust on one page |
| 8 | Aesthetic and Minimalist Design | 1 | One undifferentiated form |
| 9 | Error Recovery | 1 | No settings load error; adjust has no feedback |
| 10 | Help and Documentation | 2 | Some helper sentences |
| **Total** | | **14/40** | **Poor** |

#### Priority Issues
- **[P1] Load/save/adjust states mixed or missing** — Separate success/error, retry, live region. Suggested command: `/impeccable harden`
- **[P1] Unlabeled fields + enum jargon** — Calendar year / Split across years. Suggested command: `/impeccable clarify`
- **[P1] Wall of 8 checkboxes + raw preview/tx tables** — Group notifications vs approvals vs encashment; DataTable. Suggested command: `/impeccable distill`
- **[P1] Mobile: unlabeled numbers, tiny Save** — Suggested command: `/impeccable adapt`
- **[P2] Balance adjust only lists the signed-in user’s balances** — Keep honest copy; label it. Suggested command: `/impeccable clarify`

#### Persona Red Flags
**Jordan**: SPLIT vs START_YEAR.
**Sam**: Timezone and reason unlabeled.
**Riley**: Adjust with empty reason silently no-ops.

#### Questions to Consider
- Keep accrual preview on this page? Yes, grouped as a secondary card.
