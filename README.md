# Slot

Slot is a design system built to be followed reliably by AI agents.
Its rules are written down precisely and checked by scripts, so that
an agent (or a person) building with Slot produces the same result the
design intends, without guesswork.

This repository, `slot-ui`, is the code version of Slot. Every component
is built from its Figma component set and uses only Slot design tokens.

- Storybook: [bhushan-design27.github.io/slot-ui](https://bhushan-design27.github.io/slot-ui/)
- Figma: [FIGMA_URL](FIGMA_URL)

## Stack

- React and TypeScript, built with Vite
- Tailwind CSS v4
- shadcn/ui (Radix primitives), restyled with Slot tokens
- Storybook, with accessibility checks on every story

## Components

Button, Input, Icon, Card, Chip, Select and Dialog, in
`src/components/ui/`. Each has a Storybook page with controls and an
"All variants" story laid out like its Figma sheet.

Component props mirror the Figma component properties: the same property
names, with lowercase values (Figma `size = Small` becomes
`size="small"`). Figma states map to code consistently: Hover and Focus
are CSS, Disabled is the native `disabled` attribute, Error is an
`invalid` prop.

## How tokens flow from Figma to code

1. **Figma variables** are the source of truth. The Primitives collection
   holds raw values (colors, spacing, radius, type sizes); the Semantic
   collection holds named roles (`color/text/primary`,
   `color/action/primary`) that alias primitives. Every variable has a
   web code syntax, e.g. `var(--color-text-primary)`.
2. **`tokens/slot.tokens.json`** is the export of both collections in the
   W3C Design Tokens (DTCG) format. Semantic tokens stay aliases.
3. **`npm run tokens`** generates `src/styles/tokens.css`: one CSS
   variable per token, named after its Figma code syntax. This file is
   generated and never edited by hand.
4. **`src/index.css`** removes Tailwind's default palette and maps the
   shadcn/ui theme variables onto Slot semantic tokens.
5. **Components** use the tokens through Tailwind's variable syntax, e.g.
   `bg-(--color-action-primary)` or `p-(--space-4)`.
6. **`npm run check:tokens`** fails if any component uses a literal color
   or a Tailwind color or radius class that isn't a Slot token.

## Getting started

Requires Node.js 24.

```sh
npm install
npx playwright install chromium   # browser for the accessibility tests
npm run storybook
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run storybook` | Start Storybook on http://localhost:6006 |
| `npm run build-storybook` | Build the static Storybook into `storybook-static/` |
| `npm run tokens` | Regenerate `src/styles/tokens.css` from `tokens/slot.tokens.json` |
| `npm run check:tokens` | Fail on literal colors and non-Slot Tailwind color or radius classes |
| `npm run test:a11y` | Run every story in headless Chromium and check it with axe; any violation fails |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build |
| `npm run lint` | Lint with oxlint |

## Continuous integration

On every push to `main`, GitHub Actions runs `check:tokens`, the
TypeScript check, `test:a11y` and the Storybook build. When all of them
pass, the built Storybook is deployed to GitHub Pages. If any check
fails, nothing is deployed.

## CLAUDE.md

[`CLAUDE.md`](CLAUDE.md) holds the rules for working on Slot, in Figma
and in code: naming, token usage, how Figma states map to props,
accessibility and the checks to run before finishing.

It exists because AI agents follow written rules far more reliably than
implied conventions. Claude Code reads the file automatically at the
start of every session, and people can read it too. When a decision is
made (for example, "prop values are always lowercase"), it is added to
`CLAUDE.md` so every later change follows it. The scripts above enforce
the parts that can be checked automatically.

## License

[MIT](LICENSE) © Bhushan Prakash
