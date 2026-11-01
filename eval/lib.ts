/** Shared by eval/prepare.ts and eval/score.ts. */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export type Task = { id: string; category: string; text: string }

/** One run in eval/results/runs.json. The last five fields are filled in by whoever runs it. */
export type Run = {
  id: string
  task: string
  condition: 'A' | 'B'
  dir: string
  /** The copy's "Initial commit"; everything after it is the run's output. */
  base: string
  sessionId: string | null
  asked: boolean | null
  questions: number | null
  askedApproval: boolean | null
  notes: string
}

const TASKS_MD = join(resolve(import.meta.dirname), 'tasks.md')

/** The text after the "## Delivery line" heading's text block. */
export const DELIVERY_LINE = (() => {
  const md = readFileSync(TASKS_MD, 'utf8')
  const m = /## Delivery line[\s\S]*?```text\n([\s\S]*?)\n```/.exec(md)
  if (!m) throw new Error('tasks.md: no "## Delivery line" text block')
  return m[1].trim()
})()

/** Tasks from tasks.md: a "### `id`" heading under a "## Category" heading, then a text block. */
export function readTasks(path = TASKS_MD): Task[] {
  const tasks: Task[] = []
  let category = ''
  const md = readFileSync(path, 'utf8')
  for (const m of md.matchAll(/^## (.+)$|^### `([\w-]+)`\n+```text\n([\s\S]*?)\n```/gm)) {
    if (m[1]) category = m[1].trim()
    else tasks.push({ id: m[2], category, text: m[3].trim() })
  }
  if (tasks.length !== 10) throw new Error(`tasks.md: expected 10 tasks, found ${tasks.length}`)
  return tasks
}
