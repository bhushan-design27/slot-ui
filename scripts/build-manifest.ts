/**
 * Generates manifest/slot.manifest.json and registry.json from the code.
 *
 * The manifest is the allow-list an AI agent builds screens from:
 * components (props, allowed values and defaults from the TypeScript
 * types, Figma states, accessibility notes, usage guidance), semantic
 * tokens and the screen-building rules from CLAUDE.md.
 *
 * Sources, in order of authority:
 * - src/components/ui/*.tsx: props via react-docgen; the JSDoc block on
 *   each component holds its summary, @figma node, @states and @a11y notes.
 * - tokens/slot.tokens.json and src/styles/tokens.css: tokens.
 * - CLAUDE.md: rules, copied verbatim from the sections in RULE_SECTIONS.
 * - manifest/usage.md: purpose / use when / don't use when, with a review
 *   status per component.
 *
 * Output is deterministic (no timestamps), so CI can fail when it is stale.
 * Run with: npm run manifest
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { builtinResolvers, parse, type Documentation } from 'react-docgen'
import { aliasTarget, flattenTokens, type FlatToken } from '../src/lib/tokens.ts'

const ROOT = resolve(import.meta.dirname, '..')
const COMPONENT_DIR = 'src/components/ui'
const MANIFEST = 'manifest/slot.manifest.json'
const USAGE = 'manifest/usage.md'
const REGISTRY = 'registry.json'

const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8')
const pkg = JSON.parse(read('package.json')) as { version: string; homepage: string }
const REGISTRY_URL = new URL('r/', pkg.homepage).href

/** CLAUDE.md sections that apply to building screens. A missing heading fails the build. */
const RULE_SECTIONS = [
  'Text styles',
  'UI copy',
  'Borders and sizing',
  'Only Slot CSS variables',
  'Props mirror Figma',
  'Figma states → code',
  'Dialogs',
]

/** Figma state → code, as defined in CLAUDE.md "Figma states → code". An unknown state fails the build. */
const STATE_TO_CODE: Record<string, string> = {
  Default: 'Default rendering, no prop',
  Hover: 'CSS :hover, not a prop',
  Focus: 'CSS :focus-visible, not a prop',
  Disabled: 'Native `disabled` attribute',
  Error: '`invalid` prop, rendered as aria-invalid',
  Selected: '`selected` prop',
  Open: '`open` prop',
}

const fail = (message: string): never => {
  throw new Error(`manifest: ${message}`)
}

const pascal = (file: string) => file.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())

// ---------------------------------------------------------------------------
// Components

type JsDoc = { summary: string; tags: Record<string, string[]> }

/** JSDoc blocks directly above `function Name(`, keyed by Name. */
function jsDocs(source: string): Map<string, JsDoc> {
  const docs = new Map<string, JsDoc>()
  for (const [, body, name] of source.matchAll(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*function (\w+)\(/g)) {
    const lines = body.split('\n').map((l) => l.replace(/^\s*\* ?/, '').trimEnd())
    const summary: string[] = []
    const tags: Record<string, string[]> = {}
    let current: string[] | null = null
    for (const line of lines) {
      const tag = line.match(/^@(\w+)\s*(.*)$/)
      if (tag) {
        current = tags[tag[1]] ??= []
        current.push(tag[2])
      } else if (current && line.trim()) {
        current[current.length - 1] += ` ${line.trim()}`
      } else if (!current && line.trim()) {
        summary.push(line.trim())
      }
    }
    docs.set(name, { summary: summary.join(' '), tags })
  }
  return docs
}

const literal = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** `keyof typeof obj` → the keys of `const obj = { … }` in the same file. */
function keysOfTypeofAlias(source: string, propsType: string, prop: string): string[] {
  const member = source.match(new RegExp(`type ${propsType}[\\s\\S]*?\\n\\s+${prop}\\??: (\\w+)`))?.[1]
  const object = member && source.match(new RegExp(`type ${member} = keyof typeof (\\w+)`))?.[1]
  const body = object && source.match(new RegExp(`const ${object} = \\{([\\s\\S]*?)\\n\\}`))?.[1]
  if (!body) return fail(`can't resolve the type of ${propsType}.${prop}`)
  return [...body.matchAll(/^\s*"?([\w-]+)"?:/gm)].map((m) => m[1])
}

type Prop = {
  name: string
  type: string
  allowedValues?: unknown[]
  required: boolean
  default?: unknown
  description?: string
}

function props(doc: Documentation, source: string, propsType: string): Prop[] {
  return Object.entries(doc.props ?? {})
    .map(([name, p]) => {
      const ts = p.tsType as { name: string; raw?: string; elements?: { name: string; value?: string }[] } | undefined
      // No tsType: a native attribute not declared in the props type, listed because Slot gives it a default.
      const prop: Prop = { name, type: ts?.raw ?? ts?.name ?? 'inherited (native attribute)', required: p.required ?? false }
      if (ts?.name === 'union' && ts.elements?.every((e) => e.name === 'literal')) {
        prop.allowedValues = ts.elements.map((e) => literal(e.value!))
      } else if (ts?.name === 'unknown') {
        prop.allowedValues = keysOfTypeofAlias(source, propsType, name)
        prop.type = prop.allowedValues.map((v) => JSON.stringify(v)).join(' | ')
      }
      if (p.defaultValue) prop.default = literal(String(p.defaultValue.value))
      if (p.description) prop.description = p.description
      return prop
    })
    .sort((a, b) => Number(b.required) - Number(a.required))
}

/** `type XProps = Omit<React.ComponentProps<…>, "a" | "b"> & {` → what passes through to the rendered element. */
function inherits(source: string, propsType: string) {
  const head = source.match(new RegExp(`type ${propsType} = ([\\s\\S]*?)\\{\\n`))?.[1] ?? ''
  const element = head.match(/ComponentProps<"(\w+)">/)?.[1]
  const primitive = head.match(/ComponentProps<typeof (\w+)\.(\w+)>/)
  if (!element && !primitive) return undefined
  const omitted = [...(head.match(/,\s*((?:"\w+"\s*\|?\s*)+)>/)?.[1].matchAll(/"(\w+)"/g) ?? [])].map((m) => m[1])
  return {
    from: element ? `<${element}>` : `Radix ${primitive![1].replace(/Primitive$/, '')}.${primitive![2]}`,
    note: 'Other props pass through to the rendered element (e.g. aria-*, onClick, className).',
    ...(omitted.length ? { omitted } : {}),
  }
}

type Usage = { status: string; purpose: string; useWhen: string[]; dontUseWhen: string[] }

function parseUsage(markdown: string): Map<string, Usage> {
  const usage = new Map<string, Usage>()
  for (const block of markdown.split(/^## /m).slice(1)) {
    const [heading, ...rest] = block.split('\n')
    const name = heading.trim()
    const body = rest.join('\n')
    const status = body.match(/^Status: (.+)$/m)?.[1].trim() ?? fail(`usage.md: ${name} has no "Status:" line`)
    const section = (title: string) =>
      body.match(new RegExp(`^### ${title}\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, 'm'))?.[1].trim() ??
      fail(`usage.md: ${name} has no "### ${title}" section`)
    const bullets = (text: string) => text.split(/\n(?=- )/).map((b) => b.replace(/^- /, '').replace(/\s*\n\s*/g, ' ').trim())
    usage.set(name, {
      status,
      purpose: section('Purpose').replace(/\s*\n\s*/g, ' '),
      useWhen: bullets(section('Use when')),
      dontUseWhen: bullets(section("Don't use when")),
    })
  }
  return usage
}

const resolver = new builtinResolvers.FindExportedDefinitionsResolver()
const usage = parseUsage(read(USAGE))
const componentFiles = readdirSync(resolve(ROOT, COMPONENT_DIR))
  .filter((f) => f.endsWith('.tsx') && !f.endsWith('.stories.tsx'))
  .sort()

type ComponentEntry = ReturnType<typeof describeComponent>

function describeComponent(file: string) {
  const path = `${COMPONENT_DIR}/${file}`
  const source = read(path)
  const slug = basename(file, '.tsx')
  const name = pascal(slug)
  const docs = parse(source, { filename: path, resolver })
  const comments = jsDocs(source)

  const describe = (doc: Documentation, required: boolean) => {
    const componentName = doc.displayName ?? fail(`${path}: unnamed component`)
    const jsDoc = comments.get(componentName) ?? fail(`${path}: ${componentName} has no JSDoc block`)
    const figma = jsDoc.tags.figma?.[0]?.match(/^(.+) (\d+:\d+)$/)
    if (required && !figma) fail(`${path}: ${componentName} needs "@figma <Name> <node-id>"`)
    const propsType = source.match(new RegExp(`function ${componentName}\\([\\s\\S]*?\\}: (\\w+)\\)`))?.[1]
    return {
      name: componentName,
      description: jsDoc.summary,
      ...(figma ? { figma: { component: figma[1], nodeId: figma[2] } } : {}),
      props: propsType ? props(doc, source, propsType) : [],
      ...(propsType && inherits(source, propsType) ? { inherits: inherits(source, propsType) } : {}),
      states: (jsDoc.tags.states?.[0]?.split(/,\s*/) ?? []).map((state) => ({
        figma: state,
        code: STATE_TO_CODE[state] ?? fail(`${path}: unknown Figma state "${state}" (add it to STATE_TO_CODE)`),
      })),
      accessibility: jsDoc.tags.a11y ?? [],
    }
  }

  const main = docs.find((d) => d.displayName === name) ?? fail(`${path}: no exported component named ${name}`)
  const parts = docs.filter((d) => d !== main && d.displayName)
  const entry = usage.get(name) ?? fail(`usage.md: no "## ${name}" entry`)
  const exported = source.match(/^export \{([^}]*)\}/m)?.[1].split(',').map((s) => s.trim()).filter((s) => !s.startsWith('type ')) ?? []

  return {
    ...describe(main, true),
    importPath: `@/components/ui/${slug}`,
    exports: exported,
    ...(parts.length ? { parts: parts.map((p) => describe(p, false)) } : {}),
    usage: entry,
    source: path,
    slug,
  }
}

const components: ComponentEntry[] = componentFiles.map(describeComponent)
for (const name of usage.keys()) {
  if (!components.some((c) => c.name === name)) fail(`usage.md: "## ${name}" has no component in ${COMPONENT_DIR}`)
}

// ---------------------------------------------------------------------------
// Tokens

const tokens = flattenTokens(JSON.parse(read('tokens/slot.tokens.json')))
const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]))
const componentSources = components.map((c) => [c.name, read(c.source)] as const)

const SCOPE_KIND: Record<string, string> = {
  TEXT_FILL: 'Text colour',
  FRAME_FILL: 'Background fill',
  SHAPE_FILL: 'Background fill',
  STROKE_COLOR: 'Border colour',
  EFFECT_COLOR: 'Shadow colour',
}

/** Written job = the token's $description (Figma variable description). Fallback: derived from scopes + path. */
function job(token: FlatToken) {
  if (token.token.$description) return { job: token.token.$description, jobSource: 'figma-description' }
  const scopes = token.token.$extensions?.['com.figma']?.scopes ?? []
  const kind = token.path[1] === 'icon' ? 'Icon colour' : (SCOPE_KIND[scopes[0]] ?? 'Value')
  return { job: `${kind}: ${token.path.slice(1).join(' / ')}`, jobSource: 'derived from scopes and name' }
}

function resolvePrimitive(token: FlatToken): FlatToken {
  const alias = aliasTarget(token.token.$value)
  if (!alias) return token
  return resolvePrimitive(byPath.get(alias) ?? fail(`token ${token.path.join('/')} aliases missing ${alias}`))
}

const usedBy = (cssName: string) => {
  const pattern = new RegExp(`${cssName}(?![\\w-])`)
  return componentSources.filter(([, src]) => pattern.test(src)).map(([name]) => name)
}

const displayValue = (t: FlatToken) => {
  const v = t.token.$value
  if (typeof v === 'string') return v
  return 'hex' in v ? (v.alpha < 1 ? `${v.hex} @ ${v.alpha}` : v.hex) : `${v.value}${v.unit}`
}

const semantic = tokens
  .filter((t) => t.collection === 'Semantic')
  .map((t) => {
    const primitive = resolvePrimitive(t)
    return {
      name: t.path.join('/'),
      cssVariable: t.cssName,
      ...job(t),
      scopes: t.token.$extensions?.['com.figma']?.scopes ?? [],
      aliasOf: primitive.path.join('/'),
      value: displayValue(primitive),
      usedBy: usedBy(t.cssName),
    }
  })

// Colour primitives are deliberately left out: components and screens use semantic colours only.
const scales = tokens
  .filter((t) => t.collection === 'Primitives' && t.token.$type !== 'color')
  .map((t) => ({
    name: t.path.join('/'),
    cssVariable: t.cssName,
    value: displayValue(t),
    scopes: t.token.$extensions?.['com.figma']?.scopes ?? [],
  }))

// ---------------------------------------------------------------------------
// Rules from CLAUDE.md

function claudeSections(markdown: string): Map<string, string[]> {
  const sections = new Map<string, string[]>()
  for (const block of markdown.split(/^#{2,3} /m).slice(1)) {
    const [heading, ...rest] = block.split('\n')
    const bullets = rest
      .join('\n')
      .split(/\n(?=- )/)
      .filter((b) => b.trimStart().startsWith('- '))
      .map((b) => b.trim().replace(/^- /, '').replace(/\s*\n\s*/g, ' '))
    sections.set(heading.trim(), bullets)
  }
  return sections
}

const claude = claudeSections(read('CLAUDE.md'))
const rules = RULE_SECTIONS.map((section) => ({
  section,
  rules: claude.get(section) ?? fail(`CLAUDE.md has no "${section}" section`),
}))

// ---------------------------------------------------------------------------
// Write

const manifest = {
  $comment: 'Generated by `npm run manifest`. Do not edit by hand: change the code, tokens, CLAUDE.md or manifest/usage.md.',
  name: 'Slot',
  version: pkg.version,
  description:
    'The allow-list for building with Slot: use only the components, props, values and tokens listed here, and follow the rules.',
  links: { storybook: pkg.homepage, registry: `${REGISTRY_URL}registry.json` },
  components: components.map(({ source, slug, ...c }) => ({ ...c, registryItem: `${REGISTRY_URL}${slug}.json` })),
  tokens: {
    semantic,
    scales,
    note: 'Colours: semantic tokens only (colour primitives are not for direct use). Spacing, radius, type and borders: the scales.',
  },
  rules,
}

// Registry: each component, plus a theme item carrying the Slot CSS variables.
const cssVars = (css: string, selector: string) => {
  const block = css.match(new RegExp(`${selector} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? fail(`no ${selector} block`)
  return Object.fromEntries([...block.matchAll(/^\s*--([\w-]+):\s*(.+?);/gm)].map((m) => [m[1], m[2]]))
}

const imports = (source: string) => [...source.matchAll(/^import .* from "([^"]+)"/gm)].map((m) => m[1])

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'slot',
  homepage: pkg.homepage,
  items: [
    {
      name: 'slot-tokens',
      type: 'registry:theme',
      title: 'Slot tokens',
      description: 'Slot design tokens as CSS variables, with the shadcn/ui theme variables mapped onto them.',
      cssVars: { light: { ...cssVars(read('src/styles/tokens.css'), ':root'), ...cssVars(read('src/index.css'), ':root') } },
    },
    ...components.map((c) => {
      const source = read(c.source)
      const deps = imports(source).filter((i) => !i.startsWith('@/') && !i.startsWith('.') && i !== 'react')
      const local = imports(source).filter((i) => i.startsWith('@/components/ui/')).map((i) => i.split('/').pop())
      return {
        name: c.slug,
        type: 'registry:ui',
        title: c.name,
        description: c.description,
        dependencies: deps,
        registryDependencies: [`${REGISTRY_URL}slot-tokens.json`, ...local.map((l) => `${REGISTRY_URL}${l}.json`)],
        files: [{ path: c.source, type: 'registry:ui' }],
      }
    }),
  ],
}

const write = (path: string, data: unknown) => {
  mkdirSync(dirname(resolve(ROOT, path)), { recursive: true })
  writeFileSync(resolve(ROOT, path), `${JSON.stringify(data, null, 2)}\n`)
}
write(MANIFEST, manifest)
write(REGISTRY, registry)

const drafts = components.filter((c) => c.usage.status !== 'Approved').map((c) => c.name)
const derivedJobs = semantic.filter((t) => t.jobSource !== 'figma-description').length
console.log(`manifest: ${components.length} components, ${semantic.length} semantic tokens, ${scales.length} scale tokens, ${rules.length} rule sections`)
console.log(`  wrote ${MANIFEST} and ${REGISTRY}`)
if (drafts.length) console.log(`  usage not approved yet: ${drafts.join(', ')}`)
if (derivedJobs) console.log(`  ${derivedJobs} semantic tokens have no Figma description; their job is derived from scopes and name`)
