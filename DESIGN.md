---
name: Incel Group HR Portal
description: Trustworthy indigo workspace for leave, loans, appraisals, and HR operations.
colors:
  surface: "#f9f9ff"
  surface-dim: "#cfdaf2"
  surface-bright: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f3ff"
  surface-container: "#e7eeff"
  surface-container-high: "#dee8ff"
  surface-container-highest: "#d8e3fb"
  on-surface: "#111c2d"
  on-surface-variant: "#454654"
  inverse-surface: "#263143"
  inverse-on-surface: "#ecf1ff"
  outline: "#767685"
  outline-variant: "#c6c5d6"
  surface-tint: "#4350ca"
  primary: "#000a76"
  on-primary: "#ffffff"
  primary-container: "#111fa2"
  on-primary-container: "#8c96ff"
  inverse-primary: "#bdc2ff"
  secondary: "#655b68"
  on-secondary: "#ffffff"
  secondary-container: "#ecdeee"
  on-secondary-container: "#6b616e"
  tertiary: "#470800"
  on-tertiary: "#ffffff"
  tertiary-container: "#6e1100"
  on-tertiary-container: "#fb785b"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#f9f9ff"
  on-background: "#111c2d"
  card: "#ffffff"
  muted: "#f0f3ff"
  muted-foreground: "#454654"
  ring: "#111fa2"
  sidebar: "#f0f3ff"
  sidebar-accent: "#e7eeff"
  status-pending-bg: "#fef3c7"
  status-pending-fg: "#b45309"
  status-approved-bg: "#dcfce7"
  status-approved-fg: "#15803d"
  status-rejected-bg: "#fee2e2"
  status-rejected-fg: "#b91c1c"
typography:
  display-lg:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "1.3"
  headline-md:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "1.4"
  title-sm:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "1.5"
  body-lg:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  body-md:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.6"
  label-md:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: "0.01em"
  data-table:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.5"
  brand-serif:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: "1.25"
rounded:
  sm: "1rem"
  md: "1.125rem"
  lg: "1.25rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  sidebar-width: "16rem"
  container-padding: "2rem"
  gutter: "1.5rem"
  stack-sm: "0.5rem"
  stack-md: "1rem"
  stack-lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  input:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  status-badge:
    backgroundColor: "{colors.status-pending-bg}"
    textColor: "{colors.status-pending-fg}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.label-md}"
  nav-item-active:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-surface}"
    padding: "12px 16px"
---

# Design System: Incel Group HR Portal

## Overview

**Creative North Star: "The Inviting Digital Workspace"**

This is an Operate surface for Incel Group HR: leave, loans, appraisals, and the people data around them. The world is a hybrid of **Corporate Modernism** and **Soft Minimalism** — deep indigo authority on a cool, paper-like field, with generous radius and whitespace so multi-stage approval never feels like a factory floor.

The system is built on **trust, precision, and approachability**. Brand lives in the lockup, the indigo, and the hyper-rounded cards — not in decoration. Scanability, status literacy, and native form behavior outrank expression. Authenticated chrome is Plus Jakarta Sans; the login/register brand panel may use Lora for the headline only.

**Key Characteristics:**

- Cool indigo surfaces (`surface` family), never warm stone greys
- Fixed 256px sidebar + fluid content
- Hyper-rounded containers (cards and primary actions at `rounded.xl`)
- Ambient, indigo-tinted shadows instead of heavy borders
- Pill status badges that make the approval chain readable at a glance
- JetBrains Mono only for money, IDs, and tabular data

## Colors

A deep indigo primary on a cool, slightly blue-tinted paper field. Layers of `surface-container-*` create zones without harsh lines. Secondary is a muted mauve used for tints (active nav, draft badges), not as a second brand.

### Primary

- **Incel Indigo** (`primary`): Brand, headings in the lockup, active bar, key text emphasis. Rare on large fills.
- **Action Indigo** (`primary-container`): Primary buttons, completed approval nodes, unread counts. This is the default filled action color.

### Secondary

- **Workspace Mauve** (`secondary` / `secondary-container`): Quiet accent. Active sidebar rows sit on `secondary-container`. Do not use as a competing CTA.

### Tertiary

- **Ember** (`tertiary` family): Reserved for rare emphasis and destructive-adjacent heat. Do not use as a third brand on dashboards.

### Neutral

- **Cool Paper** (`surface` / `background`): App canvas.
- **Tinted Tray** (`surface-container-low` / `sidebar`): Sidebar and input wells.
- **Card White** (`surface-container-lowest` / `card`): Raised work surfaces.
- **Ink** (`on-surface`): Body and titles.
- **Muted Ink** (`on-surface-variant`): Labels, helper text, inactive steps.
- **Hairline** (`outline-variant`): Card borders and timeline rails.

### Semantic

- **Pending:** amber (`status-pending-*`) for every in-flight approval stage.
- **Approved / success:** green pair.
- **Rejected / error:** `error` plus the red badge pair.
- **Active loan:** blue tint in loan badges only.

**The One Indigo Rule.** Large fills of `primary` belong on the unauthenticated brand panel. Inside the app, filled actions use `primary-container`; the rest of the screen stays in the surface ladder.

**The Cool Field Rule.** Backgrounds stay in the indigo-tinted surface tokens. Do not introduce warm grey, stone, or beige canvases from older drafts.

## Typography

**Display / UI Font:** Plus Jakarta Sans (loaded as `--font-plus-jakarta`)
**Data Font:** JetBrains Mono (`--font-jetbrains-mono`)
**Brand serif (auth only):** Lora

**Character:** Friendly professional geometry. Semi-bold headings with slightly tight tracking; body at 1.6 line-height so long leave reasons and policy copy do not fatigue.

### Hierarchy

- **Display** (`display-lg`, 700, 48px): Auth brand headlines only.
- **Headline LG** (600, 32px): Rare module titles.
- **Headline MD** (600, 24px): Page titles (`PageHeader`) and the sidebar wordmark.
- **Title SM** (600, 18px): Card and section titles (approval chain, settings groups).
- **Body LG** (400, 16px): Comfortable reading copy.
- **Body MD** (400, 14px): Default app copy, tables of prose, nav items.
- **Label MD** (500, 12px, +0.01em): Field labels above inputs, uppercase module section tags, helper captions.
- **Data table** (400, 13px, mono, tabular nums): Staff loans, IDs, balances, schedules.

### Named Rules

**The Workhorse Rule.** Plus Jakarta Sans is the interface. Lora does not appear in authenticated HR chrome.

**The Ledger Rule.** Money, employee IDs, and repayment grids use JetBrains Mono (or `tabular-nums` on the same role). Prose never does.

## Layout

Fixed-sidebar / fluid-content. The sidebar is a constant `16rem` (`w-64`) on desktop. Main content uses `spacing.gutter` (24px) horizontal padding and `stack-lg` (32px) between major blocks such as a request header and its approval timeline.

A 12-column mental grid with a 24px gutter. Vertical rhythm is 4px-based. `PageHeader` is title + optional subtitle + trailing action, not a custom hero.

**Responsive:** below the `lg` breakpoint (64rem) the sidebar becomes a drawer; content padding may drop to 16px on small screens so leave balances and forms remain usable. Top module tabs (Leave, Loans, Users, Appraisals) stay the wayfinding spine.

**Density:** Operate, not marketing. Prefer one primary action per header. Tables, filters, and status are first-class; illustration is not.

## Elevation & Depth

Depth is **ambient shadow + tonal layering**, not stacked drop shadows or hard elevation charts.

- Level 0 — canvas: `surface`
- Level 1 — sidebar / input wells: `surface-container-low`
- Level 2 — cards: `surface-container-lowest` plus `custom-shadow` (`0 10px 15px -3px rgb(0 10 118 / 0.05), 0 4px 6px -2px rgb(0 10 118 / 0.03)`)
- Level 3 — dialogs / popovers: card white with the larger ambient shadow (`0 10px 30px -10px hsl(240 4% 60% / 0.18)`)

Interactive cards may deepen the border toward `primary/30` on hover. Do not add glow, glass, or colored outer halos.

**The Flat-Until-Lifted Rule.** Surfaces rest on tone. Shadow appears to hold a card or a modal, not to decorate a row.

## Shapes

**Hyper-rounded geometry.** `--radius` is 1.25rem. Cards, primary buttons, and inputs use `rounded-xl` (1.5rem). Inputs stay slightly structured but still soft. Status badges and avatars are fully pill/circle (`9999px`).

Sidebar active state is a **4px left bar** in `primary-container`, not a filled pill for the whole item.

**The Contained Workspace Rule.** Primary containers (cards, dialogs, brand tiles) keep the large radius. Tiny chips and icon buttons may tighten; they must not go square.

## Components

### Buttons

Tactile, high-padding, never hairline.

- **Shape:** `rounded-xl` (1.5rem) on primary app actions.
- **Primary:** `primary-container` fill, white label, 12×24 padding. Hover: opacity ~90%, no color jump to a new hue.
- **Ghost / secondary:** transparent or hairline `outline-variant`; indigo text. Not a second filled brand.
- **Destructive:** `error` / destructive-tinted, never primary indigo.
- **Focus:** `ring` at `primary-container`, 2–3px, visible.

### Status Badges

Small, uppercase or title-case pills that encode the workflow. Pending stages share amber. Approved is green, rejected is red, draft uses secondary-container, cancelled/closed are muted surface. Do not invent a rainbow per role.

### Approval Timeline

Signature component. Vertical chain (Manager → HR → ED, plus Team Lead / Supervisor when those stages exist). Completed: filled `primary-container` with check. Active: pulsing `primary-container` ring on a white node. Upcoming: muted outline. A 2px `outline-variant` rail connects nodes.

### Sidebar Navigation

- Background: `surface-container-low`, right hairline `outline-variant`.
- Lockup: `public/hrm.svg` + “Incel Group” in `primary` + “HR Portal” in `label-md`.
- Active: 4px left bar + `secondary-container` row tint + bold label.
- Icons: 20px line icons, 2px stroke (Lucide).
- Section label: 10px bold uppercase tracking-widest, muted.

### Forms & Inputs

- Well: `surface-container-low`, no resting border, `rounded-xl`, 12×16 padding.
- Focus: 2px ring in `primary-container` (via `stitchFieldClass`).
- Labels sit above, `label-md` in `on-surface-variant`.
- Selects and textareas share the same well. Do not switch to outlined Material fields on new screens.

### Cards / Stats

`stitchCardClass`: `rounded-xl`, `surface-container-lowest`, `outline-variant` border, `custom-shadow`. Stat cards use uppercase 10px labels, a 3xl tabular value, and an indigo (or amber warning) icon. Hover may tint the border toward primary.

### Navigation (modules)

Top tabs switch Leave / Loans / Users / Appraisals. Appraisals stays in the spine even while coming soon. Disabled dashboard is not a visual fifth brand — keep it out until it ships.

## Do's and Don'ts

### Do:

- **Do** keep new HR screens in the cool indigo surface ladder and Plus Jakarta Sans.
- **Do** show the approval chain and status pill on every request detail.
- **Do** use JetBrains Mono (or tabular nums) for loan amounts, installments, and IDs.
- **Do** collapse the sidebar to a drawer below `lg`; keep the 256px rail on desktop.
- **Do** design Appraisals, dashboards, payroll viewing, and attendance to inherit this world — same shell, same radius, same status language.

### Don't:

- **Don't** restyle the app in warm grey / stone from an older Stitch prose draft; tokens in this file and `app/globals.css` win.
- **Don't** introduce a second display font inside authenticated chrome.
- **Don't** use heavy black drop shadows, neon glow, or glassmorphism.
- **Don't** hide policy failures in toasts-only patterns; blocking validation belongs next to the field.
- **Don't** drop Appraisals out of module navigation because the API is unbuilt.
- **Don't** put marketing illustration or testimonial chrome on operate screens.
