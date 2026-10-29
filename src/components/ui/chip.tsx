import * as React from "react"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

/*
 * Figma: Chip (74:29). A toggle button (Radix Toggle, from shadcn/ui
 * `toggle`): Selected = `selected` prop, rendered as aria-pressed;
 * Hover = :hover, Focus = :focus-visible, Disabled = the native attribute.
 *
 * Height 36 = space-2 padding + the 20px Label/Small line. The border is an
 * inset-ring so it doesn't add to that. Selected styles only apply while
 * enabled, so a disabled chip always looks disabled (Figma has no
 * Selected + Disabled variant).
 */
type ChipProps = Omit<
  React.ComponentProps<typeof TogglePrimitive.Root>,
  "pressed" | "defaultPressed" | "onPressedChange"
> & {
  selected?: boolean
  defaultSelected?: boolean
  onSelectedChange?: (selected: boolean) => void
}

function Chip({
  className,
  selected,
  defaultSelected,
  onSelectedChange,
  ...props
}: ChipProps) {
  return (
    <TogglePrimitive.Root
      data-slot="chip"
      pressed={selected}
      defaultPressed={defaultSelected}
      onPressedChange={onSelectedChange}
      className={cn(
        // Label/Small
        "inline-flex shrink-0 items-center justify-center gap-(--space-2) rounded-(--radius-full) px-(--space-4) py-(--space-2) text-(length:--font-size-small) leading-(--font-line-height-small) font-medium whitespace-nowrap select-none outline-none transition-colors",
        "bg-(--color-action-secondary) text-(--color-text-primary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-control)",
        "enabled:not-aria-pressed:hover:bg-(--color-action-secondary-hover) enabled:not-aria-pressed:hover:text-(--color-text-action-hover) enabled:not-aria-pressed:hover:inset-ring-(--color-border-action-hover)",
        "enabled:aria-pressed:bg-(--color-action-selected) enabled:aria-pressed:text-(--color-text-on-action) enabled:aria-pressed:inset-ring-(--color-border-action)",
        "focus-visible:shadow-[0_0_0_var(--border-width-2)_var(--color-surface-page),0_0_0_var(--border-width-4)_var(--color-border-focus)]",
        "disabled:cursor-not-allowed disabled:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)",
        className
      )}
      {...props}
    />
  )
}

export { Chip, type ChipProps }
