---
target: app/(hrm)/leave/settings/calendars
total_score: 12
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings/calendars"
timestamp: 2026-09-23T13-37-24Z
slug: app-hrm-leave-settings-calendars
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No loading/error |
| 2 | Match System / Real World | 1 | Weekdays as [0,1,2,3,4]; UUID assignments |
| 3 | User Control and Freedom | 1 | Deletes unconfirmed |
| 4 | Consistency and Standards | 1 | Placeholder-as-label |
| 5 | Error Prevention | 0 | Delete working calendar / holiday / assignment instantly |
| 6 | Recognition Rather Than Recall | 1 | Assignment row is id/id/id |
| 7 | Flexibility and Efficiency | 2 | Day chips; assign to dept or employee |
| 8 | Aesthetic and Minimalist Design | 2 | Three equal cards |
| 9 | Error Recovery | 1 | No mutation errors |
| 10 | Help and Documentation | 2 | Points to Public holidays |
| **Total** | | **12/40** | **Poor** |

#### Priority Issues
- **[P0] Deletes without confirm** — Suggested command: `/impeccable harden`
- **[P1] No empty/loading/error** — Suggested command: `/impeccable harden`
- **[P1] Weekday numbers and UUID assignment rows** — Human day names and resolved names. Suggested command: `/impeccable clarify`
- **[P1] Unlabeled create fields; tiny destructive links** — FieldLabel + 44px. Suggested command: `/impeccable layout`
- **[P2] Three equal-weight sections** — Working calendars lead. Suggested command: `/impeccable layout`

#### Persona Red Flags
**Riley**: Instant delete of org default calendar.
**Jordan**: [0,1,2,3,4] is not “Mon–Fri”.
**Casey**: Dense lists, tiny Remove.

#### Questions to Consider
- Keep holiday-calendar editing here vs public holidays upload? Yes — different objects.
