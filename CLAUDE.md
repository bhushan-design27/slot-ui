# CLAUDE.md

Rules for working in the **Slot** Figma file (`kcQ8UEPlSVCNw8Qs2LL6aZ`).

## Inspect before creating
- Always inspect existing variables and components before creating anything.
  Use the Figma tools (`get_variable_defs`, `get_metadata`, `get_design_context`)
  to check what already exists, and reuse it rather than duplicating.

## No hard-coded values
- Never hard-code colors, spacing, radius, stroke widths, or font sizes.
- Bind every value to a variable from the **Primitives** collection.
- Replace Figma's default auto layout gap (10) with a space variable on
  every frame, even frames with only one child.
- 0 is allowed without a variable (e.g. padding 0).

## Naming new variables
- Variable paths are lowercase.
- Follow the existing naming conventions:
  - `color/hue/step` (e.g. `color/blue/600`)
  - `space/n` (e.g. `space/4`)
  - `radius/name` (e.g. `radius/md`)
  - `border/width/n` (e.g. `border/width/1`)
  - `font/size/name` (e.g. `font/size/body`)
- Set **specific scopes** for each variable — never "all supported properties".
- Exception: color primitives have **no scopes**, so they're hidden from
  pickers. Components bind colors through Semantic tokens, which carry the
  scopes.
- Every new variable gets web code syntax when it's created
  (`var(--path-joined-with-dashes)`, e.g. `var(--color-text-primary)`).

## Naming components and layers
- In Figma, component names and variant values use **Title Case**
  (e.g. `Button`, `Primary`, `Hover`). In code, prop values are always
  lowercase (see "Props mirror Figma" below).
- Property names and layer names are lowercase (e.g. `size`, `state`, `label`).
- Exception: Icon variant values use Lucide names exactly
  (e.g. `chevron-down`, `check`).

## Text styles
- Text styles use Title Case with slash groups by role and size
  (e.g. `Label/Medium`, `Label/Small`, `Body/Medium`).
- Use Heading/Large once per screen, for the page title. Section and card
  titles use Heading/Small.
- Helper text always uses text/secondary, including in disabled states.

## UI copy
- UI copy uses sentence case (e.g. "Save changes", not "Save Changes").

## Borders and sizing
- For components with borders, exclude strokes from layout.
- Verify component heights match the size scale: **36 / 48 / 56**. The
  scale applies to controls with a background or border box (Button,
  Input, Select, Chip). Radio rows are 24px (20px circle + Body/Medium
  line); stacked with space/3 they repeat every 36px.
- Nested corners: inner radius = outer radius minus padding.
- Error indicators that mark a whole group sit outside the group's box,
  so showing them never shifts or indents content. (Radio Group: the bar
  is 14px left of the content, border/width/2 + space/3; containers must
  leave that space unclipped. Form columns have at least 16px of margin
  on mobile.)

## After every change
- Never disable a check to make it pass; fix the cause.
- Check sizes.
- Verify the rendered result with a screenshot (`get_screenshot`), not only the bindings.
- Report every variable used.
- Before finishing any task, check every auto layout frame you created
  or edited for Figma's default gap or padding of 10.

## Code
This folder (`slot-ui`) is the code version of Slot: Vite + React +
TypeScript, Tailwind CSS v4, shadcn/ui, Storybook.

### TypeScript everywhere
- All source is TypeScript: `.ts` / `.tsx`, including scripts and
  Storybook config. No `.js` / `.jsx` files.

### Only Slot CSS variables
- Components only use Slot CSS variables from `src/styles/tokens.css`.
  Never hex, `rgb()`, `oklch()` or other literal colors, and never
  Tailwind default colors (`bg-slate-500`, `text-white`, …). The default
  palette is removed in `src/index.css`, so those classes don't exist.
- Prefer **semantic** tokens (`--color-text-primary`,
  `--color-action-primary`) over primitives (`--color-blue-600`).
- Use Tailwind's variable syntax:
  `bg-(--color-action-primary)`, `text-(--color-text-primary)`,
  `p-(--space-4)`, `gap-(--space-2)`, `rounded-(--radius-md)`,
  `border-(length:--border-width-1)`, `text-(length:--font-size-body)`.
- shadcn utility names (`bg-primary`, `border-input`, `ring-ring`, …) are
  allowed: they are mapped to Slot semantic tokens in `src/index.css`.

### Props mirror Figma
- Component props use the Figma property names, with the Figma values
  lowercased (e.g. Figma `size` = `Small | Medium | Large` →
  `size?: 'small' | 'medium' | 'large'`). Prop values are always
  lowercase, even though Figma variant values are Title Case.
- Check the component in Figma (`get_design_context`) before writing or
  changing its props.

### Figma states → code
- `Default`, `Hover` and `Focus` are CSS (`:hover`, `:focus-visible`),
  not props.
- `Disabled` is the native `disabled` attribute.
- `Error` is an `invalid` prop, rendered as `aria-invalid`.
- `Selected` is a `selected` prop. `Open` is an `open` prop.
- Other variant properties map 1:1 to lowercase props with lowercase
  values (`variant`, `size`, …).
- Figma strokes are inside and excluded from layout, so draw borders with
  `inset-ring-*` (box-shadow), not `border`, to keep Figma padding and the
  36 / 48 / 56 heights.
- In code, focus rings use outline + outline-offset, so they work on any
  background:
  `focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)`.
  (Figma keeps the two drop shadows; same geometry.) `outline-solid` is
  needed because components set `outline-none`.

### Tokens
- Source of truth: `tokens/slot.tokens.json` (W3C DTCG, exported from the
  Figma Primitives + Semantic collections; semantic tokens are aliases).
- `src/styles/tokens.css` is generated. Never edit it by hand; run
  `npm run tokens`.
- CSS variable names = Figma code syntax (WEB). Variables without code
  syntax get the path joined with `-` (`npm run tokens` lists them).
- Before finishing: `npm run manifest` (then commit `manifest/` and
  `registry.json`), `npm run test:a11y` (axe on every story, headless),
  `npm run check:tokens` (fails on hex / `rgb()` /
  `hsl()` colors and non-Slot Tailwind color or radius classes) and
  `npx tsc -b`.

### Dialogs
- A dialog without a close button must always have a visible dismiss
  action, and must close on Escape.

### shadcn/ui
- Add components with `npx shadcn add <name>`, then check their classes
  against these rules (no raw colors, props renamed to the Figma names).
