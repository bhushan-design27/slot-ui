# Eval protocol

Compares plain Claude Code with the Slot agent on the 10 requests in
`tasks.md`: 10 tasks × 2 conditions = 20 runs.

## Conditions

| | Source | What the agent gets |
| --- | --- | --- |
| **A**, plain Claude Code | branch `eval/condition-a` (worktree `../slot-ui-baseline`) | The same components, tokens, Storybook, `check:tokens` and a11y tests. No `CLAUDE.md`, `.claude/`, `manifest/`, `plans/`, `reports/`, and none of what only exists for them (manifest and `check:slot` scripts, their npm scripts and CI steps, the README sections about them). |
| **B**, Slot agent | `main` | Everything in A, plus the AI-ready layer: `CLAUDE.md`, the `slot-screen` skill, the manifest and usage guidance, `check:slot`. |

## Isolation: one fresh copy per run

Runs never happen in `slot-ui` or `../slot-ui-baseline` themselves.
`npm run eval:prepare` makes one copy per run:

- `git archive` of the condition's ref, so only committed files go in.
  For B, `eval/` and the `eval:*` npm scripts are removed, so the agent
  can't read the tasks, this protocol or the scorer.
- A new git repo with a single "Initial commit" (same author and date in
  both conditions), so `git log` shows no history from the other
  condition.
- An APFS clone of `slot-ui/node_modules` (`cp -c`), so both start with
  the same packages and an `npm install` in a run can't change another
  run.
- A neutral folder name (`~/slot-eval-runs/run-<random>`), outside
  `bhushan-projects`, so neither `CLAUDE.md` discovery nor `ls ..` finds
  `slot-ui`.

## Neutral ids

Every file about a run is named by its random id (`run-3fa2c1`), never
its condition: prompts, transcripts, final messages, usage, scores.
`runs.json` has no condition either. The A/B key is only in
`<results>/condition-key.json`; keep it from whoever records "did it
ask" and from the judge until both are done.

Every later run starts from its own untouched copy, so no run sees what
an earlier run built.

## Request text

- Send the task's `text` block from `tasks.md` exactly, then a blank
  line, then the delivery line. Same bytes for A and B. Don't add
  context, hints, file names, or "use the design system".
- `npm run eval:prepare` writes the exact prompt for each run to
  `eval/results/prompts/<run>.txt`, and `npm run eval:run` sends that
  file as is.

## Sessions

- A fresh Claude Code session per run, started in the run's folder.
  Never `--continue` or reuse a session across runs.
- Same settings for every run:
  - model `claude-opus-5-5`, default effort;
  - setting sources `project,local` only (user plugins, user skills
    and user `settings.json` are not loaded), so the only skill B has
    is the project's `slot-screen`;
  - **no MCP servers** (`--strict-mcp-config` with an empty config).
    This keeps the conditions equal, and stops B's rule "Figma first,
    then code" from editing the real Slot Figma file
    (`kcQ8UEPlSVCNw8Qs2LL6aZ`) during the eval;
  - the narrowest permissions a run can finish with: read and edit
    files inside the run's own folder, run the package's npm scripts and
    `npx tsc -b`, use skills. Everything else is denied without asking
    (`dontAsk`), including the web. The exact settings are in
    "Permissions" below;
  - a runaway guard per run (`--max-budget-usd 25`, API-equivalent
    estimate, and a 60-minute timeout), the same for both.
- Interleave the runs in a random order (`runs.json` is written in that
  order), so model or time-of-day drift doesn't fall on one condition.

## Permissions

`eval/run.ts` writes this to `<results>/settings/<run>.json` and passes
it with `--settings`, plus `--permission-mode dontAsk` on the command
line (`<dir>` is the run's absolute folder):

```json
{
  "permissions": {
    "defaultMode": "dontAsk",
    "allow": ["Read(/<dir>/**)", "Edit(/<dir>/**)", "Bash(npm run *)", "Bash(npx tsc -b*)", "Skill"],
    "deny": [
      "Bash(npm run dev*)", "Bash(npm run storybook*)", "Bash(npm run preview*)",
      "WebFetch", "WebSearch"
    ]
  }
}
```

- `Edit` covers every file-editing tool. `/<dir>` with the leading
  extra slash is an absolute path (`//Users/…/run-3fa2c1/**`).
- `dev`, `storybook` and `preview` start servers that never exit.
- `npx tsc -b` is the one command allowed beyond the npm scripts: in
  the first pilot both agents tried it (in combined commands like
  `npm run check:tokens && npx tsc -b`), got denied, and then skipped
  every check. Read-only commands (`ls`, `cat`, `grep`) need no rule.
  No other `npx`, no `git` writes, no `npm install`.
- Every denial is recorded (`usage/<run>-<turn>.json`,
  `permissionDenials`), so a run that was blocked shows up.
- Residual risk: an agent can add an npm script and run it, so this
  limits honest mistakes, not a determined agent. The copy is
  throwaway, and transcripts are checked for paths outside it.

## Running

Billing safety: `eval:run` stops before any run if `ANTHROPIC_API_KEY`
or `ANTHROPIC_AUTH_TOKEN` is set, or if `claude auth status` doesn't
show a claude.ai subscription. It prints that status at the start of
every batch. Runs get a clean environment (no `ANTHROPIC_*`, no
`CLAUDE*`).

1. **Pilot** (`npm run eval:pilot`): `m2-cancelled-toast` once per
   condition, in `eval/results-pilot/` and `~/slot-eval-pilot/`. Check
   that both runs finished, what was denied, and how questions showed
   up. Don't start the full set until the pilot is approved.
2. **Full set**: `npm run eval:prepare`, then `npm run eval:run`. Runs
   go one at a time, in the random order of `runs.json`.
3. After each batch, read only `final/<run>-<turn>.md` for each run,
   then reply or record (see "Questions").
4. `npm run eval:score`.

## Questions

If the agent asks a question or asks for a decision **before** the task
is done, the only reply is:

```text
Choose what you think is best and explain it in your report
```

- Same text every time, no matter what was asked. Never answer the
  question itself.
- To reply: `npm run eval:run -- --reply <run>`. It resumes the same
  session with that text and sets `asked` and `questions`.
- If it asks again, send the same reply again, at most 3 times. After
  that, stop the run and note it.
- Decide from `final/<run>-<turn>.md` only, not the transcript (the
  transcript shows which skills were loaded, so it gives away the
  condition). The final message can still hint at it (B tends to
  mention plans and checks); that can't be hidden.
- A request to approve finished work ("Please review and approve") is
  not a question: don't reply, and record it as `askedApproval`.
- Record in `eval/results/runs.json` for each run:
  - `asked`: `true` or `false` (`--reply` sets `true`);
  - `questions`: how many times the reply was sent (`--reply` counts);
  - `askedApproval`: `true` or `false`;
  - `notes`: what it asked, in a few words.

## Scoring

After all 20 runs: `npm run eval:score`.

It scores every run in `eval/results/runs.json` with the same scripts
from this repo, never the copy inside the run (an agent could have
changed that). Everything is counted against **B's manifest**
(`manifest/slot.manifest.json`), for both conditions:

| Count | What counts |
| --- | --- |
| Invented components | JSX components that aren't in the manifest: from third-party packages, new exports or files in `src/components/ui/`, and raw `button` / `input` / `select` / `textarea`. Local composites (a `ServiceCard` built from Slot parts) are listed for review but not counted. |
| Invented props | Props of Slot components that the manifest doesn't list, unless they pass through to the element (`aria-*`, `data-*`, `on*`, standard HTML attributes). |
| Invented values | Literal values of enum props outside `allowedValues` (e.g. `variant="orange"`). Plus hard-coded style values (`w-[372px]`, `text-lg`, `p-4`, inline `style`), counted apart. |
| Invented tokens | CSS variables used or defined that the manifest doesn't list, split into primitives used directly, shadcn theme variables, and new ones. |
| Invented icons | `Icon name` values outside the manifest, Lucide icons imported directly, inline `<svg>`. |
| `check:tokens` | Violations reported by this repo's `scripts/check-tokens.ts` run on the copy. |
| TypeScript | `error TS…` lines from `npx tsc -b` in the copy. |
| Accessibility | axe (WCAG 2.0, 2.1 and 2.2 A/AA rules) on the home page and on every story the run added or changed, at 390 and 1440. Same axe build and rules for both conditions; violations counted once per rule and element. |

Results:

- `eval/results/scores/<run>.json`: every count with the items behind it.
- `eval/results/summary.md` and `summary.json`: per run, per task and per
  condition. **Unblinded**: not for the judge.
- `eval/results/judge/<task>/<label>-<n>-<width>.png`: the home page (or,
  if the run didn't change it, its new stories) at 390 and 1440.
  `<label>` is `X` or `Y`, assigned at random per task. The key is in
  `eval/results/judge-key.json`; keep it from the judge until the
  judging is done.

## Blind judging

Give the judge only `eval/results/judge/` and `tasks.md`. For each task,
the judge compares X and Y on the request, without the code, the
transcripts or the summary.

## Known limits

- Screenshots show the first render only. States behind an interaction
  (a toast after cancelling, an open dialog) are judged only if the
  run shows them on the home page.
- What counts as invented is decided by B's manifest, which is B's own
  rulebook. That's the point of the comparison, but say so when
  reporting results: A is scored against rules it was never given.
- Neutral folders and a fresh git repo hide the other condition, but
  can't stop an agent that searches the whole disk. The scorer reads
  each run's transcript (`~/.claude/projects/`) and lists tool calls
  that touched `bhushan-projects` or another run's folder.
