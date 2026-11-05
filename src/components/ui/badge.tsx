import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

/*
 * Figma: Badge (143:111). `label` (text property) is children. A pill:
 * space-1 / space-3 padding + Label/Small = 28px. Badge is a status
 * label, not a control, so the 36 / 48 / 56 control scale doesn't apply.
 * The stroke is inside in Figma, so the border is an inset-ring.
 */
const badgeVariants = cva(
  // Label/Small
  "inline-flex shrink-0 items-center rounded-(--radius-full) px-(--space-3) py-(--space-1) text-(length:--font-size-small) leading-(--font-line-height-small) font-medium whitespace-nowrap inset-ring-(length:--border-width-1)",
  {
    variants: {
      variant: {
        success: "bg-(--color-surface-success) text-(--color-text-success) inset-ring-(--color-border-success)",
        info: "bg-(--color-surface-info) text-(--color-text-info) inset-ring-(--color-border-info)",
        warning: "bg-(--color-surface-warning) text-(--color-text-warning) inset-ring-(--color-border-warning)",
        error: "bg-(--color-surface-error) text-(--color-text-error) inset-ring-(--color-border-error)",
        neutral: "bg-(--color-surface-neutral) text-(--color-text-neutral) inset-ring-(--color-border-neutral)",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> & {
  /** Status colour. A cancelled booking is neutral, never error. */
  variant?: "success" | "info" | "warning" | "error" | "neutral"
  /** The label (Figma `label`). One or two words, sentence case. */
  children?: React.ReactNode
}

/**
 * A short, non-interactive status label, such as a booking status.
 *
 * @figma Badge 143:111
 * @a11y Plain text, not a live region: the label carries the meaning, so it must make sense without the colour.
 * @a11y Not focusable and has no role; put it next to the thing it describes (e.g. in the booking's row or card).
 */

function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeProps }
