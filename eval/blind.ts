/**
 * Makes the blind-judging material after npm run eval:score.
 *
 *   npm run eval:blind [-- --results eval/results] [-- --pack ~/slot-eval-judge]
 *
 * 1. A judge pack outside this repo (default ~/slot-eval-judge): JUDGE.md
 *    (eval/judge.md), requests.md, the X / Y screenshots, a reference
 *    screenshot of the existing Your details screen, and an empty
 *    judgement.md. A fresh Claude Code session judges from there, with
 *    permissions limited to that folder, so it can't reach the A/B key.
 * 2. <results>/blind-sheet.md for the person judging: every run with a
 *    "did it ask" column, and every task with a "preferred screen" column.
 *    Neither shows a condition.
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { homedir, tmpdir } from 'node:os'
import { extname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'
import { DELIVERY_LINE, readTasks, type Run } from './lib.ts'

const ROOT = resolve(import.meta.dirname, '..')
const { values: opts } = parseArgs({
  options: {
    results: { type: 'string', default: 'eval/results' },
    pack: { type: 'string', default: join(homedir(), 'slot-eval-judge') },
  },
})
const RESULTS = resolve(ROOT, opts.results!)
const REL = relative(ROOT, RESULTS)
const PACK = resolve(opts.pack!.replace(/^~(?=\/|$)/, homedir()))
if (PACK.startsWith(resolve(ROOT, '..') + '/')) throw new Error(`--pack must be outside ${resolve(ROOT, '..')}`)
if (!existsSync(join(RESULTS, 'judge'))) throw new Error(`${REL}/judge not found: run npm run eval:score -- --results ${REL} first`)

const runs = JSON.parse(readFileSync(join(RESULTS, 'runs.json'), 'utf8')) as Run[]
const tasks = readTasks().filter((t) => runs.some((r) => r.task === t.id))

// ------------------------------------------------------------ judge pack

if (existsSync(join(PACK, 'judgement.md')) && readFileSync(join(PACK, 'judgement.md'), 'utf8').includes('| X |')) {
  throw new Error(`${PACK}/judgement.md already has scores; move it away first.`)
}
rmSync(PACK, { recursive: true, force: true })
mkdirSync(join(PACK, 'reference'), { recursive: true })
cpSync(join(ROOT, 'eval/judge.md'), join(PACK, 'JUDGE.md'))
cpSync(join(RESULTS, 'judge'), join(PACK, 'screens'), { recursive: true })
writeFileSync(join(PACK, 'requests.md'), [
  '# Requests', '',
  'Each screen was built from this request, followed by the line:', '', `> ${DELIVERY_LINE}`, '',
  ...tasks.flatMap((t) => [`## ${t.id}`, '', t.text, '']),
].join('\n'))
writeFileSync(join(PACK, 'judgement.md'), '# Judgement\n\n')

// Reference: the existing Your details screen, from this repo's Storybook.
const sb = join(tmpdir(), `slot-eval-reference-${process.pid}`)
const build = spawnSync('npx', ['storybook', 'build', '--test', '--quiet', '--disable-telemetry', '-o', sb], { cwd: ROOT, encoding: 'utf8' })
if (build.status !== 0) throw new Error(`storybook build failed:\n${build.stderr}`)
const server = createServer((req, res) => {
  const path = join(sb, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname))
  if (!path.startsWith(sb) || !existsSync(path) || !extname(path)) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' }[extname(path)] ?? 'application/octet-stream')
  res.end(readFileSync(path))
})
await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok))
const browser = await chromium.launch()
for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const page = await browser.newPage({ viewport: size })
  await page.goto(`http://127.0.0.1:${(server.address() as { port: number }).port}/iframe.html?id=screens-yourdetails--mobile&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#storybook-root > *')
  await page.evaluate('document.fonts.ready')
  await page.screenshot({ path: join(PACK, 'reference', `your-details-${size.width}.png`), fullPage: true })
  await page.close()
}
await browser.close()
server.close()
rmSync(sb, { recursive: true, force: true })

// ------------------------------------------------------------ blind sheet

const byTask = [...runs].sort((a, b) => a.task.localeCompare(b.task) || a.id.localeCompare(b.id))
writeFileSync(join(RESULTS, 'blind-sheet.md'), [
  '# Blind sheet',
  '',
  'Nothing here shows which run is A or B. Until you are done, don\'t open',
  '`condition-key.json`, `summary.md`/`summary.json`, `scores/`, `usage/`,',
  '`transcripts/` (they list the loaded skills, which gives it away) or',
  '`runs.json` (it records which runs got the fixed reply).',
  '',
  '## 1. Did it ask?',
  '',
  `For each run, read only its first answer, \`${REL}/final/<run>-1.md\` (opening`,
  'the file directly, not listing the folder: later answers exist only for runs',
  'that got the fixed reply). "Yes" if it stopped to ask a question or for a',
  'decision before doing the task; a request to approve finished work is not a',
  'question (note it instead).',
  '',
  '| Run | Task | First answer | Did it ask? (yes/no) | Notes |',
  '| --- | --- | --- | --- | --- |',
  ...byTask.map((r) => `| ${r.id} | ${r.task} | \`final/${r.id}-1.md\` |  |  |`),
  '',
  '## 2. Which screen do you prefer?',
  '',
  `Screenshots: \`${REL}/judge/<task>/\`. To click through: \`npm run eval:serve -- --results ${REL}\`,`,
  'then open http://localhost:4400 (try 390px and 1440px wide).',
  '',
  '| Task | Preferred (X/Y) | Why |',
  '| --- | --- | --- |',
  ...tasks.map((t) => `| ${t.id} |  |  |`),
  '',
].join('\n'))

console.log(`Judge pack: ${PACK}
Start the judge there, in a fresh session limited to that folder:

  cd ${PACK} && claude -p "Read JUDGE.md and follow it." \\
    --model claude-opus-5-5 --setting-sources project,local \\
    --strict-mcp-config --mcp-config '{"mcpServers":{}}' \\
    --permission-mode dontAsk \\
    --settings '{"permissions":{"allow":["Read(/${PACK}/**)","Edit(/${PACK}/judgement.md)"]}}'

Blind sheet: ${REL}/blind-sheet.md`)
