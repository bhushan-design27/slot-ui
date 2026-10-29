import * as React from "react"
import { cn } from "cn"
import { Select as SelectPrimitive } from "radix-ui"

import { Icon } from "@/components/ui/icon"

/*
 * Figma: Select (79:65) + Select Option (82:44). Same label / placeholder /
 * helper as Input. State maps to: Focus = :focus-visible, Error = `invalid`
 * (aria-invalid), Disabled = the native attribute, Open = `open` (Radix
 * data-state=open; also controllable).
 *
 * Field: inset-ring stroke like Input, so the 2px Focus/Open stroke doesn't
 * move the text and the field stays 48px. Menu: matches the trigger width,
 * space-2 below it (the Figma gap), space-1 padding, raised shadow.
 * Option rows use radius-sm (= menu radius-md minus the space-1 padding).
 * Option Hover = Radix data-highlighted (pointer and keyboard),
 * Selected = data-state=checked with a check icon.
 */
type SelectOption = { value: string; label: string }

type SelectProps = {
  label?: string
  placeholder?: string
  helper?: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  invalid?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  className?: string
}

function Select({
  label,
  placeholder,
  helper,
  options,
  invalid = false,
  disabled = false,
  id,
  className,
  ...rootProps
}: SelectProps) {
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const helperId = helper ? `${triggerId}-helper` : undefined

  return (
    <div
      data-slot="select"
      className={cn("flex w-full flex-col items-start gap-(--space-2)", className)}
    >
      {label && (
        // Label/Small
        <label
          htmlFor={triggerId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium",
            disabled ? "text-(--color-text-disabled)" : "text-(--color-text-primary)"
          )}
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root disabled={disabled} {...rootProps}>
        {/* Body/Medium */}
        <SelectPrimitive.Trigger
          id={triggerId}
          data-slot="select-trigger"
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className={cn(
            "flex w-full min-w-0 items-center gap-(--space-2) rounded-(--radius-md) px-(--space-4) py-(--space-3) text-left text-(length:--font-size-body) leading-(--font-line-height-body) font-normal outline-none",
            "bg-(--color-surface-field) text-(--color-text-primary) enabled:data-placeholder:text-(--color-text-placeholder)",
            "inset-ring-(length:--border-width-1) inset-ring-(--color-border-field)",
            "aria-invalid:inset-ring-(--color-border-error)",
            "focus-visible:inset-ring-(length:--border-width-2) focus-visible:inset-ring-(--color-border-focus)",
            "data-[state=open]:inset-ring-(length:--border-width-2) data-[state=open]:inset-ring-(--color-border-focus)",
            "aria-invalid:focus-visible:inset-ring-(--color-border-error) aria-invalid:data-[state=open]:inset-ring-(--color-border-error)",
            "disabled:cursor-not-allowed disabled:bg-(--color-surface-disabled) disabled:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)",
            "*:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate"
          )}
        >
          <SelectPrimitive.Value data-slot="select-value" placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <Icon name="chevron-down" disabled={disabled} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-slot="select-content"
            position="popper"
            className={cn(
              "relative z-50 flex max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) flex-col overflow-hidden rounded-(--radius-md) p-(--space-1)",
              "bg-(--color-surface-page) text-(--color-text-primary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-subtle)",
              "shadow-[0_var(--shadow-offset-sm)_var(--shadow-blur-md)_0_var(--color-shadow-raised)]",
              "data-[side=bottom]:translate-y-(--space-2) data-[side=top]:-translate-y-(--space-2)",
              "origin-(--radix-select-content-transform-origin) duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {helper && (
        // Body/Small
        <p
          id={helperId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-normal",
            disabled
              ? "text-(--color-text-disabled)"
              : invalid
                ? "text-(--color-text-error)"
                : "text-(--color-text-secondary)"
          )}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

// Figma: Select Option (82:44). Body/Medium.
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex w-full cursor-default items-center gap-(--space-2) rounded-(--radius-sm) p-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body) font-normal text-(--color-text-primary) outline-none select-none",
        "data-highlighted:not-data-[state=checked]:bg-(--color-surface-hover) data-[state=checked]:bg-(--color-surface-selected)",
        "data-disabled:pointer-events-none data-disabled:text-(--color-text-disabled)",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText asChild>
        <span className="min-w-0 flex-1">{children}</span>
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator asChild>
        <Icon name="check" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectItem, type SelectOption, type SelectProps }
