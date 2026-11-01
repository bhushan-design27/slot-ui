import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

/*
 * Figma: Radio Group (103:107) + Radio (103:68). Radix RadioGroup (from
 * shadcn/ui `radio-group`) provides the behaviour: one Tab stop, arrow keys
 * move and select, Space selects the focused option.
 *
 * Group: label / options / helper stacked with space-2, options with
 * space-3 (24px rows, so a 36px rhythm). Error = `invalid`: only the helper
 * turns error red, the circles stay neutral (as Figma). Disabled = the
 * native attribute on every option.
 *
 * Radio: a 20px circle, stroke as inset-ring like Chip. The Figma Radio
 * `selected` variant is Radix data-state=checked; Hover = hovering the row
 * (label included), Focus = :focus-visible with the Slot focus ring.
 */
type RadioGroupOption = { value: string; label: string; disabled?: boolean }

type RadioGroupProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  "children" | "orientation" | "dir" | "loop"
> & {
  /** Visible group label, Label/Small. Names the radiogroup. */
  label?: string
  /** Helper text under the options; turns error red when invalid. */
  helper?: string
  /** The choices, in display order. 2 to 5 options. */
  options: RadioGroupOption[]
  /** Selected value (controlled). */
  value?: string
  /** Initially selected value when uncontrolled. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Figma Error state. Rendered as aria-invalid on the group. */
  invalid?: boolean
  /** Figma Disabled state. Disables every option. */
  disabled?: boolean
}

/**
 * Choose exactly one of 2 to 5 options, all visible at once.
 *
 * @figma Radio Group 103:107
 * @states Default, Error, Disabled
 * @a11y role="radiogroup" labelled by the group label; helper text is linked with aria-describedby; Error sets aria-invalid on the group.
 * @a11y Keyboard: one Tab stop for the group; arrow keys move between options and select them; Space selects the focused option.
 * @a11y Each option is a role="radio" button named by its <label>; clicking the label selects it.
 */
function RadioGroup({
  label,
  helper,
  options,
  invalid = false,
  disabled = false,
  id,
  className,
  ...props
}: RadioGroupProps) {
  const generatedId = React.useId()
  const groupId = id ?? generatedId
  const labelId = label ? `${groupId}-label` : undefined
  const helperId = helper ? `${groupId}-helper` : undefined

  return (
    <div
      data-slot="radio-group-field"
      className={cn("flex w-full flex-col items-start gap-(--space-2)", className)}
    >
      {label && (
        // Label/Small
        <span
          id={labelId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium",
            disabled ? "text-(--color-text-disabled)" : "text-(--color-text-primary)"
          )}
        >
          {label}
        </span>
      )}
      <RadioGroupPrimitive.Root
        id={groupId}
        data-slot="radio-group"
        aria-labelledby={labelId}
        aria-describedby={helperId}
        aria-invalid={invalid || undefined}
        // Radix only disables the radios; say it on the group too, so the
        // group label is announced (and checked) as part of a disabled control.
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="flex flex-col items-start gap-(--space-3)"
        {...props}
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option.value}
            id={`${groupId}-${option.value}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </RadioGroupItem>
        ))}
      </RadioGroupPrimitive.Root>
      {helper && (
        // Body/Small. Helper text keeps text-secondary when disabled.
        <p
          id={helperId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-normal",
            invalid && !disabled ? "text-(--color-text-error)" : "text-(--color-text-secondary)"
          )}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

/**
 * One option: the radio circle and its label. RadioGroup renders these from `options`; use directly only to compose a custom group.
 *
 * @figma Radio 103:68
 */
function RadioGroupItem({
  id,
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    // Body/Medium. `group` so hovering the label shows the Hover state on the circle.
    <label
      htmlFor={id}
      data-slot="radio-group-option"
      className="group flex items-center gap-(--space-2) text-(length:--font-size-body) leading-(--font-line-height-body) font-normal text-(--color-text-primary) has-disabled:text-(--color-text-disabled)"
    >
      <RadioGroupPrimitive.Item
        id={id}
        data-slot="radio-group-item"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-(--radius-full) outline-none",
          "bg-(--color-surface-field) inset-ring-(length:--border-width-1) inset-ring-(--color-border-control)",
          "enabled:group-hover:bg-(--color-action-secondary-hover) enabled:group-hover:inset-ring-(--color-border-action)",
          "data-checked:bg-(--color-action-primary) data-checked:inset-ring-(--color-border-action)",
          "enabled:data-checked:group-hover:bg-(--color-action-primary-hover) enabled:data-checked:group-hover:inset-ring-(--color-border-action-hover)",
          "disabled:cursor-not-allowed disabled:bg-(--color-surface-disabled) disabled:inset-ring-(--color-border-disabled)",
          "focus-visible:shadow-[0_0_0_var(--border-width-2)_var(--color-surface-page),0_0_0_var(--border-width-4)_var(--color-border-focus)]",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="size-2 rounded-(--radius-full) bg-(--color-icon-on-action) group-has-disabled:bg-(--color-icon-disabled)"
        />
      </RadioGroupPrimitive.Item>
      <span>{children}</span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem, type RadioGroupOption, type RadioGroupProps }
