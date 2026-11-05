import * as React from "react"
import { cn } from "cn"
import { DayPicker, type DayButtonProps, type Matcher, type NextMonthButtonProps, type PreviousMonthButtonProps } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { WEEK_STARTS_ON, formatDateLong, formatMonth } from "@/lib/format"

/*
 * Figma: Calendar (176:380) + Calendar Day (176:379). shadcn's calendar
 * (react-day-picker) with every class replaced by Slot tokens, and the
 * month arrows as Slot's Secondary icon-only Buttons ("Previous month" /
 * "Next month"), disabled at the min / max month.
 *
 * en-US (CLAUDE.md "UI copy"): weeks start on Sunday, caption
 * "November 2026", day buttons named "Tuesday, November 10, 2026" (plus
 * "Today, " / ", selected").
 *
 * Day: 48x48, radius-md, Body/Medium. Selected = action-selected fill +
 * text-on-action (small-control selected style). Today = a 4px
 * action-primary dot space-1 from the bottom (surface-page on the
 * selected fill). Unavailable = text-disabled + strikethrough, disabled.
 * Outside-month days are shown in text-disabled and are not buttons.
 * Keyboard is react-day-picker's WAI-ARIA date grid: arrows by day and
 * week, Home / End, Page Up / Page Down by month (Shift for year).
 */

type CalendarProps = {
  /** The chosen day. */
  selected?: Date
  /** Called with the chosen day (undefined when deselected). */
  onSelect?: (date: Date | undefined) => void
  /** First selectable day; months before it can't be shown. */
  minDate?: Date
  /** Last selectable day; months after it can't be shown. */
  maxDate?: Date
  /** Days that can't be booked (dates or react-day-picker matchers), e.g. `{ dayOfWeek: [0] }`. */
  unavailable?: Matcher | Matcher[]
  /** The month shown (controlled). */
  month?: Date
  /** The month shown first (uncontrolled). Defaults to the selected day's month or today. */
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  /** Override today (tests and stories). */
  today?: Date
  className?: string
}

/**
 * A month grid for choosing one day, with previous / next month buttons.
 *
 * @figma Calendar 176:380
 * @a11y A role="grid" labelled by the month ("November 2026"); each day is a button named by its full date, today and selected included.
 * @a11y Keyboard (WAI-ARIA date grid): one Tab stop in the grid; arrows move by day and week, Home / End to the start / end of the week, Page Up / Page Down by month; Enter or Space selects.
 * @a11y Unavailable days are disabled (announced and skipped) and struck through, so the cue isn't colour alone.
 */

function Calendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  unavailable,
  month,
  defaultMonth,
  onMonthChange,
  today,
  className,
}: CalendarProps) {
  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
    ...(unavailable ? (Array.isArray(unavailable) ? unavailable : [unavailable]) : []),
  ]

  return (
    <DayPicker
      data-slot="calendar"
      mode="single"
      selected={selected}
      onSelect={onSelect}
      month={month}
      defaultMonth={defaultMonth ?? selected}
      onMonthChange={onMonthChange}
      startMonth={minDate}
      endMonth={maxDate}
      disabled={disabled}
      today={today}
      showOutsideDays
      weekStartsOn={WEEK_STARTS_ON}
      formatters={{ formatCaption: (date) => formatMonth(date) }}
      labels={{
        labelPrevious: () => "Previous month",
        labelNext: () => "Next month",
        // "Tuesday, November 10, 2026": en-US without ordinals, so the
        // visible number is a whole word of the name (WCAG 2.5.3).
        labelDayButton: (date, modifiers) =>
          `${modifiers.today ? "Today, " : ""}${formatDateLong(date)}, ${date.getFullYear()}${modifiers.selected ? ", selected" : ""}`,
      }}
      className={cn("w-fit text-(--color-text-primary)", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col",
        month: "flex flex-col gap-(--space-2)",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        // 36px: the icon-only Button height
        month_caption: "flex h-9 items-center justify-center",
        // Label/Medium
        caption_label: "text-(length:--font-size-body) leading-(--font-line-height-body) font-medium select-none",
        month_grid: "border-collapse",
        weekdays: "flex",
        // Label/Small
        weekday:
          "flex h-(--font-line-height-body) w-12 items-center justify-center text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary) select-none",
        week: "mt-(--space-1) flex",
        day: "size-12 p-0 text-center",
      }}
      components={{
        PreviousMonthButton: CalendarPreviousButton,
        NextMonthButton: CalendarNextButton,
        DayButton: CalendarDayButton,
      }}
    />
  )
}

/** react-day-picker marks an unavailable arrow with aria-disabled and passes its own chevron; Slot buttons use the native attribute and the Slot icon. */
function CalendarPreviousButton({ className: _className, children: _chevron, "aria-disabled": ariaDisabled, ...props }: PreviousMonthButtonProps) {
  return (
    <Button
      {...props}
      variant="secondary"
      size="icon"
      icon="chevron-left"
      aria-label="Previous month"
      disabled={props.disabled || ariaDisabled === true || ariaDisabled === "true"}
    />
  )
}

function CalendarNextButton({ className: _className, children: _chevron, "aria-disabled": ariaDisabled, ...props }: NextMonthButtonProps) {
  return (
    <Button
      {...props}
      variant="secondary"
      size="icon"
      icon="chevron-right"
      aria-label="Next month"
      disabled={props.disabled || ariaDisabled === true || ariaDisabled === "true"}
    />
  )
}

function CalendarDayButton({ day, modifiers, className: _className, children, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // Body/Medium
  const base = "relative flex size-12 items-center justify-center rounded-(--radius-md) text-(length:--font-size-body) leading-(--font-line-height-body) font-normal select-none"

  if (modifiers.outside) {
    return (
      <span aria-hidden className={cn(base, "text-(--color-text-disabled)")}>
        {children}
      </span>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toISOString().slice(0, 10)}
      {...props}
      className={cn(
        base,
        "outline-none transition-[color,background-color]",
        "text-(--color-text-primary) enabled:hover:bg-(--color-surface-hover)",
        modifiers.selected &&
          "bg-(--color-action-selected) text-(--color-text-on-action) enabled:hover:bg-(--color-action-selected-hover)",
        "focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)",
        "disabled:cursor-not-allowed disabled:text-(--color-text-disabled) disabled:line-through"
      )}
    >
      {children}
      {modifiers.today && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-(--space-1) left-1/2 size-1 -translate-x-1/2 rounded-(--radius-full)",
            modifiers.selected ? "bg-(--color-surface-page)" : "bg-(--color-action-primary)"
          )}
        />
      )}
    </button>
  )
}

export { Calendar, type CalendarProps }
