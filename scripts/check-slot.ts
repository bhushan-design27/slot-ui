/**
 * Checks screens (src/screens/**) against the Slot manifest, the
 * allow-list in manifest/slot.manifest.json. Fails on:
 *
 * - imports of UI components from anywhere except src/components/ui
 *   (allowed besides: react, cn, other files in src/screens, and Storybook
 *   packages in *.stories.tsx);
 * - raw HTML form controls: <button>, <input>, <select>, <textarea>;
 * - inline style attributes;
 * - Slot component props not in the manifest: values outside a prop's
 *   allowedValues (enum props must use literal values so they can be
 *   checked), and unknown prop names on components that don't pass
 *   other props through.
 *
 * Run with: npm run check:slot
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parse } from '@babel/parser'

const ROOT = resolve(import.meta.dirname, '..')
const SCREENS = join(ROOT, 'src/screens')
const UI_DIR = join(ROOT, 'src/components/ui')
const RAW_CONTROLS = new Set(['button', 'input', 'select', 'textarea'])
const STORYBOOK_IMPORT = /^(@storybook\/|storybook(\/|$))/
// Always allowed on any component.
const REACT_PROPS = new Set(['key', 'ref'])

type ManifestProp = { name: string; allowedValues?: unknown[] }
type ManifestComponent = {
  name: string
  props: ManifestProp[]
  inherits?: unknown
  parts?: ManifestComponent[]
}
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest/slot.manifest.json'), 'utf8')) as {
  components: (ManifestComponent & { importPath: string })[]
}
const byName = new Map<string, ManifestComponent>()
for (const c of manifest.components) {
  byName.set(c.name, c)
  for (const p of c.parts ?? []) byName.set(p.name, p)
}

type Node = { type: string; loc?: { start: { line: number } }; [key: string]: unknown }
const problems: string[] = []

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [join(dir, e.name)] : []
  )
}

function walk(node: unknown, visit: (n: Node) => void) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit))
  if (!node || typeof node !== 'object' || !('type' in node)) return
  visit(node as Node)
  for (const [key, value] of Object.entries(node)) {
    if (key !== 'loc' && key !== 'start' && key !== 'end' && typeof value === 'object') walk(value, visit)
  }
}

/** Every string literal in an attribute value (a plain literal, or inside an expression). */
function stringLiterals(value: Node | null): string[] | null {
  if (!value) return []
  if (value.type === 'StringLiteral') return [value.value as string]
  const found: string[] = []
  walk(value, (n) => {
    if (n.type === 'StringLiteral') found.push(n.value as string)
    if (n.type === 'TemplateLiteral' && (n.expressions as unknown[]).length === 0)
      found.push((n.quasis as { value: { cooked: string } }[])[0].value.cooked)
  })
  return found.length ? found : null
}

for (const file of files(SCREENS)) {
  const rel = relative(ROOT, file)
  const isStory = /\.stories\.[jt]sx?$/.test(file)
  const at = (n: Node) => `${rel}:${n.loc?.start.line ?? '?'}`
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] })

  // Local JSX name -> Slot component, from imports of src/components/ui.
  const slot = new Map<string, ManifestComponent>()

  walk(ast.program, (n) => {
    if (n.type === 'ImportDeclaration') {
      const source = (n.source as { value: string }).value
      const resolved = source.startsWith('@/') ? join(ROOT, 'src', source.slice(2)) : source.startsWith('.') ? resolve(file, '..', source) : null
      const fromUi = resolved !== null && resolved.startsWith(UI_DIR + '/')
      const fromScreens = resolved !== null && resolved.startsWith(SCREENS + '/')
      const allowed = fromUi || fromScreens || source === 'react' || source === 'cn' || (isStory && STORYBOOK_IMPORT.test(source))
      if (!allowed) problems.push(`${at(n)}  import from "${source}": screens import UI only from src/components/ui`)
      if (fromUi) {
        for (const s of n.specifiers as { imported?: { name: string }; local: { name: string } }[]) {
          const component = s.imported && byName.get(s.imported.name)
          if (component) slot.set(s.local.name, component)
        }
      }
    }

    if (n.type === 'JSXOpeningElement') {
      const name = (n.name as { type: string; name?: string }).type === 'JSXIdentifier' ? (n.name as { name: string }).name : null
      if (name && RAW_CONTROLS.has(name)) problems.push(`${at(n)}  raw <${name}>: use the Slot component instead`)

      const component = name ? slot.get(name) : undefined
      for (const attr of n.attributes as Node[]) {
        if (attr.type !== 'JSXAttribute') continue
        const prop = (attr.name as { name: string }).name
        if (prop === 'style') problems.push(`${at(attr)}  inline style on <${name ?? 'element'}>: use Slot tokens via classes`)
        if (!component || REACT_PROPS.has(prop)) continue

        const spec = component.props.find((p) => p.name === prop)
        if (!spec) {
          if (!component.inherits) problems.push(`${at(attr)}  <${name}> has no prop "${prop}" in the manifest`)
          continue
        }
        if (!spec.allowedValues) continue
        const values = stringLiterals(attr.value as Node | null)
        if (values === null) {
          problems.push(`${at(attr)}  <${name} ${prop}>: use literal values so they can be checked (${spec.allowedValues.join(' | ')})`)
          continue
        }
        for (const v of values) {
          if (!spec.allowedValues.includes(v))
            problems.push(`${at(attr)}  <${name} ${prop}="${v}">: not in the manifest (${spec.allowedValues.join(' | ')})`)
        }
      }
    }
  })
}

const count = files(SCREENS).length
if (problems.length) {
  console.error(`check:slot found ${problems.length} problem(s) in src/screens (allow-list: manifest/slot.manifest.json):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`check:slot: ${count} screen file(s), only Slot components, props and values.`)
