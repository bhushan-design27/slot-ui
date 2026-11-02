# Results: plain Claude Code vs the Slot agent

Ten screen requests, each built once by two agents. Same model, same
request, same tools.

- **A, plain Claude Code:** this repo without `CLAUDE.md`, `.claude/`
  (the slot-screen skill), the manifest, plans and reports, or the
  manifest and Slot check scripts. It still has every Slot component,
  token, story, README and `check:tokens`.
- **B, the Slot agent:** this repo as it is on `main`.

## Method

- **Tasks** (`eval/tasks.md`):
  - 5 normal screens Slot can already build: service list, booking confirmation, my bookings, sign in, reschedule.
  - 3 that need a piece Slot lacks: therapist photo carousel, "Booking cancelled" toast, date picker.
  - 2 off-system requests: an orange, bigger "Book now" button; a red "Limited offer" badge.
  - Every request ends: "Show it on the app's home page (src/App.tsx) so I can review it."
- **Runs:**
  - 20 runs: one per task per condition, in random interleaved order.
  - Each ran in its own fresh copy of the repo, outside the project folder, under a neutral id.
  - Headless Claude Code (`claude -p`), model `claude-opus-5-5`, no MCP servers, no user settings.
  - Two pilot runs of the toast task came first, to tune the setup. They are excluded from these results.
- **Questions:**
  - In non-interactive mode, a question shows up as the agent stopping with a question in its answer.
  - The only reply ever given was "Choose what you think is best and explain it in your report", at most 3 times per run.
  - A request to approve finished work did not count as a question.
- **Automatic scoring** (`npm run eval:score`):
  - Checked against B's manifest: invented components, props, prop values, tokens and icons, and hard-coded values in the added lines.
  - Also counted: `check:tokens` violations, TypeScript errors (`tsc -b`), and axe violations on the home page and every new story.
  - Screenshots at 390 and 1440px.
- **Judging:**
  - **AI judge:** a fresh Claude Code session, limited to a folder containing only the requests, X/Y screenshots and a reference screen (Your details). It scored each version 1–5 on four criteria (`eval/judge.md`).
  - **Human judge:** the repo owner chose a preferred screen for 6 of the 10 tasks, from the same X/Y screenshots and the served apps.
  - The owner also recorded "did it ask" from each run's first answer.
  - The A/B key was opened only after both had finished.

## Fairness rules

- Identical request text, model, permissions and fixed reply for both conditions. Only the repo contents differ.
- A fresh session and a fresh repo copy per run, so nothing carries over between runs.
- **Narrowest permissions** that let a run finish, identical for A and B:
  - Read and Edit inside the run's own folder.
  - `npm run *`, `npx tsc -b*`, and Skill.
  - Dev server, Storybook, preview, WebFetch and WebSearch denied.
- **Neutral run ids:** the A/B key was kept in a separate file and unopened until judging was done. X/Y labels were assigned separately per task.
- The AI judge could read only its own folder and write only its judgement file.
- Billing: every batch checked it was on the Max subscription, with no API key set.
- One component change, DialogClose (added to the manifest as part of Dialog), was made after pilot 1 and copied to both conditions before the full set ran.

## Results

| Measure | A: plain | B: Slot agent |
| --- | --- | --- |
| Invented components | **3** (Carousel, Toast, DatePicker) | **0** |
| Invented props | 1 | 0 |
| Invented prop values | 0 | 0 |
| Invented tokens | **4** (2 orange primitives, 2 accent action tokens) | **0** |
| Invented icons | 0 counted, but 2 runs added `chevron-left`/`chevron-right` to Icon (the scorer counts that as a changed Slot file) | 0 |
| Hard-coded values | 7 | 1 |
| Shared Slot files changed | 3 runs (Icon ×2, Dialog) | 0 runs |
| `check:tokens` violations | 0 | 0 |
| TypeScript errors | 0 | 0 |
| axe violations | 0 | 0 |
| Asked when Slot lacked a piece (3 tasks) | 0 / 3 | **3 / 3** |
| Pushed back on off-system requests (2 tasks) | 0 / 2 | **2 / 2** |
| Asked on a normal task (5 tasks) | 0 / 5 | 1 / 5 |
| AI judge: Task completeness (mean 1–5) | **4.3** | 3.4 |
| AI judge: Visual hierarchy | 3.8 | **4.3** |
| AI judge: Copy clarity | 3.9 | **4.6** |
| AI judge: Consistency with the app | 3.6 | **4.5** |
| AI judge: total (of 20, mean) | 15.6 | **16.8** |
| AI judge: tasks won | 3 | **7** |
| Human preference (6 tasks) | 2 | **4** |
| Ran all its checks (tsc, check:tokens, a11y tests)¹ | 3 / 10 | **9 / 10** |
| Ran no check at all | 3 / 10 | 1 / 10 |
| Cost (API-equivalent, on Max plan) | $5.31 | $11.93 |
| Sessions (first turns + fixed replies) | 10 | 16 |

¹ B also ran `check:slot` in the same 9 runs, and `npm run manifest` in
the 3 where it applied; A has neither script. TS, token and axe counts
come from the scorer, which ran every check on every run, whether or not
the agent did.

### By category (AI judge total, mean of 20)

| Category | A | B |
| --- | --- | --- |
| Normal (5) | 17.0 | 17.6 |
| Missing pieces (3) | 13.3 | 16.3 |
| Off-system (2) | 15.5 | 15.5 |

On normal tasks the two agents are close, and both stayed inside Slot.
The difference shows when Slot lacks something or the request goes
against it:

- **Missing pieces:** A built the missing component into the shared library, without asking, every time. B asked every time, then built the screen from existing parts.
- **Off-system:** A did what was asked (orange tokens, a local red badge). B declined and explained why. The AI judge's scores cancel out: A gets full marks for completeness, B for consistency.

## Per task

AI totals are out of 20 (four criteria). "Human" is the owner's pick.

| Task | AI: A | AI: B | AI pick | Human pick | Agree? |
| --- | --- | --- | --- | --- | --- |
| n1 Service list | 15 | 18 | B | A | **No** |
| n2 Booking confirmation | 19 | 20 | B | – | – |
| n3 My bookings | 15 | 16 | B | – | – |
| n4 Sign in | 18 | 17 | A | – | – |
| n5 Reschedule | 18 | 17 | A | – | – |
| m1 Therapist carousel | 14 | 16 | B | B | Yes |
| m2 Cancelled toast | 9 | 15 | B | B | Yes |
| m3 Date picker | 17 | 18 | B | A | **No** |
| o1 Orange Book now | 18 | 15 | A | B | **No** |
| o2 Limited offer badge | 13 | 16 | B | B | Yes |

**Agreement:** 3 of 6. The three disagreements:

- **n1:**
  - The AI marked A down for a filled primary Book button on every one of 11 cards, and for two cards with the same name.
  - The owner preferred A anyway.
  - It was close on the AI side too: the same 4 for completeness, and no more than 1 point apart on any criterion.
- **m3:**
  - A built a month calendar. It is a new DatePicker in the shared library, not in Figma, with 3 hard-coded sizes.
  - B used a Select listing the next 14 days, inside the full booking-step layout.
  - The AI scored B 1 point higher, on consistency and hierarchy.
  - The owner preferred A's calendar view.
  - This is the clearest case where the better-looking screen is the off-system one.
- **o1:**
  - The AI gave B a 1 for completeness, because the button isn't orange and is the same large size the reference already uses.
  - The owner preferred B "even though it has no orange button".
  - The AI judge was told there is no right answer on following off-system requests, so it scored literal completion. The owner valued staying in the system.

The 3 agreements: m1 and o2 favour B for consistency. m2 is a clear B win (see below).

The owner's notes also flag what the scores can't show:

- On m1, the owner liked A's carousel, but noted it "isn't a Slot component".
- On o2, the owner preferred B because it "uses the design system" and didn't create a badge.

## Side by side

**m2, "Booking cancelled" toast (missing piece)**

- **A:**
  - Built a new Toast component in `src/components/ui/`, styled after Dialog. No new tokens.
  - The home page showed only a bare "Cancel booking" button on the starter placeholder page, under the developer copy "Components live in Storybook…".
  - Its type check and token check passed; its a11y tests were blocked by permissions.
  - AI judge: 9 of 20.
- **B:**
  - Stopped and listed three options: build a Toast, show an inline message, or change the requirement.
  - After the fixed reply, it built an inline "Booking cancelled" message from existing parts. Its reasons: a new component starts in Figma, and the Dialog usage notes say success messages go inline.
  - Confirm dialog with "Keep booking" / "Cancel booking". The message line is reserved so nothing shifts, and screen readers announce it.
  - It added a browser test of the whole flow, and all checks passed.
  - AI judge: 15 of 20. Owner: "clear winner".

**o1, orange and bigger Book now (off-system)**

- **A:**
  - Added `--color-orange-700`, `--color-orange-800`, `--color-action-accent` and `--color-action-accent-hover` to the token file, and made a bigger orange button.
  - AI judge: 5 for completeness, 3 for consistency.
- **B:**
  - Kept the button blue at Slot's largest size and explained why:
    - Slot has no orange.
    - A separate orange style would compete with the primary button.
    - White on mid-orange fails contrast.
    - If orange is wanted, the clean route is changing the primary colour in Figma.
  - AI judge: 1 for completeness, 5 for consistency. Owner preferred B.

**m3, date picker (missing piece)**

- **A:**
  - Built a DatePicker month calendar with closed Sundays and a booking-window hint, and made up availability rules.
  - Added `chevron-left`/`chevron-right` to Icon and used 3 hard-coded sizes.
  - Owner preferred it for the calendar view.
- **B:**
  - Asked first. After the fixed reply, it used Select over the next 14 days. Its reasons: Slot's usage rules, no new Figma work, and appointments booked days ahead.
  - Placed it as "Step 2 of 4" with the booking summary from the existing flow.
  - It suggested a calendar only if bookings open months ahead.
  - AI judge: 5 for consistency and for hierarchy, 3 for completeness.

## Limitations

- **One run per task per condition.** Ten pairs can't separate the agent from run-to-run variation. Treat per-task wins as anecdotes and only the consistent patterns as findings: asking or pushing back, 0 vs 3 invented components, 9 vs 3 completed checks.
- **One human judge**, who also built Slot and the B agent, judged 6 of the 10 tasks. X/Y labels and screenshots were blind, but some outputs give the condition away (a stopped-and-asked report or a new component is recognisable).
- **One AI judge, one pass.** It saw only first-view screenshots, so interaction-heavy tasks (toast, carousel, date picker) were scored on what was visible. It is the same model family as the builders.
- **Permission limits on self-checks:**
  - Compound shell commands, `npx vitest`, `npx oxlint`, `sed`/`python` edits and dev servers were denied.
  - Every run hit at least one denial (38 in total).
  - Most were recovered (shell reads redone with Read, edits redone with Edit).
  - Several runs skipped their own checks after a denied combined command, and neither agent could look at its own rendered screen. A's checks were hit harder: 3 of 10 ran everything, vs 9 of 10 for B. B's instructions list each check by name; A had to work them out from `package.json`.
  - The scorer ran every check on every run afterwards, and all 20 had 0 TS, 0 token and 0 axe violations. So the missed self-checks didn't let errors through here.
- **B asks more, which costs a turn.** 6 of B's 10 runs stopped once before building, including one normal task (reschedule). Each was resumed once with the fixed reply. In real use that's a person's time. B also cost about 2.2× A in tokens.
- **"Invented" is measured against B's manifest.** A never saw it, so A's counts measure drift from Slot, not rule-breaking. A's new components could be good proposals; they just skip Figma and review.
- **Scorer heuristics.** The detection rules for hard-coded values and local components were tuned on the pilots and may still miss or over-count edge cases.
