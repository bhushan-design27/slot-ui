/**
 * Serves every run's app for blind judging, so interactive tasks (a toast
 * after cancelling, a carousel, a date picker) can be clicked through.
 *
 *   npm run eval:serve [-- --results eval/results] [-- --port 4400] [-- --rebuild]
 *
 * Each run's home page is built once into
 * <results>/judge-apps/<task>/<label>/ and served at
 * http://localhost:<port>/<task>/<label>/, with the same X / Y labels as the
 * screenshots (<results>/judge-key.json, written by npm run eval:score).
 * The index page shows each task's request and its X / Y links: no run
 * ids, no conditions.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { readTasks, type Run } from './lib.ts'

const ROOT = resolve(import.meta.dirname, '..')
const { values: opts } = parseArgs({
  options: {
    results: { type: 'string', default: 'eval/results' },
    port: { type: 'string', default: '4400' },
    rebuild: { type: 'boolean', default: false },
  },
})
const RESULTS = resolve(ROOT, opts.results!)
const APPS = join(RESULTS, 'judge-apps')
const keyPath = join(RESULTS, 'judge-key.json')
if (!existsSync(keyPath)) {
  console.error(`${relative(ROOT, keyPath)} not found. Run npm run eval:score -- --results ${relative(ROOT, RESULTS)} first (it assigns the X / Y labels).`)
  process.exit(1)
}
const key = JSON.parse(readFileSync(keyPath, 'utf8')) as Record<string, Record<string, string>>
const runs = new Map((JSON.parse(readFileSync(join(RESULTS, 'runs.json'), 'utf8')) as Run[]).map((r) => [r.id, r]))
const tasks = readTasks().filter((t) => key[t.id])

// Build each run's app under its label.
const broken = new Set<string>()
for (const t of tasks) {
  for (const [label, id] of Object.entries(key[t.id]).sort()) {
    const out = join(APPS, t.id, label)
    if (existsSync(join(out, 'index.html')) && !opts.rebuild) continue
    process.stdout.write(`building ${t.id} ${label} … `)
    const b = spawnSync('npx', ['vite', 'build', '--base', `/${t.id}/${label}/`, '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], {
      cwd: runs.get(id)!.dir, encoding: 'utf8',
    })
    if (b.status === 0) console.log('ok')
    else {
      broken.add(`${t.id}/${label}`)
      console.log(`build failed\n${(b.stderr || b.stdout).trim().split('\n').slice(-5).join('\n')}`)
    }
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blind judging</title><style>
body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px;color:#111;background:#fff}
h1{font-size:24px}h2{font-size:18px;margin:32px 0 4px}p{margin:0 0 8px;color:#444}a{margin-right:16px;font-weight:600}
</style></head><body><h1>Blind judging</h1>
<p>Open X and Y for each task (try 390px and 1440px wide) and compare them against the request.</p>
${tasks.map((t) => `<h2>${esc(t.id)}</h2><p>${esc(t.text)}</p><p>${Object.keys(key[t.id]).sort().map((l) =>
  broken.has(`${t.id}/${l}`) ? `<span>${l}: didn't build</span>` : `<a href="/${t.id}/${l}/" target="_blank">${l}</a>`).join('')}</p>`).join('\n')}
</body></html>`

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' }
createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
  if (path === '/') { res.setHeader('content-type', 'text/html'); return res.end(index) }
  const [, task, label] = path.split('/')
  const appRoot = join(APPS, task ?? '', label ?? '')
  if (!task || !label || !key[task]?.[label] || !existsSync(appRoot)) { res.statusCode = 404; return res.end('Not found') }
  let file = join(APPS, path)
  if (!file.startsWith(appRoot)) { res.statusCode = 403; return res.end() }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(appRoot, 'index.html') // the app's own routes
  res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream')
  res.end(readFileSync(file))
}).listen(Number(opts.port), '127.0.0.1', () => console.log(`\nBlind judging: http://localhost:${opts.port}/  (Ctrl-C to stop)`))
