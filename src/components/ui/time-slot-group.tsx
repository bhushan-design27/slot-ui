import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { InlineMessage } from "@/components/ui/inline-message"
import { formatTime } from "@/lib/format"

/*
 * Figma: Time Slot Group (175:415) + Time Slot (175:335). A Radix
 * RadioGroup laid out as a grid: 3 columns below sm (640px), 4 from sm,
 * space-2 gaps. Figma `viewport` is that breakpoint, not a prop. The
 * keyboard is the standard linear radio model (every arrow goes to the
 * next or previous enabled slot); the grid is visual only.
 *
 * Slot: 48px (space-3 + Label/Medium + space-3), radius-md, the same
 * small-control colours as Chip: Selected is the solid action-selected
 * fill with text-on-action (CLAUDE.md "Borders and sizing"). Times are
 * formatted en-US with formatTime ("10:00 AM").
 *
 * Figma `empty` = no enabled slot: the group shows an info InlineMessage
 * instead of the grid.
 */
type TimeSlot = {
  /** The start time. Shown as "10:00 AM"; the value is its ISO string. */
  time: Date
  /** Taken or unavailable: shown, skipped by the arrow keys. */
  disabled?: boolean
}

type TimeSlotGroupProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  "orientation" | "dir" | "children"
> & {
  /** Visible label, Label/Small, e.g. "Available times on Tuesday, November 10". */
  label: string
  /** The day's times, in order. */
  slots: TimeSlot[]
  /** Shown in an info InlineMessage when no slot is available. */
  emptyMessage?: string
}

/**
 * A grid of times for one day that behaves as a radio group.
 *
 * @figma Time Slot Group 175:415
 * @a11y role="radiogroup" labelled by the visible label; one Tab stop; arrow keys move to the next or previous available time and select it.
 * @a11y Each slot is a role="radio" named by its time ("10:00 AM"); unavailable times are disabled, so they are announced as unavailable and skipped.
 * @a11y With no available times, an info InlineMessage (role="status") replaces the grid, so changing to a full day is announced politely.
 */

function TimeSlotGroup({
  label,
  slots,
  emptyMessage = "No times left on this day. Try another day.",
  id,
  className,
  ...props
}: TimeSlotGroupProps) {
  const generatedId = React.useId()
  const groupId = id ?? generatedId
  const labelId = `${groupId}-label`
  const empty = !slots.some((slot) => !slot.disabled)

  return (
    <div data-slot="time-slot-group-field" className={cn("flex w-full flex-col items-start gap-(--space-2)", className)}>
      {/* Label/Small */}
      <span
        id={labelId}
        className="w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-primary)"
      >
        {label}
      </span>
      {empty ? (
        <InlineMessage variant="info" message={emptyMessage} />
      ) : (
        <RadioGroupPrimitive.Root
          id={groupId}
          data-slot="time-slot-group"
          aria-labelledby={labelId}
          className="grid w-full grid-cols-3 gap-(--space-2) sm:grid-cols-4"
          {...props}
        >
          {slots.map((slot) => (
            <TimeSlotItem key={slot.time.toISOString()} time={slot.time} disabled={slot.disabled} />
          ))}
        </RadioGroupPrimitive.Root>
      )}
    </div>
  )
}

type TimeSlotItemProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "value" | "children"> & {
  time: Date
}

/**
 * One time in a TimeSlotGroup. TimeSlotGroup renders these from `slots`.
 *
 * @figma Time Slot 175:335
 * @states Default, Hover, Focus, Disabled
 * @a11y Figma `selected` is the group's `value` (the slot's ISO time), announced from aria-checked.
 */

function TimeSlotItem({ time, className, ...props }: TimeSlotItemProps) {
  return (
    <RadioGroupPrimitive.Item
      value={time.toISOString()}
      data-slot="time-slot"
      className={cn(
        // Label/Medium
        "inline-flex w-full items-center justify-center rounded-(--radius-md) px-(--space-4) py-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body) font-medium whitespace-nowrap select-none outline-none transition-[color,background-color]",
        "bg-(--color-action-secondary) text-(--color-text-primary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-control)",
        "enabled:data-[state=unchecked]:hover:bg-(--color-action-secondary-hover) enabled:data-[state=unchecked]:hover:text-(--color-text-action-hover) enabled:data-[state=unchecked]:hover:inset-ring-(--color-border-action-hover)",
        "enabled:data-[state=checked]:bg-(--color-action-selected) enabled:data-[state=checked]:text-(--color-text-on-action) enabled:data-[state=checked]:inset-ring-(--color-border-selected)",
        "enabled:data-[state=checked]:hover:bg-(--color-action-selected-hover) enabled:data-[state=checked]:hover:inset-ring-(--color-border-selected-hover)",
        "focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)",
        "disabled:cursor-not-allowed disabled:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)",
        className
      )}
      {...props}
    >
      {formatTime(time)}
    </RadioGroupPrimitive.Item>
  )
}

export { TimeSlotGroup, TimeSlotItem, type TimeSlotGroupProps, type TimeSlot }
