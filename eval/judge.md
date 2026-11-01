# Blind judging

You are judging screens built for a booking app (a massage and wellness
studio). For each task there are two versions, **X** and **Y**, built
from the same request by two different builders. You don't know who
built which, and you can't find out: judge only what you see.

## What's in this folder

- `requests.md`: the request each screen was built from.
- `screens/<task>/<label>-<n>-<width>.png`: screenshots of each
  version, at 390px (phone) and 1440px (desktop) wide. `<label>` is `X`
  or `Y`. `<n>` numbers the views when a version has more than one; most
  have only `1`. A missing file means that version showed nothing.
- `reference/your-details-390.png` and `reference/your-details-1440.png`:
  an existing screen of the same app ("Your details", a booking step).
  Use it as the standard for "Consistency with the app".
- `judgement.md`: where you write your scores. Write nothing else.

Use only these files. Don't look outside this folder.

## How to judge

For every task in `requests.md`, look at all of X's and Y's screenshots
at both widths, then score each version 1–5 on these four criteria,
with one sentence of reasoning per score:

1. **Task completeness**: can the user do everything the request asked,
   as far as the screenshots show? A screenshot shows the first view
   only: judge what is visible, and say so when the request depends on
   an interaction you can't see (a message after an action, a carousel
   swipe). Don't guess what happens after a click.
2. **Visual hierarchy**: is the main action and the page structure
   clear, at both widths?
3. **Copy clarity**: is every string short, specific and in sentence
   case ("Save changes", not "Save Changes")?
4. **Consistency with the app**: does it look like it belongs with the
   reference screen: the same type sizes, colours, spacing, widths,
   buttons and fields?

Scale: 1 = fails, 2 = poor, 3 = acceptable, 4 = good, 5 = excellent.
A 5 needs a reason, not just the absence of problems. Score X and Y
independently; don't let one anchor the other. Judge X before Y in
odd-numbered tasks and Y before X in even-numbered ones (task order as
in `requests.md`) to spread out order effects.

Some requests ask for things that might clash with the app's style
(e.g. a different colour). Score what was built against the criteria;
there is no hidden right answer about whether to follow such a request.

## Output

Fill in `judgement.md`, one section per task, in this exact form:

```markdown
## <task id>

| Version | Criterion | Score | Reason |
| --- | --- | --- | --- |
| X | Task completeness | 4 | … |
| X | Visual hierarchy | 3 | … |
| X | Copy clarity | 5 | … |
| X | Consistency with the app | 4 | … |
| Y | Task completeness | … | … |
| Y | Visual hierarchy | … | … |
| Y | Copy clarity | … | … |
| Y | Consistency with the app | … | … |
```

Then stop. Don't summarise across tasks and don't guess who built what.
