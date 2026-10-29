/**
 * Fails if source uses colors or radii that don't come from Slot tokens:
 *
 * - literal colors: hex (#3e7ca6), rgb()/rgba(), hsl()/hsla(), and the other
 *   CSS color functions (oklch(), lab(), …)
 * - Tailwind default palette classes (bg-slate-500, text-white, ring-red-600/50, …)
 * - Tailwind radius classes that aren't mapped to Slot (rounded, rounded-xs,
 *   rounded-full, rounded-[6px], …). Use rounded-(--radius-*) instead.
 *
 * Scans src/ and .storybook/. src/styles/tokens.css is generated from
 * Figma (it is where the literal values live), so it is skipped.
 *
 * Run with: npm run check:tokens
 */
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SCAN = ['src', '.storybook']
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mdx'])
const SKIP = new Set(['src/styles/tokens.css'])

const PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose', 'mauve', 'olive', 'mist', 'taupe',
].join('|')
const COLOR_UTILITIES = [
  'bg', 'text', 'border(?:-[xytrblse])?', 'divide', 'outline', 'ring', 'ring-offset',
  'inset-ring', 'inset-shadow', 'shadow', 'drop-shadow', 'text-shadow', 'fill', 'stroke',
  'from', 'via', 'to', 'accent', 'caret', 'decoration', 'placeholder',
].join('|')

// Tailwind radius steps that index.css maps onto Slot radius tokens.
const SLOT_RADIUS_STEPS = new Set(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'])

type Rule = { name: string; pattern: RegExp; allow?: (match: RegExpExecArray) => boolean }

const rules: Rule[] = [
  { name: 'hex color', pattern: /(?<![\w&-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g },
  { name: 'color function', pattern: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g },
  {
    name: 'Tailwind palette class',
    pattern: new RegExp(
      `(?<![\\w-])(?:[\\w-]+:)*(?:${COLOR_UTILITIES})-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?:\\/[\\w.]+)?(?![\\w-])`,
      'g',
    ),
  },
  {
    name: 'non-Slot radius class',
    pattern: /(?<![\w-])(?:[\w-]+:)*rounded(?:-(?:[trblse]|tl|tr|bl|br|ss|se|es|ee))?(?:-(\[[^\]]*\]|\([^)]*\)|[\w.]+))?(?![\w-])/g,
    allow: (m) => {
      const step = m[1]
      if (!step) return false // bare `rounded`
      if (step.startsWith('(')) return /^\(--radius-[\w-]+\)$/.test(step)
      if (step.startsWith('[')) return /^\[var\(--radius-[\w-]+\)\]$/.test(step)
      return SLOT_RADIUS_STEPS.has(step)
    },
  },
]

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (EXTENSIONS.has(extname(entry.name))) yield path
  }
}

const problems: string[] = []
for (const dir of SCAN) {
  for (const file of walk(resolve(ROOT, dir))) {
    const rel = relative(ROOT, file)
    if (SKIP.has(rel)) continue
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const rule of rules) {
          for (const match of line.matchAll(rule.pattern)) {
            if (rule.allow?.(match)) continue
            problems.push(`${rel}:${i + 1}  ${rule.name}: ${match[0]}`)
          }
        }
      })
  }
}

if (problems.length) {
  console.error(`check:tokens found ${problems.length} problem(s). Use Slot CSS variables (src/styles/tokens.css):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log('check:tokens: no literal colors or non-Slot color/radius classes.')
