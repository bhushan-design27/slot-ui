/**
 * Runs eval tasks with Claude Code's non-interactive mode (protocol.md).
 *
 *   npm run eval:run [-- --results eval/results] [-- --only run-abc123]
 *   npm run eval:run -- --reply run-abc123    send the fixed reply to a run that asked
 *   npm run eval:pilot                        prepare + run the pilot (m2, A and B)
 *
 * Starts every run in <results>/runs.json that hasn't started, one at a
 * time, each in its own copy and a fresh session. Stops before any run if
 * ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) is set, or if Claude Code
 * isn't signed in with a claude.ai subscription, and prints the auth
 * status at the start of each batch.
 *
 * Everything is filed under the run's neutral id, never its condition:
 *   transcripts/<run>-<turn>.jsonl   stream-json output
 *   final/<run>-<turn>.md            the agent's last message (for recording "did it ask")
 *   usage/<run>-<turn>.json          tokens, cost estimate, turns, denials, rate limits
 *   settings/<run>.json              the permission settings the run used
 */
import { spawnSync, execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { REPLY, type Run } from './lib.ts'

const ROOT = resolve(import.meta.dirname, '..')
const { values: opts } = parseArgs({
  options: {
    results: { type: 'string', default: 'eval/results' },
    only: { type: 'string', multiple: true },
    reply: { type: 'string' },
    model: { type: 'string', default: 'claude-opus-5-5' },
    'max-budget-usd': { type: 'string', default: '25' },
    'timeout-min': { type: 'string', default: '60' },
  },
})
const RESULTS = resolve(ROOT, opts.results!)
const REL = relative(ROOT, RESULTS)
const MAX_REPLIES = 3

// ------------------------------------------------------------ billing safety

for (const name of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']) {
  if (process.env[name]) {
    console.error(`\nStopped: ${name} is set, so the runs could be billed to the API instead of your subscription.`)
    console.error(`Unset it (unset ${name}) and run again. No run was started.\n`)
    process.exit(1)
  }
}

/**
 * The runs get a clean environment: no ANTHROPIC_* (API keys, base URLs,
 * model overrides) and no CLAUDE* (marks a nested session; CLAUDE_EFFORT
 * would change the effort level).
 */
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(ANTHROPIC_|CLAUDE)/.test(k)))

function authStatus() {
  const raw = execFileSync('claude', ['auth', 'status'], { env: childEnv, encoding: 'utf8' })
  const s = JSON.parse(raw) as { loggedIn?: boolean; authMethod?: string; apiProvider?: string; subscriptionType?: string; email?: string }
  console.log('Claude Code auth status (claude auth status):')
  console.log(`  logged in:     ${s.loggedIn}`)
  console.log(`  auth method:   ${s.authMethod}`)
  console.log(`  API provider:  ${s.apiProvider}`)
  console.log(`  subscription:  ${s.subscriptionType ?? '(none)'}`)
  console.log(`  account:       ${s.email ?? '?'}\n`)
  if (!s.loggedIn || s.authMethod !== 'claude.ai' || s.apiProvider !== 'firstParty' || !s.subscriptionType) {
    console.error('Stopped: not signed in with a claude.ai subscription, so the runs could be billed elsewhere. No run was started.')
    process.exit(1)
  }
}

// ------------------------------------------------------------ permissions

/**
 * The narrowest settings a run can finish with: read and edit files inside
 * its own folder, run the package's npm scripts and the type check. Anything else would
 * need a prompt, and dontAsk turns every prompt into a denial (recorded in
 * usage/<run>-<turn>.json as permission_denials).
 */
function settingsFor(r: Run) {
  const inside = `/${r.dir}/**` // `//abs/path/**`: an absolute path in a permission rule
  return {
    permissions: {
      defaultMode: 'dontAsk',
      // npx tsc -b: the type check both pilot agents reached for (B's checks list it).
      allow: [`Read(${inside})`, `Edit(${inside})`, 'Bash(npm run *)', 'Bash(npx tsc -b*)', 'Skill'],
      deny: [
        // Long-running servers would only hang the run.
        'Bash(npm run dev*)', 'Bash(npm run storybook*)', 'Bash(npm run preview*)',
        // No network: A must not fetch the published manifest; neither needs the web.
        'WebFetch', 'WebSearch',
      ],
    },
  }
}

// ------------------------------------------------------------ one turn

type Event = { type: string; subtype?: string; [k: string]: unknown }

function turn(r: Run, n: number, prompt: string, resume: boolean) {
  for (const d of ['transcripts', 'final', 'usage', 'settings']) mkdirSync(join(RESULTS, d), { recursive: true })
  const settingsPath = join(RESULTS, 'settings', `${r.id}.json`)
  writeFileSync(settingsPath, JSON.stringify(settingsFor(r), null, 2) + '\n')

  const args = [
    '-p', prompt,
    '--model', opts.model!,
    '--setting-sources', 'project,local',
    '--settings', settingsPath,
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--permission-mode', 'dontAsk',
    '--max-budget-usd', opts['max-budget-usd']!,
    '--output-format', 'stream-json', '--verbose',
    ...(resume ? ['--resume', r.sessionId!] : ['--session-id', r.sessionId!]),
  ]
  const transcript = join(RESULTS, 'transcripts', `${r.id}-${n}.jsonl`)
  const out = openSync(transcript, 'w')
  const err = openSync(join(RESULTS, 'transcripts', `${r.id}-${n}.stderr.txt`), 'w')
  const started = Date.now()
  const p = spawnSync('claude', args, { cwd: r.dir, env: childEnv, stdio: ['ignore', out, err], timeout: Number(opts['timeout-min']) * 60_000 })
  closeSync(out)
  closeSync(err)

  const events = readFileSync(transcript, 'utf8').split('\n').filter((l) => l.trim()).flatMap((l) => { try { return [JSON.parse(l) as Event] } catch { return [] } })
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init')
  const result = [...events].reverse().find((e) => e.type === 'result')
  const askCalls = events.flatMap((e) => (e.type === 'assistant' ? ((e.message as { content?: { type: string; name?: string; input?: unknown }[] })?.content ?? []) : []))
    .filter((c) => c.type === 'tool_use' && c.name === 'AskUserQuestion')
  const finalText = typeof result?.result === 'string' ? result.result : '(no result event: see the transcript)'

  writeFileSync(join(RESULTS, 'final', `${r.id}-${n}.md`), finalText + '\n')
  writeFileSync(join(RESULTS, 'usage', `${r.id}-${n}.json`), JSON.stringify({
    exitCode: p.status,
    timedOut: p.error?.message.includes('ETIMEDOUT') ?? false,
    wallClockMs: Date.now() - started,
    result: result && {
      subtype: result.subtype, isError: result.is_error, numTurns: result.num_turns, durationMs: result.duration_ms,
      totalCostUsd: result.total_cost_usd, usage: result.usage, modelUsage: result.modelUsage, permissionDenials: result.permission_denials,
    },
    rateLimitEvents: events.filter((e) => /rate_limit/.test(e.type) || /rate_limit/.test(e.subtype ?? '')),
    askUserQuestion: askCalls.map((c) => c.input),
    init: init && { model: init.model, permissionMode: init.permissionMode, apiKeySource: init.apiKeySource, tools: init.tools, mcpServers: init.mcp_servers, skills: init.skills, plugins: init.plugins, slashCommands: init.slash_commands },
  }, null, 2) + '\n')

  // Subscription usage, from the rate_limit_event Claude Code emits (whole percents only).
  type Window = { utilization?: number }
  const windows = events.filter((e) => e.type === 'rate_limit_event')
    .map((e) => (e.rate_limit_info as { unifiedWindows?: Record<string, Window> })?.unifiedWindows ?? {})
  const pct = (w: string) => {
    const u = windows.map((x) => x[w]?.utilization).filter((x): x is number => typeof x === 'number')
    return u.length ? `${Math.round(u[0] * 100)}→${Math.round(u.at(-1)! * 100)}%` : '?'
  }
  const plan = `plan: 5-hour ${pct('five_hour')}, weekly ${pct('seven_day')}`
  const mins = ((Date.now() - started) / 60_000).toFixed(1)
  const cost = typeof result?.total_cost_usd === 'number' ? `$${result.total_cost_usd.toFixed(2)} API-equivalent` : 'cost ?'
  const denials = Array.isArray(result?.permission_denials) ? result.permission_denials.length : '?'
  const question = askCalls.length ? `AskUserQuestion ×${askCalls.length}` : /\?\s*$/.test(finalText.trim()) ? 'ends with "?"' : 'no'
  console.log(`  ${r.id} turn ${n}: ${result?.subtype ?? `exit ${p.status}`}, ${mins} min, ${result?.num_turns ?? '?'} turns, ${cost}, ${denials} denial(s), possible question: ${question}`)
  console.log(`    ${plan}`)
  console.log(`    read ${REL}/final/${r.id}-${n}.md`)
}

// ------------------------------------------------------------ main

const runsPath = join(RESULTS, 'runs.json')
if (!existsSync(runsPath)) {
  console.error(`${REL}/runs.json not found. Run npm run eval:prepare first.`)
  process.exit(1)
}
const runs = JSON.parse(readFileSync(runsPath, 'utf8')) as Run[]
const save = () => writeFileSync(runsPath, JSON.stringify(runs, null, 2) + '\n')

authStatus()

if (opts.reply) {
  const r = runs.find((x) => x.id === opts.reply)
  if (!r?.sessionId) throw new Error(`${opts.reply}: no such run, or it hasn't started`)
  if ((r.questions ?? 0) >= MAX_REPLIES) throw new Error(`${r.id}: already replied ${MAX_REPLIES} times; stop the run and note it (protocol.md)`)
  const n = readdirSync(join(RESULTS, 'transcripts')).filter((f) => f.startsWith(`${r.id}-`) && f.endsWith('.jsonl')).length + 1
  r.asked = true
  r.questions = (r.questions ?? 0) + 1
  save()
  console.log(`Replying to ${r.id} (reply ${r.questions} of at most ${MAX_REPLIES}): "${REPLY}"`)
  turn(r, n, REPLY, true)
} else {
  const todo = runs.filter((r) => (!opts.only?.length || opts.only.includes(r.id)) && !r.sessionId)
  console.log(`${todo.length} run(s) to start, one at a time.\n`)
  for (const r of todo) {
    r.sessionId = randomUUID()
    save() // before starting, so a crash still shows the run was started
    console.log(`${r.id}  ${r.task}`)
    turn(r, 1, readFileSync(join(RESULTS, 'prompts', `${r.id}.txt`), 'utf8').trimEnd(), false)
  }
}

console.log(`
Next, for each run: read ${REL}/final/<run>-<turn>.md (only that file, so you stay blind).
- It asked a question or for a decision before finishing: npm run eval:run -- --results ${REL} --reply <run>
- Otherwise record in ${REL}/runs.json: asked (false if never replied), askedApproval, notes.
Then: npm run eval:score -- --results ${REL}`)
