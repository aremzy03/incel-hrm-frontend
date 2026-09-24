---
target: app/(hrm)/leave/settings
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/aremzy03/Document/cursor_projects/incel_apps/incel_hrm_app/incel-hrm-frontend/app/(hrm)/leave/settings"
timestamp: 2026-09-23T13-37-23Z
slug: app-hrm-leave-settings
closed: true
---
Method: ⚠️ DEGRADED: single-context (nested subagent spawn interrupted; parent forbids further nested agents)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active subnav tint; hub has no loading of its own |
| 2 | Match System / Real World | 3 | Grouped HR language; Overview vs Leave settings naming |
| 3 | User Control and Freedom | 3 | Breadcrumb back to Leave / hub |
| 4 | Consistency and Standards | 3 | Matches indigo cards; 10px group labels off ramp |
| 5 | Error Prevention | 3 | Read-only hub; HrOnly gate |
| 6 | Recognition Rather Than Recall | 3 | Descriptions on hub cards |
| 7 | Flexibility and Efficiency | 2 | Eight destinations; sticky nav helps but no search |
| 8 | Aesthetic and Minimalist Design | 3 | Grouped cards; hover-only chevrons |
| 9 | Error Recovery | 3 | Denied state has Back to Leave |
| 10 | Help and Documentation | 3 | Group and item descriptions |
| **Total** | | **29/40** | **Good** |

#### Design Specificity Verdict
**LLM assessment**: Authored for Incel leave policy work — types, assignments, approval chains — not a generic settings dump.
**Deterministic scan**: 1 advisory — `text-[10px]` group labels in LeaveSettingsShell off DESIGN.md ramp.
**Visual overlays**: No reliable user-visible overlay in this degraded run (detector CLI only).

#### Overall Impression
The hub is the strongest settings surface. The shared subnav is the weak joint: tap targets and hover-only affordances fail on a phone.

#### What's Working
- Grouped IA (General / Types & policies / Calendars / Approval) matches HR mental model.
- Hub cards carry item descriptions so first-time HR can choose a destination.
- Breadcrumb + Overview keep an exit from nested tabs.

#### Priority Issues
- **[P1] Subnav tap targets under 44px** — Why: HR uses this on a phone; py-2 icon rows miss WCAG 2.2 AA. Fix: min-h-11 links, visible focus. Suggested command: `/impeccable adapt`
- **[P1] Hub chevrons appear only on hover** — Why: Touch users never see the affordance. Fix: always-visible muted chevron. Suggested command: `/impeccable adapt`
- **[P2] Group labels use 10px** — Why: Off the type ramp; low contrast at small size. Fix: `text-label-md`. Suggested command: `/impeccable layout`

#### Persona Red Flags
**Alex**: Eight destinations, no keyboard shortcut between tabs.
**Sam**: Subnav rows shorter than 44px; group labels tiny.
**Jordan**: Overview vs “Leave settings” in the breadcrumb can feel like two homes.

#### Minor Observations
Hub grid is solid; do not restyle the indigo world.

#### Questions to Consider
- Should Overview stay as a card hub, or jump HR into Types?
