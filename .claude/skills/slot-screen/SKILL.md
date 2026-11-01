---
name: slot-screen
description: Build a screen, page or view with the Slot design system in this repo (slot-ui). Use when asked to build, design, mock up or add a screen, page, form, flow step or view with Slot. Plans from the Slot manifest, builds with Slot components only, runs the checks, and writes a review report for approval.
---

# Build a screen with Slot

Slot is built to be followed exactly. The manifest is the allow-list: use
only the components, props, values and tokens it lists. Never invent a
component, prop, prop value or token. When the request needs something
Slot doesn't have, stop and ask (step 1).

Names: `<screen>` is kebab-case (`book-appointment`), `<Screen>` is
PascalCase (`BookAppointment`). Work through the four steps in order and
don't skip one.

## 1. PLAN

1. Read `manifest/slot.manifest.json` (components with props, allowed
   values, defaults, Figma states, accessibility notes and usage; semantic
   tokens and scales; rules) and `manifest/usage.md` (purpose, use when,
   don't use when). Also read `CLAUDE.md` and the existing screens in
   `src/screens/`, to stay consistent with them.
2. Pick components with the usage guidance. Usage entries whose status
   isn't "Approved" are drafts: follow them, and mention it in the report
   if a decision relied on one.
3. Write `plans/<screen>.md`:
   - **Goal**: what the user does on this screen, in one or two sentences.
   - **Layout**: regions top to bottom, for mobile (390) and desktop
     (1440); widths (`layout/form-max` for forms, `layout/content-max`
     for pages) and the space tokens between regions.
   - **Components**: every component instance, in order, with every prop
     and its value, e.g. `Button variant="primary" size="large"` —
     "Book now". Mark which usage rule justifies each choice.
   - **Copy**: every visible string, in sentence case.
   - **Gaps**: anything the request needs that Slot doesn't have.
4. If there are gaps, **stop and ask** before building. For each gap,
   propose 2–3 options, e.g. compose existing components, drop or change
   the requirement, or add a new Slot component (Figma first, then code,
   then the manifest). Recommend one. Don't build around a gap silently,
   and don't use raw HTML controls or third-party UI to fill it.

## 2. BUILD

1. `src/screens/<Screen>.tsx`: one exported component `<Screen>`.
   - UI only from `@/components/ui/*`; plain layout elements (`main`,
     `section`, `header`, `div`, `form`, `h1`, `p`, `ul`) for structure.
   - No raw `button`, `input`, `select` or `textarea`; no `style` props.
   - Layout and spacing with Slot tokens only, in Tailwind variable syntax:
     `gap-(--space-4)`, `p-(--space-6)`, `max-w-(--layout-form-max)`,
     `text-(--color-text-primary)`. Colours: semantic tokens only.
   - Prop values exactly as the manifest's `allowedValues`, as literals.
   - One Heading/Large page title (`h1`), Heading/Small for section and
     card titles. Copy in sentence case.
   - Responsive from 390 to 1440: mobile first, Tailwind breakpoints for
     the desktop layout.
2. `src/screens/<Screen>.stories.tsx`, title `Screens/<Screen>`, with
   `parameters: { layout: 'fullscreen' }` and two stories:
   - `Mobile`: `globals: { viewport: { value: 'slot-mobile', isRotated: false } }`
   - `Desktop`: `globals: { viewport: { value: 'slot-desktop', isRotated: false } }`
   Both viewports are defined in `.storybook/preview.tsx`.

## 3. CHECK

Run, in this order:

```sh
npx tsc -b
npm run check:tokens
npm run check:slot
npm run test:a11y
```

If anything fails: fix the cause and run all four again. At most 3 fix
rounds. Never disable, skip or weaken a check to make it pass (CLAUDE.md).
Log every failure and fix as you go: the check, the exact error, the
cause, and the change. If it still fails after 3 rounds, stop and put the
remaining failures in the report.

## 4. REVIEW

1. Score the screen 1–5 on each, with one sentence of reasoning:
   - **Task completeness**: can the user do everything the request asked?
   - **Visual hierarchy**: is the main action and the page structure clear?
   - **Copy clarity**: is every string short, specific and in sentence case?
   - **Consistency with other Slot screens**: same patterns, spacing,
     widths and component choices as `src/screens/` (say so if this is
     the first screen).
   Score honestly; a 5 needs a reason, not just the absence of problems.
2. Write `reports/<screen>.md`:
   - the plan (or a link to `plans/<screen>.md` plus any changes made
     while building);
   - every check failure and its fix, in order, with the round number
     (or "all checks passed first time");
   - the four scores with their sentences;
   - questions and open decisions, including draft usage rules relied on.
3. Ask the user to approve the screen. Don't commit until they approve.
