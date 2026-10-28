/**
 * Generates src/styles/tokens.css from tokens/slot.tokens.json (DTCG).
 *
 * - CSS variable names come from each token's Figma code syntax (WEB),
 *   e.g. "var(--color-text-primary)" -> --color-text-primary.
 *   Tokens without code syntax fall back to the same convention: path
 *   segments joined with "-" (color/border/subtle -> --color-border-subtle).
 * - Aliases stay aliases: a semantic token becomes var(--<primitive>).
 *
 * Run with: npm run tokens
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { aliasTarget, flattenTokens, type ColorValue, type FlatToken, type Token } from '../src/lib/tokens.ts'

const ROOT = resolve(import.meta.dirname, '..')
const INPUT = resolve(ROOT, 'tokens/slot.tokens.json')
const OUTPUT = resolve(ROOT, 'src/styles/tokens.css')

function formatColor({ components, alpha, hex }: ColorValue): string {
  if (alpha >= 1) return hex
  const [r, g, b] = components.map((c) => Math.round(c * 255))
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 1000) / 1000})`
}

function formatValue(token: Token, byPath: Map<string, FlatToken>): string {
  const value = token.$value
  const alias = aliasTarget(value)
  if (alias) {
    const target = byPath.get(alias)
    if (!target) throw new Error(`Unresolved alias {${alias}}`)
    return `var(${target.cssName})`
  }
  if (typeof value === 'string') return token.$type === 'fontFamily' ? `"${value}"` : value
  if ('colorSpace' in value) return formatColor(value)
  return `${value.value}${value.unit}`
}

const tokens = flattenTokens(JSON.parse(readFileSync(INPUT, 'utf8')) as object)
const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]))

const seen = new Map<string, string>()
for (const t of tokens) {
  const prev = seen.get(t.cssName)
  if (prev) throw new Error(`Duplicate CSS variable ${t.cssName} (${prev} and ${t.path.join('/')})`)
  seen.set(t.cssName, t.path.join('/'))
}

const collections = [...new Set(tokens.map((t) => t.collection))]
const blocks = collections.map((collection) => {
  const lines = tokens
    .filter((t) => t.collection === collection)
    .map((t) => `  ${t.cssName}: ${formatValue(t.token, byPath)};`)
  return `  /* ${collection} */\n${lines.join('\n')}`
})

const css = `/*
 * Slot design tokens — GENERATED FILE, do not edit by hand.
 * Source: tokens/slot.tokens.json (exported from Figma). Regenerate: npm run tokens
 */
:root {
${blocks.join('\n\n')}
}
`

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, css)

const derived = tokens.filter((t) => t.derived)
console.log(`Wrote ${tokens.length} CSS variables to ${OUTPUT.replace(ROOT + '/', '')}`)
if (derived.length) {
  console.warn(`\n${derived.length} token(s) have no WEB code syntax in Figma; names derived from the path:`)
  for (const t of derived) console.warn(`  ${t.path.join('/')} -> ${t.cssName}`)
}
