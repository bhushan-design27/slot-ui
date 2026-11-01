import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/*
 * Figma: Button (12:54). variant × size map to props; state is CSS:
 * Hover = :hover, Focus = :focus-visible, Disabled = the native attribute.
 *
 * Figma strokes are inside and excluded from layout, so borders are drawn
 * with inset-ring (box-shadow) rather than `border`: padding stays exactly
 * the Figma padding and heights land on 36 / 48 / 56.
 *
 * Focus ring = the two Figma drop shadows: border-width-2 of surface-page
 * (the 2px gap) under border-width-4 of border-focus (the 2px ring).
 * Written as one shadow, not ring + ring-offset utilities: `cn` treats
 * ring-offset width and color as the same class and drops the width.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-(--space-2) rounded-(--radius-md) font-medium whitespace-nowrap select-none outline-none transition-colors",
    "focus-visible:shadow-[0_0_0_var(--border-width-2)_var(--color-surface-page),0_0_0_var(--border-width-4)_var(--color-border-focus)]",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-(--color-action-primary) text-(--color-text-on-action)",
          "enabled:hover:bg-(--color-action-primary-hover)",
          "disabled:bg-(--color-action-disabled) disabled:text-(--color-text-on-disabled)",
        ],
        secondary: [
          "bg-(--color-action-secondary) text-(--color-text-action) inset-ring-(length:--border-width-1) inset-ring-(--color-border-action)",
          "enabled:hover:bg-(--color-action-secondary-hover) enabled:hover:text-(--color-text-action-hover) enabled:hover:inset-ring-(--color-border-action-hover)",
          "disabled:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)",
        ],
        danger: [
          "bg-(--color-action-danger) text-(--color-text-on-action)",
          "enabled:hover:bg-(--color-action-danger-hover)",
          "disabled:bg-(--color-action-disabled) disabled:text-(--color-text-on-disabled)",
        ],
      },
      size: {
        // Label/Small
        small:
          "px-(--space-3) py-(--space-2) text-(length:--font-size-small) leading-(--font-line-height-small)",
        // Label/Medium
        medium:
          "px-(--space-4) py-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body)",
        // Label/Medium
        large:
          "px-(--space-6) py-(--space-4) text-(length:--font-size-body) leading-(--font-line-height-body)",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> & {
  /** Visual emphasis: primary, secondary or danger (destructive). */
  variant?: "primary" | "secondary" | "danger"
  /** Height 36 / 48 / 56. */
  size?: "small" | "medium" | "large"
  /** The label. Sentence case. */
  children?: React.ReactNode
  /** Figma Disabled state. Native attribute. */
  disabled?: boolean
  /** Render the single child (e.g. a link) with button styles instead of a <button>. */
  asChild?: boolean
}

/**
 * An action the user can take.
 *
 * @figma Button 12:54
 * @states Default, Hover, Focus, Disabled
 * @a11y Renders a native <button> with type="button" by default, so it never submits a form by accident.
 * @a11y Disabled uses the native attribute: the button leaves the tab order and is announced as unavailable.
 * @a11y Focus ring: 2px border-focus ring with a 2px surface-page gap, on :focus-visible only.
 */

function Button({
  className,
  variant = "primary",
  size = "medium",
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
