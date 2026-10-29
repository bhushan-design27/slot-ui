# slot-ui

Code version of the **Slot** design system
([Figma](https://www.figma.com/design/kcQ8UEPlSVCNw8Qs2LL6aZ/Slot)).

Vite + React + TypeScript · Tailwind CSS v4 · shadcn/ui · Storybook

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run storybook` | Storybook on http://localhost:6006 |
| `npm run tokens` | Regenerate `src/styles/tokens.css` from `tokens/slot.tokens.json` |
| `npm run check:tokens` | Fail on literal colors and non-Slot Tailwind color/radius classes |
| `npm run build` | Type-check and build |
| `npm run lint` | oxlint |

## Tokens

`tokens/slot.tokens.json` (W3C DTCG) holds the Figma **Primitives** and
**Semantic** collections; semantic tokens are aliases of primitives.
`npm run tokens` turns it into CSS variables named after the Figma code
syntax (`--color-text-primary`, `--space-4`, …). `src/index.css` maps the
shadcn/ui theme variables onto those Slot tokens.

See `CLAUDE.md` for the rules.
