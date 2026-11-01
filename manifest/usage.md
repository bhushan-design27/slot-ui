# Slot usage guidance

When to use each component. `npm run manifest` merges this file into
`manifest/slot.manifest.json`.

Format, per component: `## Name`, a `Status:` line, then `### Purpose`,
`### Use when` and `### Don't use when`. Change `Status:` to `Approved`
once an entry is reviewed. The manifest build fails if a component has no
entry, or an entry has no component.

## Button

Status: DRAFT - needs review

### Purpose

Triggers an action: submitting, saving, confirming, opening a dialog.
The variant tells the user how important or risky the action is.

### Use when

- `primary`: the main action of a screen, form or dialog ("Book now", "Save changes"). At most one primary button per area.
- `secondary`: alternative or less important actions next to a primary one ("Back", "Keep booking"), or actions on a screen that has no single main action.
- `danger`: the action destroys or cancels something and can't easily be undone ("Cancel booking", "Delete account"). Usually confirmed in a Dialog first.
- `size`: `medium` by default; `large` for the main action on a sparse screen or a touch-first layout; `small` in dense layouts, next to other small controls.

### Don't use when

- The action navigates to another page: use a link, or a Button with `asChild` wrapping the link, so it is announced as a link.
- The control switches something on or off, or selects an option: use Chip (or a future checkbox / switch).
- You need a red button for emphasis rather than a destructive action: `danger` means destructive only.
- Two `primary` buttons would sit side by side: make one `secondary`.

## Card

Status: DRAFT - needs review

### Purpose

Groups related content under a title so it reads as one unit, e.g. a
booking summary.

### Use when

- `flat`: the default, inside a page that already has structure (a list of bookings, a summary in a form).
- `raised`: the card sits on a busy or tinted background, or needs to stand out from other content on the screen.
- Several items of the same kind appear in a list or grid, each with a title.

### Don't use when

- The content is the whole page: use the page layout and a Heading/Large title instead.
- You only need spacing between sections: use space tokens, not a border.
- The content needs the user's decision before continuing: use Dialog.
- You would nest a card inside a card.

## Chip

Status: DRAFT - needs review

### Purpose

A toggle for filtering or picking options where all the choices stay
visible, e.g. filtering services by type.

### Use when

- The options are few (roughly 2 to 8) and short (one or two words), and showing them all helps the user scan.
- The user can turn options on and off independently (multi-select filters).
- Changing a chip updates content immediately (filtering a list), without a submit button.

### Don't use when

- There are many options, or long labels: use Select.
- The user must pick exactly one value inside a form that is submitted: use Select (a single-choice chip group needs extra radio-group semantics Slot doesn't provide yet).
- The chip triggers an action rather than a state: use Button.
- The chip is a read-only label or status: Slot has no badge yet; don't use a disabled Chip for it.

## Dialog

Status: DRAFT - needs review

### Purpose

Interrupts the current task to ask for a decision or confirmation that
must happen before the user continues.

### Use when

- Confirming a destructive or irreversible action ("Cancel booking?"), with a `secondary` dismiss action and a `danger` or `primary` confirm action.
- A short, focused decision or input that belongs to the current screen and can't be skipped.

### Don't use when

- Showing information that doesn't need a decision (success messages, tips): show it inline on the page.
- The content is long, a multi-step flow or a full form: use a page.
- The action is easy to undo: just do it, and offer undo inline if needed.
- Opening a dialog from inside another dialog.
- The footer has no visible dismiss action: Slot dialogs have no close (×) button, so a dismiss action ("Keep booking", "Cancel") is required.

## Icon

Status: DRAFT - needs review

### Purpose

A small Lucide glyph that supports a label or shows state, in the Slot
icon colours. Only the icons in the Figma Icon component are available.

### Use when

- Reinforcing meaning next to text (a check next to a selected option, a chevron that opens a menu).
- An icon-only control has an accessible name (`aria-label` on the control or the icon).

### Don't use when

- The icon would be the only way to convey meaning, with no text or accessible name.
- The icon you need isn't in `name`'s allowed values: add it to the Figma Icon component first, then to the code; don't import another Lucide icon directly.
- Decoration only, with no meaning: leave it out.

## Input

Status: DRAFT - needs review

### Purpose

A single-line text field for free text the user types, such as a name
or email, with a label and optional helper text.

### Use when

- The answer is free text or a number that can't be picked from a known list.
- Always with a visible `label`; add `helper` when the format or purpose isn't obvious.
- `invalid` when validation fails, with `helper` saying how to fix it.

### Don't use when

- The answer comes from a known, short list: use Select (or Chip for filters).
- The text spans multiple lines: Slot has no textarea yet.
- You'd use `placeholder` instead of `label`: placeholders disappear while typing and aren't a label.

## Select

Status: DRAFT - needs review

### Purpose

Picks one value from a list of predefined options, in a compact field
that fits in a form.

### Use when

- The user picks exactly one value from a known list, typically 4 or more options, or long labels.
- Space is limited and showing all options at once would crowd the form.
- Inside a form, alongside Inputs, with a visible `label` and optional `helper`.

### Don't use when

- There are only 2 or 3 short options that benefit from being visible: use Chip.
- The user can pick several values: use Chip (multi-select).
- The list is very long or needs search: Slot has no combobox with search yet.
- Selecting an option should trigger an action or navigation immediately: use Button.
