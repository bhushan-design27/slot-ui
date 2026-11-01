/**
 * Scores every eval run in eval/results/runs.json (protocol.md, "Scoring").
 *
 *   npm run eval:score [-- --only run-abc123] [-- --no-screens]
 *
 * Everything is checked with this repo's scripts and B's manifest
 * (manifest/slot.manifest.json), never with the copy inside the run.
 * Per run it counts, against the manifest: invented components, props,
 * values, tokens and icons; check:tokens violations; TypeScript errors;
 * and axe violations. It screenshots the home page (and new stories) at
 * 390 and 1440 into eval/results/judge/<task>/<label>-<n>-<width>.png,
 * with labels X / Y assigned at random per task (key: judge-key.json).
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { homedir, tmpdir } from 'node:os'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { parse } from '@babel/parser'
import { chromium, type Browser } from 'playwright'
import type { Run } from './lib.ts'

const ROOT = resolve(import.meta.dirname, '..')
const RESULTS = join(ROOT, 'eval/results')
const AXE = join(ROOT, 'node_modules/axe-core/axe.min.js')
const WIDTHS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
// Rules about the host HTML page (Vite's index.html vs Storybook's iframe), not the screen.
const AXE_HOST_RULES = ['document-title', 'html-has-lang', 'html-lang-valid']

const { values: opts } = parseArgs({
  options: {
    runs: { type: 'string', default: join(RESULTS, 'runs.json') },
    only: { type: 'string', multiple: true },
    'no-screens': { type: 'boolean', default: false },
  },
})

// ---------------------------------------------------------------- manifest

type ManifestProp = { name: string; allowedValues?: string[] }
type ManifestComponent = { name: string; importPath?: string; props: ManifestProp[]; inherits?: unknown; parts?: ManifestComponent[] }
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest/slot.manifest.json'), 'utf8')) as {
  components: (ManifestComponent & { importPath: string })[]
  tokens: { semantic: { cssVariable: string }[]; scales: { cssVariable: string }[] }
}
/** Slot component name -> spec and the ui file stem it's exported from. */
const SLOT = new Map<string, { spec: ManifestComponent; stem: string }>()
for (const c of manifest.components) {
  const stem = c.importPath.split('/').pop()!
  SLOT.set(c.name, { spec: c, stem })
  for (const p of c.parts ?? []) SLOT.set(p.name, { spec: p, stem })
}
const MANIFEST_VARS = new Set([...manifest.tokens.semantic, ...manifest.tokens.scales].map((t) => t.cssVariable))

// Props that pass through to the underlying element on components with `inherits`.
const HTML_ATTRS = new Set(
  ('className id type name value defaultValue checked defaultChecked disabled href target rel title role tabIndex ' +
    'form autoFocus autoComplete placeholder required readOnly min max step pattern maxLength minLength htmlFor ' +
    'children asChild hidden lang dir inputMode multiple accept alt src width height download rows cols wrap ' +
    'spellCheck enterKeyHint formAction formMethod formNoValidate key ref').split(' ')
)
const passesThrough = (prop: string) => /^(aria|data)-/.test(prop) || /^on[A-Z]/.test(prop) || HTML_ATTRS.has(prop)

const RAW_CONTROLS = new Set(['button', 'input', 'select', 'textarea'])
// Non-UI modules a screen may import without that counting as a component.
const NON_UI_MODULES = new Set(['react', 'react-dom', 'cn', 'clsx', 'tailwind-merge', 'class-variance-authority'])

// ---------------------------------------------------------------- helpers

type Node = { type: string; loc?: { start: { line: number } }; [key: string]: unknown }
function walk(node: unknown, visit: (n: Node) => void) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit))
  if (!node || typeof node !== 'object' || !('type' in node)) return
  visit(node as Node)
  for (const [key, value] of Object.entries(node)) {
    if (key !== 'loc' && key !== 'start' && key !== 'end' && typeof value === 'object') walk(value, visit)
  }
}
const run = (cwd: string, cmd: string, args: string[], env: NodeJS.ProcessEnv = {}) =>
  spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 })
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const kebab = (s: string) => s.replace(/Icon$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const isPascal = (s: string) => /^[A-Z]/.test(s)

/** Variables defined (`--x: …`) in a CSS text. */
const definedVars = (css: string) => new Set([...css.matchAll(/(?:^|[\s{;'"])(--[\w-]+)['"]?\s*:/gm)].map((m) => m[1]))

class Tally {
  items = new Map<string, string[]>()
  add(key: string, where: string) {
    const list = this.items.get(key) ?? []
    if (!list.includes(where)) list.push(where)
    this.items.set(key, list)
  }
  get count() { return this.items.size }
  toJSON() { return { count: this.count, items: Object.fromEntries(this.items) } }
}

// ---------------------------------------------------------------- one run

type Score = ReturnType<typeof emptyScore>
function emptyScore() {
  return {
    inventedComponents: new Tally(),
    inventedProps: new Tally(),
    inventedValues: new Tally(),
    uncheckedValues: new Tally(),
    hardCodedValues: new Tally(),
    inventedTokens: { primitive: new Tally(), theme: new Tally(), new: new Tally() },
    inventedIcons: new Tally(),
    localComponents: new Tally(),
    modifiedSlotFiles: new Tally(),
    modifiedTokens: new Tally(),
    checkTokens: { violations: 0, lines: [] as string[] },
    typescript: { errors: 0, lines: [] as string[] },
    a11y: { violations: 0, byRule: {} as Record<string, number>, items: [] as string[], targets: [] as string[] },
    render: { home: false, stories: [] as string[], blank: [] as string[], errors: [] as string[] },
    transcript: { found: false, askUserQuestionCalls: 0, outsidePaths: [] as string[] },
    changedFiles: [] as string[],
  }
}

function changedFiles(r: Run): string[] {
  const tracked = git(r.dir, 'diff', '--name-only', r.base).split('\n')
  const untracked = git(r.dir, 'ls-files', '--others', '--exclude-standard').split('\n')
  return [...new Set([...tracked, ...untracked])].filter((f) => f && existsSync(join(r.dir, f))).sort()
}

const existedAtBase = (r: Run, file: string) => run(r.dir, 'git', ['cat-file', '-e', `${r.base}:${file}`]).status === 0

/** Lines the run added to a file (all lines, for a new file). */
function addedLines(r: Run, file: string): { line: number; text: string }[] {
  if (!existedAtBase(r, file)) return readFileSync(join(r.dir, file), 'utf8').split('\n').map((text, i) => ({ line: i + 1, text }))
  const out: { line: number; text: string }[] = []
  let line = 0
  for (const l of git(r.dir, 'diff', '-U0', r.base, '--', file).split('\n')) {
    const hunk = /^@@ -\S+ \+(\d+)/.exec(l)
    if (hunk) line = Number(hunk[1])
    else if (l.startsWith('+') && !l.startsWith('+++')) out.push({ line: line++, text: l.slice(1) })
  }
  return out
}

function resolveModule(r: Run, from: string, source: string): string | null {
  const base = source.startsWith('@/') ? join(r.dir, 'src', source.slice(2)) : source.startsWith('.') ? resolve(dirname(from), source) : null
  if (!base) return null
  for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) if (existsSync(base + ext) && extname(base + ext)) return base + ext
  return base
}

const HARD_CODED = [
  { name: 'arbitrary value', re: /(?<![\w-])(?:[\w-]+:)*-?[a-z][\w-]*-\[(?!var\()[^\]\s]+\]/g },
  {
    name: 'default spacing/size class',
    re: /(?<![\w/-])(?:[\w-]+:)*-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|w|h|min-[wh]|max-[wh]|size|inset(?:-[xy])?|top|left|right|bottom|translate-[xy])-(?!0(?![\d.]))(?:\d+(?:\.\d+)?|px)(?![\w/-])/g,
  },
  { name: 'default type class', re: /(?<![\w-])(?:[\w-]+:)*(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|leading-(?:\d+|tight|snug|normal|relaxed|loose))(?![\w-])/g },
  { name: 'default max-width class', re: /(?<![\w-])(?:[\w-]+:)*max-w-(?:xs|sm|md|lg|xl|[2-7]xl|prose|screen-\w+)(?![\w-])/g },
  { name: 'inline style', re: /\bstyle=\{/g },
  { name: 'CSS literal length', re: /:\s*(?![^;]*var\()[^;{}]*\b\d*\.?\d+(?:px|rem|em)\b/g, cssOnly: true },
]

function analyse(r: Run, files: string[], s: Score, baseTokensCss: Set<string>, baseIndexCss: Set<string>) {
  const code = files.filter((f) => /\.(tsx?|css|mdx)$/.test(f) && (f.startsWith('src/') || f.startsWith('.storybook/')))

  // Slot component files the run changed or added.
  for (const f of code.filter((f) => f.startsWith('src/components/ui/') && !/\.stories\./.test(f) && /\.tsx?$/.test(f))) {
    if (existedAtBase(r, f)) s.modifiedSlotFiles.add(f, f)
    else {
      const ast = parse(readFileSync(join(r.dir, f), 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] })
      walk(ast.program, (n) => {
        if (n.type !== 'ExportNamedDeclaration') return
        const decl = n.declaration as Node | null
        const names = decl?.type === 'FunctionDeclaration' ? [(decl.id as { name: string }).name]
          : decl?.type === 'VariableDeclaration' ? (decl.declarations as { id: { name?: string } }[]).map((d) => d.id.name ?? '')
          : ((n.specifiers as { exported: { name: string } }[]) ?? []).map((x) => x.exported.name)
        for (const name of names.filter(isPascal)) s.inventedComponents.add(`${name} (new in ${f})`, f)
      })
    }
  }

  // JSX in screens and other app code (not the Slot components themselves, not stories).
  for (const f of code.filter((f) => /\.tsx?$/.test(f) && !/\.(stories|test)\./.test(f) && !f.startsWith('src/components/ui/'))) {
    const abs = join(r.dir, f)
    const ast = parse(readFileSync(abs, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    const at = (n: Node) => `${f}:${n.loc?.start.line ?? '?'}`
    const screenName = f.split('/').pop()!.replace(/\.tsx?$/, '')
    type Origin = { kind: 'slot'; name: string } | { kind: 'ui-new'; key: string } | { kind: 'package'; source: string } | { kind: 'local'; source: string } | { kind: 'ok' }
    const origins = new Map<string, Origin>()

    walk(ast.program, (n) => {
      if (n.type === 'ImportDeclaration') {
        const source = (n.source as { value: string }).value
        const resolved = resolveModule(r, abs, source)
        const uiFile = resolved && resolved.startsWith(join(r.dir, 'src/components/ui') + '/') ? relative(r.dir, resolved) : null
        for (const sp of n.specifiers as { type: string; imported?: { name: string }; local: { name: string } }[]) {
          const imported = sp.imported?.name ?? sp.local.name
          const local = sp.local.name
          if (source === 'lucide-react' || source.startsWith('lucide-react/')) {
            if (isPascal(imported)) s.inventedIcons.add(`${kebab(imported)} (lucide-react, bypasses Icon)`, at(n))
            origins.set(local, { kind: 'ok' })
          } else if (uiFile) {
            const slot = SLOT.get(imported)
            const stem = uiFile.replace(/^src\/components\/ui\//, '').replace(/\.tsx?$/, '')
            if (slot && slot.stem === stem) origins.set(local, { kind: 'slot', name: imported })
            else origins.set(local, { kind: 'ui-new', key: `${imported} (new in ${uiFile})` })
          } else if (resolved) origins.set(local, { kind: 'local', source: relative(r.dir, resolved) })
          else if (NON_UI_MODULES.has(source) || source.startsWith('@/lib/')) origins.set(local, { kind: 'ok' })
          else origins.set(local, { kind: 'package', source })
        }
      }
      // Locally declared components (composites): listed for review, not counted. The
      // screen itself (named after its file, e.g. App in App.tsx) isn't listed.
      const declared = n.type === 'FunctionDeclaration' ? (n.id as { name?: string } | null)?.name
        : n.type === 'VariableDeclarator' && /Function|Call/.test((n.init as Node | null)?.type ?? '') ? (n.id as { name?: string }).name
        : undefined
      if (declared && isPascal(declared) && declared !== screenName) s.localComponents.add(declared, at(n))
    })

    walk(ast.program, (n) => {
      if (n.type !== 'JSXOpeningElement') return
      const nameNode = n.name as Node
      const root = nameNode.type === 'JSXIdentifier' ? (nameNode.name as string)
        : nameNode.type === 'JSXMemberExpression' ? (() => { let o = nameNode; while (o.type === 'JSXMemberExpression') o = o.object as Node; return o.name as string })()
        : null
      if (!root) return
      if (!isPascal(root)) {
        if (RAW_CONTROLS.has(root)) s.inventedComponents.add(`raw <${root}>`, at(n))
        if (root === 'svg') s.inventedIcons.add('inline <svg>', at(n))
        return
      }
      const origin = origins.get(root)
      if (!origin) return // declared in this file (a local composite)
      if (origin.kind === 'ui-new') return s.inventedComponents.add(origin.key, at(n))
      if (origin.kind === 'package') return s.inventedComponents.add(`${root} (${origin.source})`, at(n))
      if (origin.kind !== 'slot' || nameNode.type !== 'JSXIdentifier') return

      const { spec } = SLOT.get(origin.name)!
      for (const attr of n.attributes as Node[]) {
        if (attr.type !== 'JSXAttribute') continue
        const prop = (attr.name as { name: string }).name
        if (prop === 'key' || prop === 'ref') continue
        const p = spec.props.find((x) => x.name === prop)
        if (!p) {
          if (!spec.inherits || !passesThrough(prop)) s.inventedProps.add(`${origin.name}.${prop}`, at(attr))
          continue
        }
        if (!p.allowedValues) continue
        const value = attr.value as Node | null
        const literals: string[] = []
        if (value?.type === 'StringLiteral') literals.push(value.value as string)
        else walk(value, (v) => { if (v.type === 'StringLiteral') literals.push(v.value as string) })
        if (!literals.length) { s.uncheckedValues.add(`${origin.name}.${prop}`, at(attr)); continue }
        for (const v of literals) {
          if (p.allowedValues.includes(v)) continue
          if (origin.name === 'Icon' && prop === 'name') s.inventedIcons.add(v, at(attr))
          else s.inventedValues.add(`${origin.name}.${prop}="${v}"`, at(attr))
        }
      }
    })
  }

  // Tokens and hard-coded values, from the lines the run added.
  for (const f of code) {
    const isCss = f.endsWith('.css')
    const isTokensCss = f === 'src/styles/tokens.css'
    for (const { line, text } of addedLines(r, f)) {
      const where = `${f}:${line}`
      if (!isTokensCss) {
        for (const m of text.matchAll(/var\(\s*(--[\w-]+)|\((?:[a-z-]+:)?(--[\w-]+)\)/g)) {
          const v = m[1] ?? m[2]
          if (MANIFEST_VARS.has(v) || v.startsWith('--tw-')) continue
          ;(baseTokensCss.has(v) ? s.inventedTokens.primitive : baseIndexCss.has(v) ? s.inventedTokens.theme : s.inventedTokens.new).add(v, where)
        }
      }
      if (isCss) {
        for (const v of definedVars(text)) {
          if (baseTokensCss.has(v) || baseIndexCss.has(v)) s.modifiedTokens.add(v, where)
          else if (!MANIFEST_VARS.has(v)) s.inventedTokens.new.add(v, where)
        }
      }
      if (isTokensCss || /\.stories\./.test(f)) continue
      for (const rule of HARD_CODED) {
        if (rule.cssOnly && !isCss) continue
        for (const m of text.matchAll(rule.re)) s.hardCodedValues.add(`${rule.name}: ${m[0].trim()}`, where)
      }
    }
  }
}

// ---------------------------------------------------------------- render

function serve(dir: string, spa: boolean): Promise<{ server: Server; url: string }> {
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' }
  const server = createServer((req, res) => {
    let path = join(dir, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname))
    if (!path.startsWith(dir)) { res.statusCode = 403; return res.end() }
    if (existsSync(path) && !extname(path)) path = join(path, 'index.html')
    if (!existsSync(path) && spa) path = join(dir, 'index.html')
    if (!existsSync(path)) { res.statusCode = 404; return res.end() }
    res.setHeader('content-type', types[extname(path)] ?? 'application/octet-stream')
    res.end(readFileSync(path))
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${(server.address() as { port: number }).port}` })))
}

type Shot = { target: string; images: Buffer[] }

async function render(r: Run, files: string[], s: Score, browser: Browser): Promise<Shot[]> {
  const tmp = join(tmpdir(), `slot-eval-score-${r.id}`)
  rmSync(tmp, { recursive: true, force: true })
  const targets: { name: string; url: () => Promise<{ url: string; close: () => void }>; ready: string }[] = []

  if (files.some((f) => ['src/App.tsx', 'src/main.tsx', 'index.html'].includes(f))) {
    const b = run(r.dir, 'npx', ['vite', 'build', '--outDir', join(tmp, 'app'), '--emptyOutDir', '--logLevel', 'error'])
    if (b.status !== 0) s.render.errors.push(`vite build failed: ${(b.stderr || b.stdout).trim().split('\n').slice(-5).join(' / ')}`)
    else targets.push({ name: 'home', ready: '#root > *', url: async () => { const { server, url } = await serve(join(tmp, 'app'), true); return { url: `${url}/`, close: () => server.close() } } })
  }

  const storyFiles = files.filter((f) => /\.stories\.tsx?$/.test(f))
  if (storyFiles.length) {
    const b = run(r.dir, 'npx', ['storybook', 'build', '--test', '--quiet', '--disable-telemetry', '-o', join(tmp, 'sb')])
    if (b.status !== 0) s.render.errors.push(`storybook build failed: ${(b.stderr || b.stdout).trim().split('\n').slice(-5).join(' / ')}`)
    else {
      const index = JSON.parse(readFileSync(join(tmp, 'sb/index.json'), 'utf8')) as { entries: Record<string, { id: string; type: string; importPath: string }> }
      for (const e of Object.values(index.entries)) {
        if (e.type !== 'story' || !storyFiles.includes(e.importPath.replace(/^\.\//, ''))) continue
        targets.push({ name: `story ${e.id}`, ready: '#storybook-root > *', url: async () => { const { server, url } = await serve(join(tmp, 'sb'), false); return { url: `${url}/iframe.html?id=${e.id}&viewMode=story`, close: () => server.close() } } })
      }
    }
  }

  const shots: Shot[] = []
  const seen = new Set<string>()
  const a11ySeen = new Set<string>()
  for (const t of targets) {
    const { url, close } = await t.url()
    const images: Buffer[] = []
    try {
      for (const size of WIDTHS) {
        const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
        page.on('pageerror', (e) => s.render.errors.push(`${t.name} @${size.width}: ${e.message}`))
        await page.goto(url, { waitUntil: 'networkidle' })
        await page.waitForSelector(t.ready, { timeout: 15000 }).catch(() => {
          s.render.errors.push(`${t.name} @${size.width}: nothing rendered`)
          if (!s.render.blank.includes(t.name)) s.render.blank.push(t.name)
        })
        await page.evaluate('document.fonts.ready')
        await page.waitForTimeout(500)
        images.push(await page.screenshot({ fullPage: true }))

        await page.addScriptTag({ path: AXE })
        // A string, so it runs in the page (this file has no DOM types).
        const axeOptions = { runOnly: { type: 'tag', values: AXE_TAGS }, rules: Object.fromEntries(AXE_HOST_RULES.map((id) => [id, { enabled: false }])), resultTypes: ['violations'] }
        const result = (await page.evaluate(`axe.run(document, ${JSON.stringify(axeOptions)})`)) as { violations: { id: string; nodes: { html: string }[] }[] }
        for (const v of result.violations) for (const node of v.nodes) {
          const key = `${v.id}: ${node.html.slice(0, 160)}`
          if (a11ySeen.has(key)) continue
          a11ySeen.add(key)
          s.a11y.items.push(`${key}  (${t.name} @${size.width})`)
          s.a11y.byRule[v.id] = (s.a11y.byRule[v.id] ?? 0) + 1
        }
        await page.close()
      }
    } finally { close() }
    s.a11y.targets.push(t.name)
    if (t.name === 'home') s.render.home = true
    else s.render.stories.push(t.name.slice(6))
    // Mobile and Desktop stories of one screen render the same here (we set the viewport): keep one.
    const hash = createHash('sha256').update(Buffer.concat(images)).digest('hex')
    if (!seen.has(hash)) { seen.add(hash); shots.push({ target: t.name, images }) }
  }
  s.a11y.violations = a11ySeen.size
  rmSync(tmp, { recursive: true, force: true })
  // Judge sees the home page; stories only when the run didn't show it there.
  return shots.some((x) => x.target === 'home') ? shots.filter((x) => x.target === 'home') : shots
}

// ---------------------------------------------------------------- transcript

function readTranscript(r: Run, s: Score, all: Run[]) {
  const folder = join(homedir(), '.claude/projects', r.dir.replace(/[^a-zA-Z0-9]/g, '-'))
  if (!existsSync(folder)) return
  const files = readdirSync(folder).filter((f) => f.endsWith('.jsonl') && (!r.sessionId || f === `${r.sessionId}.jsonl`))
  const outside = [resolve(ROOT, '..'), ...all.filter((o) => o.id !== r.id).map((o) => o.dir)]
  for (const f of files) {
    s.transcript.found = true
    for (const line of readFileSync(join(folder, f), 'utf8').split('\n')) {
      if (!line.trim()) continue
      const content = (JSON.parse(line) as { message?: { content?: unknown } }).message?.content
      if (!Array.isArray(content)) continue
      for (const c of content as { type: string; name?: string; input?: unknown }[]) {
        if (c.type !== 'tool_use') continue
        if (c.name === 'AskUserQuestion') s.transcript.askUserQuestionCalls++
        const input = JSON.stringify(c.input)
        for (const p of outside) if (input.includes(p)) s.transcript.outsidePaths.push(`${c.name}: ${p}`)
      }
    }
  }
  s.transcript.outsidePaths = [...new Set(s.transcript.outsidePaths)]
}

// ---------------------------------------------------------------- main

const runs = JSON.parse(readFileSync(opts.runs!, 'utf8')) as Run[]
const selected = runs.filter((r) => !opts.only?.length || opts.only.includes(r.id))
// Process in random order, so file times in judge/ don't reveal the condition.
const order = [...selected].sort(() => randomBytes(1)[0] - 128)

// Judge labels: X / Y per task, at random; kept across re-scores.
const keyPath = join(RESULTS, 'judge-key.json')
const key: Record<string, Record<string, string>> = existsSync(keyPath) ? JSON.parse(readFileSync(keyPath, 'utf8')) : {}
for (const task of new Set(runs.map((r) => r.task))) {
  key[task] ??= {}
  const unlabelled = runs.filter((r) => r.task === task && !Object.values(key[task]).includes(r.id)).sort(() => randomBytes(1)[0] - 128)
  for (const r of unlabelled) {
    const label = 'XYZUVW'.split('').find((l) => !(l in key[task]))!
    key[task][label] = r.id
  }
}
mkdirSync(RESULTS, { recursive: true })
writeFileSync(keyPath, JSON.stringify(key, null, 2) + '\n')
const labelOf = (r: Run) => Object.entries(key[r.task]).find(([, id]) => id === r.id)![0]

const browser = opts['no-screens'] ? null : await chromium.launch()
mkdirSync(join(RESULTS, 'scores'), { recursive: true })

for (const r of order) {
  process.stdout.write(`${r.id} … `)
  const s = emptyScore()
  if (!existsSync(join(r.dir, 'node_modules'))) {
    console.log(`skipped: ${r.dir} has no node_modules (run npm run eval:prepare)`)
    continue
  }
  const files = changedFiles(r)
  s.changedFiles = files
  const baseTokensCss = definedVars(git(r.dir, 'show', `${r.base}:src/styles/tokens.css`))
  const baseIndexCss = definedVars(git(r.dir, 'show', `${r.base}:src/index.css`))
  analyse(r, files, s, baseTokensCss, baseIndexCss)

  // This repo's check:tokens, on the run's copy.
  const ct = run(ROOT, 'node', [join(ROOT, 'scripts/check-tokens.ts')], { SLOT_ROOT: r.dir })
  s.checkTokens.lines = (ct.stderr ?? '').split('\n').filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim())
  s.checkTokens.violations = s.checkTokens.lines.length

  const tsc = run(r.dir, 'npx', ['tsc', '-b', '--pretty', 'false'])
  s.typescript.lines = `${tsc.stdout}\n${tsc.stderr}`.split('\n').filter((l) => /error TS\d+/.test(l))
  s.typescript.errors = s.typescript.lines.length

  readTranscript(r, s, runs)

  if (browser) {
    const shots = await render(r, files, s, browser)
    const dir = join(RESULTS, 'judge', r.task)
    mkdirSync(dir, { recursive: true })
    const label = labelOf(r)
    for (const f of readdirSync(dir)) if (f.startsWith(`${label}-`)) rmSync(join(dir, f))
    shots.forEach((shot, i) => shot.images.forEach((img, w) => writeFileSync(join(dir, `${label}-${i + 1}-${WIDTHS[w].width}.png`), img)))
  }

  writeFileSync(join(RESULTS, 'scores', `${r.id}.json`), JSON.stringify({ run: r, ...s }, null, 2) + '\n')
  console.log('done')
}
await browser?.close()

// ---------------------------------------------------------------- summary (unblinded)

type Saved = Score & { run: Run } & Record<string, unknown>
const scored = runs.filter((r) => existsSync(join(RESULTS, 'scores', `${r.id}.json`)))
  .map((r) => JSON.parse(readFileSync(join(RESULTS, 'scores', `${r.id}.json`), 'utf8')) as Saved)
const c = (t: unknown) => (t as { count: number }).count
const metrics = (x: Saved) => ({
  components: c(x.inventedComponents),
  props: c(x.inventedProps),
  values: c(x.inventedValues),
  hardCoded: c(x.hardCodedValues),
  tokens: c(x.inventedTokens.primitive) + c(x.inventedTokens.theme) + c(x.inventedTokens.new),
  icons: c(x.inventedIcons),
  checkTokens: x.checkTokens.violations,
  typescript: x.typescript.errors,
  a11y: x.a11y.violations,
  slotCodeChanged: c(x.modifiedSlotFiles) + c(x.modifiedTokens),
  localComponents: c(x.localComponents),
})
type M = ReturnType<typeof metrics>
const COLS: [keyof M, string][] = [
  ['components', 'Components'], ['props', 'Props'], ['values', 'Values'], ['hardCoded', 'Hard-coded'], ['tokens', 'Tokens'],
  ['icons', 'Icons'], ['checkTokens', 'check:tokens'], ['typescript', 'TS errors'], ['a11y', 'a11y'],
  ['slotCodeChanged', 'Slot code changed'], ['localComponents', 'Local comps'],
]
const sum = (list: Saved[]) => {
  const total = Object.fromEntries(COLS.map(([k]) => [k, 0])) as M
  for (const x of list) for (const [k] of COLS) total[k] += metrics(x)[k]
  return total
}
const yn = (b: boolean | null) => (b === null ? '?' : b ? 'yes' : 'no')
const row = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`
const header = (first: string[]) => [row([...first, ...COLS.map(([, h]) => h)]), row([...first, ...COLS].map(() => '---'))]

const md = [
  '# Eval summary (unblinded)',
  '',
  'Generated by `npm run eval:score`. **Shows the conditions: don\'t give this to the judge.**',
  'Counts are unique items, checked against B\'s manifest. See `scores/<run>.json` for the items.',
  '',
  '## By condition',
  '',
  ...header(['Condition', 'Runs', 'Asked']),
  ...(['A', 'B'] as const).map((cond) => {
    const list = scored.filter((x) => x.run.condition === cond)
    const t = sum(list)
    return row([cond, list.length, list.filter((x) => x.run.asked).length, ...COLS.map(([k]) => t[k])])
  }),
  '',
  '## By category and condition',
  '',
  ...header(['Category', 'Condition']),
  ...['n', 'm', 'o'].flatMap((cat) => (['A', 'B'] as const).map((cond) => {
    const t = sum(scored.filter((x) => x.run.condition === cond && x.run.task.startsWith(`${cat}`)))
    return row([{ n: 'Normal', m: 'Missing pieces', o: 'Off-system' }[cat]!, cond, ...COLS.map(([k]) => t[k])])
  })),
  '',
  '## By run',
  '',
  ...header(['Task', 'Condition', 'Run', 'Asked', 'Rendered', 'Outside paths']),
  ...[...scored].sort((a, b) => a.run.task.localeCompare(b.run.task) || a.run.condition.localeCompare(b.run.condition)).map((x) => {
    const m = metrics(x)
    const blank = x.render.blank.length ? ` (${x.render.blank.length} blank)` : ''
    const rendered = ([x.render.home ? 'home' : '', x.render.stories.length ? `${x.render.stories.length} stories` : ''].filter(Boolean).join(', ') || (x.changedFiles.length ? 'nothing' : 'no changes')) + blank
    return row([x.run.task, x.run.condition, x.run.id, yn(x.run.asked), rendered, x.transcript.found ? x.transcript.outsidePaths.length : '?', ...COLS.map(([k]) => m[k])])
  }),
  '',
]
writeFileSync(join(RESULTS, 'summary.md'), md.join('\n'))
writeFileSync(join(RESULTS, 'summary.json'), JSON.stringify(scored.map((x) => ({ run: x.run, ...metrics(x) })), null, 2) + '\n')
console.log(`\n${scored.length} run(s) scored. Unblinded: eval/results/summary.md. For the judge: eval/results/judge/ only.`)
