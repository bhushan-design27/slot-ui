# Plan: your-details

## Goal
Step 3 of 4 in booking an appointment. The person enters their full name,
email, phone number and optional notes for the therapist, then continues
to step 4. On desktop a booking summary sits next to the form.

## Layout
- `main`, `bg-(--color-surface-page)`, page padding `px-(--space-4) py-(--space-8)`
  on mobile (16px gutter, leaves room for group error bars),
  `lg:px-(--space-8)`.
- Inner wrapper `max-w-(--layout-content-max) mx-auto`.
- **Header** (top): "Step 3 of 4" (Body/Small, text/secondary) above the
  `h1` "Your details" (Heading/Large). `gap-(--space-2)`.
  Header → content: `gap-(--space-8)`.
- **Mobile (390)**: one column. Booking summary Card first (so the person
  sees what they're booking), then the form. `gap-(--space-8)`.
- **Desktop (1440)**: two columns, `lg:flex-row`, `lg:gap-(--space-8)`.
  Form column `max-w-(--layout-form-max)` (560) on the left, summary
  Card on the right (`flex-1`, at most `layout/form-max`), top-aligned.
- **Form**: fields stacked `gap-(--space-6)`; fields → actions
  `gap-(--space-8)`.
- **Actions**: row, `gap-(--space-4)`, right-aligned, Back then Continue.
  On mobile both full width, `flex-col-reverse` so Continue is on top
  (DOM order stays Back, Continue).

## Components
1. `Card elevation="flat" title="Booking summary"` — Card usage: "flat:
   a summary in a form / page that already has structure". Content: `dl`
   rows Service / Duration / Date and time / Price.
2. `Input label="Full name" autoComplete="name" required` — Input usage:
   free text, visible label.
3. `Input label="Email" type="email" autoComplete="email" required
   helper="We'll send your confirmation here."`
4. `Input label="Phone number" type="tel" autoComplete="tel" required
   helper="So we can reach you if your appointment changes."`
5. `Textarea label="Notes for your therapist (optional)"` with helper — new Slot component (gap 1 resolved).
6. `Button variant="secondary" size="large"` — "Back" (Button usage:
   secondary for "Back" next to a primary). Rendered as a Button, since
   there is no router yet; becomes `asChild` + link when routing exists.
7. `Button variant="primary" size="large" type="submit"` — "Continue"
   (one primary per area; large = main action on a sparse, touch-first form).

## Copy
- Step 3 of 4
- Your details
- Booking summary
- Service / Deep tissue massage
- Duration / 60 min
- Date and time / Tuesday 4 November at 10:00
- Price / $95
- Full name
- Email / We'll send your confirmation here.
- Phone number / So we can reach you if your appointment changes.
- Notes for your therapist (optional) / Injuries, pressure preferences or anything else they should know.
- Back
- Continue

## Gaps
1. **Multi-line notes field.** Slot has no textarea (Input usage: "The
   text spans multiple lines: Slot has no textarea yet").
2. **Summary on mobile** (decision, not a missing component): the request
   only specifies desktop. Plan shows it above the form on mobile.

**Decisions (2026-11-01):** gap 1 → add Textarea to Slot (Figma, code,
manifest); gap 2 → summary above the form on mobile.

## Change 1 (2026-11-01): compact summary on mobile

Decisions: Textarea and `layout/textarea-min-height` approved. Back stays
a Button until there is navigation.

### Layout
- **Mobile (below `lg`)**: replace the full summary Card above the form
  with a compact one-line summary, "Deep tissue massage · Tue 4 Nov,
  10:00 · $95", that expands to show the full details (Service,
  Duration, Date and time, Price). Collapsed by default. Space to the
  form stays `space/8`.
- **Desktop (`lg` and up)**: unchanged, the full `Card title="Booking
  summary"` beside the form. The compact summary is hidden.

### Copy (new)
- Deep tissue massage · Tue 4 Nov, 10:00 · $95
- Show details / Hide details (expand control, if it has a text label)

### Gap
3. **Expand/collapse.** Slot has no disclosure, accordion or collapsible
   component (manifest: Button, Card, Chip, Dialog, Icon, Input,
   RadioGroup, Select, Textarea). Dialog doesn't fit: its usage says not
   to use it for information that needs no decision. Chip doesn't fit:
   it's for filters.

**Decision (2026-11-01):** gap 3 → add a Disclosure component to Slot
(Figma first, then code, usage and manifest).

### Components (change 1)
- Mobile: `Disclosure summary="Deep tissue massage · Tue 4 Nov, 10:00 · $95"`
  (collapsed by default) with the details `dl` in its content slot,
  `lg:hidden`. Disclosure usage: secondary detail on a small screen.
- Desktop: `Card elevation="flat" title="Booking summary"`, `hidden lg:flex`.
- Both inside `aside aria-label="Booking summary"`; the details list is
  one shared `SummaryDetails` element.

## Change 2 (2026-11-01): two-line mobile summary

Decisions: Disclosure approved, with `color/surface/hover` (description
updated to "Background of a hovered interactive row, e.g. a menu option
or a disclosure summary.").

- Disclosure gets an optional `detail` line (Figma: `detail` text +
  `show detail` boolean; Body/Small, text/secondary). Trigger: 48px with
  summary only, 68px with detail.
- Mobile: `Disclosure summary="Deep tissue massage" detail="Tue 4 Nov,
  10:00 · $95"`.
