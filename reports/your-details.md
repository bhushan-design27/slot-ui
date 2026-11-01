# Report: your-details

Screen: `src/screens/YourDetails.tsx`. Stories: `Screens/YourDetails` (Mobile 390, Desktop 1440).

## Plan
See [plans/your-details.md](../plans/your-details.md). Changes while building:

- **Gap 1 (no textarea), resolved by adding Textarea to Slot**, as you chose:
  - Figma: `Textarea` component set `115:58` on the Components page, cloned
    from Input (`state` = Default / Focus / Error / Disabled; `label`,
    `placeholder`, `helper` text props). The field has a minimum height
    bound to the new variable and its text is top-aligned. Screenshot-checked.
  - New primitive `layout/textarea-min-height` = 120 (4 Body/Medium lines
    + space/3 top and bottom), scope `WIDTH_HEIGHT`, WEB syntax
    `var(--layout-textarea-min-height)`. Added to `tokens/slot.tokens.json`,
    `npm run tokens` regenerated `src/styles/tokens.css`.
  - Code: `src/components/ui/textarea.tsx` + stories (same API and
    classes as Input, `min-h-(--layout-textarea-min-height)`, `resize-y`).
  - `manifest/usage.md`: new Textarea entry (DRAFT); Input's "no textarea
    yet" line now points to Textarea. `npm run manifest` re-run.
- **Gap 2**: summary Card is above the form on mobile, right of it on desktop.
  It comes first in the DOM, in an `aside` labelled "Booking summary".
  (Replaced on mobile in change 1, below.)

### Variables used
- Figma (Textarea): space/2, space/3, space/4, space/6, radius/md,
  border/width/1, border/width/2, font/family/base, font/size/body,
  font/size/small, font/line-height/body, font/line-height/small,
  layout/textarea-min-height (new); color/surface/field,
  color/surface/disabled, color/border/field, color/border/focus,
  color/border/error, color/border/disabled, color/text/primary,
  color/text/placeholder, color/text/secondary, color/text/error,
  color/text/disabled.
- Screen (on top of what the components use): space/1, space/2, space/3,
  space/4, space/6, space/8, layout/content-max, layout/form-max,
  font/size/heading + line-height/heading, font/size/body + line-height/body,
  font/size/small + line-height/small, color/surface/page,
  color/text/primary, color/text/secondary.

## Checks
All checks passed first time (`npx tsc -b`, `check:tokens`, `check:slot`,
`test:a11y`: 30/30 stories, including the two screen stories and the
two Textarea stories).

Rendered check (Storybook + Playwright): Inputs 48px, Textarea 120px,
Buttons 56px at both widths; no horizontal scroll at 390.

## Scores
- **Task completeness: 5**: every requested field, the continue action and
  the desktop summary with the exact details are there, plus Back and the
  step label the flow needs.
- **Visual hierarchy: 4**: one h1, a clear primary Continue, and a quiet
  flat summary; on mobile the summary pushes the first field down to about
  480px, so the form starts below the fold on short phones.
- **Copy clarity: 5**: short, sentence-case labels, and the helpers say why
  each piece of data is asked for ("So we can reach you if your
  appointment changes").
- **Consistency with other Slot screens: n/a (3 by default)**: this is the
  first screen in `src/screens/`, so there is nothing to compare with yet;
  it follows the manifest's widths and Button/Card/Input usage.

## Questions and open decisions
1. **Approve the new Textarea** (Figma `115:58`, code, usage entry) and
   the new token `layout/textarea-min-height`. The `layout/` group held
   only widths before; say if you'd prefer a different group name.
2. **Mobile summary**: above the form, full size. A compact one-line
   summary would get the form higher on small phones; that would need a
   design decision.
3. **Back** is a Button with no handler: there's no router yet. When
   there is, it should be `asChild` wrapping a link (Button usage).
4. Validation and error copy aren't in scope; the fields are `required`
   and the form doesn't submit anywhere.
5. Draft usage rules relied on: Button (primary/secondary, size large),
   Card (flat summary), Input, Textarea (new, mine). None are approved yet.

---

## Change 1: compact summary on mobile (2026-11-01)

Decisions: Textarea and `layout/textarea-min-height` approved; Back stays
until there's navigation; mobile gets a compact, expandable summary.
Plan: [plans/your-details.md, "Change 1"](../plans/your-details.md).

### Gap and resolution
Slot had no expand/collapse component (gap 3). You chose to add a
**Disclosure** to Slot:

- **Figma:** `Disclosure` component set `117:91` on the Components page.
  `state` = Default / Hover / Focus / Open (Open as a state, like Select).
  `summary` text property and a `content` SLOT (`117:92`), like Card's
  content slot. Anatomy: a 1px border/subtle box, radius/md; a 48px
  trigger row (space/3 + Body/Medium + space/3, space/4 sides) with the
  `chevron-down` Icon, rotated 180° when Open; content slot padding
  space/1 top, space/4 sides and bottom, rows space/3 apart. Hover fills
  the box with color/surface/hover. Focus uses the same "focus ring" layer
  as Button (radius/lg, border/width/2, color/border/focus, 4px out).
  All frames audited: no unbound gap or padding, none at 10.
- **Code:** `src/components/ui/disclosure.tsx` (Radix Collapsible) +
  stories. Props: `summary`, `open`, `defaultOpen`, `onOpenChange`,
  `children`. Trigger is a native button with aria-expanded and
  aria-controls. Border is an `::after` inset-ring so the hover fill
  can't hide it. Focus is the standard outline.
- **Usage:** new Disclosure entry (DRAFT) in `manifest/usage.md`; manifest
  and registry regenerated (registry item depends on `icon`).
- **No new tokens.**

### Screen
- Mobile (below `lg`): `Disclosure` with the compact summary, collapsed;
  expanding shows Service, Duration, Date and time, Price.
- Desktop: unchanged full `Card` beside the form.
- Only one of the two is displayed at a time (`lg:hidden` /
  `hidden lg:flex`), so only one is in the accessibility tree.

### Variables used (new in this change)
Disclosure (Figma and code): space/1, space/2, space/3, space/4,
radius/md, radius/lg (focus ring), border/width/1, border/width/2,
font/size/body, font/line-height/body, font/family/base,
color/surface/page, color/surface/hover, color/border/subtle,
color/border/focus, color/text/primary; the Icon's color/icon/default.
Screen: no new variables.

### Checks
- Round 1: all four checks passed first time (32/32 stories).
- Visual review found two problems the checks can't catch. Both were fixed,
  then all four checks were run again and passed:
  1. Mobile, open, focused: the trigger's focus outline touched the
     "Service" label. Cause: content started right at the trigger's
     bottom edge, and the outline sits 4px outside it. Fix: `space/1`
     top padding on the content (Figma slot and code).
  2. Disclosure "All variants" story: four columns squeezed to ~120px,
     wrapping the summary to 7 lines. Fix: stack the states at
     `layout/form-max` width.
- Rendered: trigger 72px at 390 (summary wraps to two lines), 48px at
  560 (one line). Enter toggles it (aria-expanded false → true). No
  horizontal scroll at 390. Desktop shows only the Card.

### Scores (updated)
- **Task completeness: 5**: everything requested, now including the
  compact mobile summary that expands to the full details.
- **Visual hierarchy: 5**: on mobile the first field now starts at ~240px
  instead of ~480px, so the form is above the fold. The summary is still
  one tap away, and the desktop layout is unchanged.
- **Copy clarity: 4**: the compact summary is clear, but at 390 it wraps
  after "Tue 4 Nov," so it's two lines, not the one line asked for.
- **Consistency with other Slot screens: n/a**: still the only screen.

### Questions and open decisions
1. **The summary wraps at 390.** "Deep tissue massage · Tue 4 Nov, 10:00 ·
   $95" needs ~330px and the trigger has ~298px. Options: accept two
   lines (current; trigger grows to 72px); shorten the copy (e.g. drop
   "Deep" or the day name); or use Body/Small for the summary (44px,
   which is off the 36/48/56 scale). I'd accept two lines.
2. **Approve Disclosure** (Figma `117:91`, code, DRAFT usage entry).
   Hover reuses `color/surface/hover`, whose job is "hovered row in a menu
   or list"; say if you'd rather have a separate token.
3. Draft usage rules relied on: Button, Card, Input, Textarea,
   Disclosure (new). None are approved yet.

---

## Change 2: two-line mobile summary (2026-11-01)

Decisions: the summary is two deliberate lines (service; date, time and
price). Disclosure approved, with `color/surface/hover`, and that token's
description updated.

### Changes
- **Disclosure, Figma (`117:91`):** new `detail` text property and
  `show detail` boolean. The summary and detail sit in a `text` column
  (gap 0); detail is Body/Small, color/text/secondary. Trigger is 68px
  (space/3 + 24 + 20 + space/3); focus rings resized. Summary default is
  now "Deep tissue massage".
- **Disclosure, code:** optional `detail?: string` prop, same styling.
  Docs, stories and usage updated ("use `detail` instead of letting one
  long summary wrap").
- **Token:** `color/surface/hover` description is now "Background of a
  hovered interactive row, e.g. a menu option or a disclosure summary."
  Changed in Figma and `tokens/slot.tokens.json`; tokens and manifest
  regenerated. Value, scopes and code syntax are unchanged.
- **Usage status:** Disclosure and Textarea marked Approved (you approved
  both components, including their usage entries).
- **Screen:** `summary="Deep tissue massage" detail="Tue 4 Nov, 10:00 · $95"`.
- **Variables used (new in this change):** font/size/small,
  font/line-height/small, color/text/secondary (detail line). No new
  variables.

### Checks
- Round 1: tsc, check:tokens, check:slot passed; test:a11y passed.
  Rendered check showed the button's accessible name as "Deep tissue
  massage , Tue 4 Nov…": a screen-reader-only comma I'd added between
  the lines picked up a stray space.
- Round 2: replaced it with `aria-label="summary, detail"`. test:a11y
  failed on 3 stories (Disclosure Playground, All variants; YourDetails
  Mobile): `label-content-name-mismatch` ("Elements must have their
  visible text as part of their accessible name"). Cause: the comma made
  the label differ from the visible text.
- Round 3: removed the aria-label; the name comes from the visible text
  ("Deep tissue massage Tue 4 Nov, 10:00 · $95"; the browser separates
  the two block lines). All four checks pass, 32/32 stories.
- Rendered at 390: trigger 68px, two lines as designed, no horizontal
  scroll; expanded content and desktop Card unchanged.

### Scores (updated)
- **Task completeness: 5**: unchanged.
- **Visual hierarchy: 5**: the service name leads, and the when and how
  much sit quieter underneath, the same pattern as the Card sample in Figma.
- **Copy clarity: 5**: two deliberate lines, nothing wraps at 390.
- **Consistency with other Slot screens: n/a**: still the only screen.

### Open
- Usage entries still DRAFT: Button, Card, Chip, Dialog, Icon, Input,
  RadioGroup, Select.
