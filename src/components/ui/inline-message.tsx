import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { Icon, type IconName } from "@/components/ui/icon"

/*
 * Figma: Inline Message (143:140). `title` + `show title` (title is set),
 * `message`. space-4 padding, space-3 between icon and text, title and
 * message stacked with space-1. The icon sits in a box one Body/Medium
 * line tall, so it centres on the first line. The stroke is inside in
 * Figma, so the border is an inset-ring.
 */
const inlineMessageVariants = cva(
  "flex w-full items-start gap-(--space-3) rounded-(--radius-md) p-(--space-4) text-(--color-text-primary) inset-ring-(length:--border-width-1)",
  {
    variants: {
      variant: {
        info: "bg-(--color-surface-info) inset-ring-(--color-border-info)",
        success: "bg-(--color-surface-success) inset-ring-(--color-border-success)",
        warning: "bg-(--color-surface-warning) inset-ring-(--color-border-warning)",
        error: "bg-(--color-surface-error) inset-ring-(--color-border-error)",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

type Variant = "info" | "success" | "warning" | "error"

const icons: Record<Variant, { name: IconName; className: string }> = {
  info: { name: "info", className: "text-(--color-icon-info)" },
  success: { name: "circle-check", className: "text-(--color-icon-success)" },
  warning: { name: "triangle-alert", className: "text-(--color-icon-warning)" },
  error: { name: "circle-alert", className: "text-(--color-icon-error)" },
}

type InlineMessageProps = Omit<React.ComponentProps<"div">, "title" | "children"> & {
  /** Status. Error is announced immediately; the others politely. */
  variant?: Variant
  /** Optional short title, Label/Medium (Figma `show title` = `title` is set). */
  title?: string
  /** The message, Body/Medium. Say what happened and what to do next. */
  message: string
}

/**
 * A status message in the page flow, with an icon, an optional title and a message.
 *
 * @figma Inline Message 143:140
 * @a11y error renders role="alert" (assertive: announced immediately); info, success and warning render role="status" (polite).
 * @a11y Render it when the event happens: live regions announce content that is added, not content already on the page at load.
 * @a11y The icon is decorative; the title or message must make the status clear without the colour or icon.
 */

function InlineMessage({
  className,
  variant = "info",
  title,
  message,
  ...props
}: InlineMessageProps) {
  const icon = icons[variant]

  return (
    <div
      data-slot="inline-message"
      data-variant={variant}
      role={variant === "error" ? "alert" : "status"}
      className={cn(inlineMessageVariants({ variant }), className)}
      {...props}
    >
      <span className="flex h-(--font-line-height-body) shrink-0 items-center">
        <Icon name={icon.name} className={icon.className} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
        {title && (
          // Label/Medium
          <p className="text-(length:--font-size-body) leading-(--font-line-height-body) font-medium">{title}</p>
        )}
        {/* Body/Medium */}
        <p className="text-(length:--font-size-body) leading-(--font-line-height-body) font-normal">{message}</p>
      </div>
    </div>
  )
}

export { InlineMessage, inlineMessageVariants, type InlineMessageProps }
