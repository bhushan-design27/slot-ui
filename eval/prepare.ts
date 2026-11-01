/**
 * Makes one fresh, isolated copy of the repo per eval run (protocol.md,
 * "Isolation"): 10 tasks × conditions A and B = 20 copies.
 *
 *   npm run eval:prepare [-- --out ~/slot-eval-runs --a eval/condition-a --b main]
 *
 * Each copy is a `git archive` of the condition's ref in a new git repo
 * with one "Initial commit", with node_modules cloned from this repo.
 * Folder names are neutral (run-<random>); which run is which is written
 * only to eval/results/runs.json here. Prompts go to
 * eval/results/prompts/<run>.txt. Refuses to touch existing runs.
 */
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { readTasks, DELIVERY_LINE, type Run } from './lib.ts'

const ROOT = resolve(import.meta.dirname, '..')
const RESULTS = join(ROOT, 'eval/results')

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: join(homedir(), 'slot-eval-runs') },
    a: { type: 'string', default: 'eval/condition-a' },
    b: { type: 'string', default: 'main' },
  },
})
const OUT = resolve(values.out!.replace(/^~(?=\/|$)/, homedir()))
const REFS = { A: values.a!, B: values.b! } as const

if (existsSync(join(RESULTS, 'runs.json'))) {
  console.error('eval/results/runs.json already exists. Move it (and its run folders) away to prepare a new set.')
  process.exit(1)
}
if (OUT.startsWith(resolve(ROOT, '..') + '/')) {
  console.error(`--out must be outside ${resolve(ROOT, '..')}, so runs can't find slot-ui next to them.`)
  process.exit(1)
}
if (existsSync(OUT) && readdirSync(OUT).length) {
  console.error(`${OUT} is not empty.`)
  process.exit(1)
}

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// Identical commit metadata in both conditions.
const COMMIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Dev',
  GIT_AUTHOR_EMAIL: 'dev@example.com',
  GIT_COMMITTER_NAME: 'Dev',
  GIT_COMMITTER_EMAIL: 'dev@example.com',
  GIT_AUTHOR_DATE: '2026-11-01T09:00:00Z',
  GIT_COMMITTER_DATE: '2026-11-01T09:00:00Z',
}

/** Exports a ref to a folder; for B, removes the eval harness. */
function snapshot(condition: 'A' | 'B'): string {
  const dir = join(tmpdir(), `slot-eval-snapshot-${condition}-${process.pid}`)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  execFileSync('sh', ['-c', `git archive "$REF" | tar -x -C "$DIR"`], { cwd: ROOT, env: { ...process.env, REF: REFS[condition], DIR: dir } })

  // The agent must not see the tasks, the protocol or the scorer.
  rmSync(join(dir, 'eval'), { recursive: true, force: true })
  const pkgPath = join(dir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  for (const name of Object.keys(pkg.scripts)) if (name.startsWith('eval:')) delete pkg.scripts[name]
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  const tsNode = join(dir, 'tsconfig.node.json')
  writeFileSync(tsNode, readFileSync(tsNode, 'utf8').replace(/, "eval\/\*\*\/\*\.ts"/, ''))
  return dir
}

const tasks = readTasks(join(ROOT, 'eval/tasks.md'))
const snapshots = { A: snapshot('A'), B: snapshot('B') }

// Random interleaved order (protocol.md, "Sessions").
const pairs = tasks.flatMap((t) => (['A', 'B'] as const).map((condition) => ({ task: t, condition })))
for (let i = pairs.length - 1; i > 0; i--) {
  const j = randomBytes(4).readUInt32BE() % (i + 1)
  ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
}

mkdirSync(OUT, { recursive: true })
mkdirSync(join(RESULTS, 'prompts'), { recursive: true })
const runs: Run[] = []

for (const { task, condition } of pairs) {
  const id = `run-${randomBytes(3).toString('hex')}`
  const dir = join(OUT, id)
  cpSync(snapshots[condition], dir, { recursive: true })
  // APFS clone (copy-on-write): instant, and independent of slot-ui/node_modules.
  execFileSync('cp', ['-cR', join(ROOT, 'node_modules'), join(dir, 'node_modules')])
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'add', '-A')
  execFileSync('git', ['commit', '-q', '-m', 'Initial commit'], { cwd: dir, env: COMMIT_ENV })
  const base = git(dir, 'rev-parse', 'HEAD')

  writeFileSync(join(RESULTS, 'prompts', `${id}.txt`), `${task.text}\n\n${DELIVERY_LINE}\n`)
  runs.push({ id, task: task.id, condition, dir, base, sessionId: null, asked: null, questions: null, askedApproval: null, notes: '' })
  console.log(`${id}  ${task.id}`)
}

for (const dir of Object.values(snapshots)) rmSync(dir, { recursive: true, force: true })
writeFileSync(join(RESULTS, 'runs.json'), JSON.stringify(runs, null, 2) + '\n')
console.log(`\n${runs.length} runs in ${OUT}. Conditions are in eval/results/runs.json (don't show it to the judge).`)
