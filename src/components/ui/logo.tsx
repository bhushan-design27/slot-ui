import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

/*
 * Figma: Logo (133:123). Three stacked, centred ellipses ("balanced
 * stones") in a square mark: 40px (medium) or 24px (small). The 40x33
 * stack is centred in the 40 viewBox, so the stones just touch:
 * top 18x9, middle 28x11, bottom 40x13. Small is the same drawing
 * scaled to 24px, as in Figma.
 *
 * Lockup = mark + the "Slot" wordmark (Inter Semi Bold, text-primary):
 * Heading/Large size next to the 40px mark, Heading/Small size next to
 * the 24px mark (sizes only; the logo isn't a heading).
 */
const logoVariants = cva("inline-flex shrink-0 items-center", {
  variants: {
    size: {
      small: "gap-(--space-2)",
      medium: "gap-(--space-3)",
    },
  },
  defaultVariants: {
    size: "medium",
  },
})

const markSize = {
  small: "size-6",
  medium: "size-10",
} as const

const wordmarkSize = {
  small: "text-(length:--font-size-heading-sm) leading-(--font-line-height-heading-sm)",
  medium: "text-(length:--font-size-heading) leading-(--font-line-height-heading)",
} as const

type LogoProps = React.ComponentProps<"span"> & {
  /** lockup = mark plus the "Slot" wordmark; mark = the stones only. */
  variant?: "lockup" | "mark"
  /** small = 24px mark; medium = 40px mark. */
  size?: "small" | "medium"
}

/**
 * The Slot logo: three balanced stones, with or without the "Slot" wordmark.
 *
 * @figma Logo 133:123
 * @a11y lockup: the visible "Slot" wordmark is the accessible name; the mark is decorative (aria-hidden).
 * @a11y mark: rendered as role="img" with aria-label="Slot"; pass aria-label to change the name.
 * @a11y Inside a link, the logo is the link's name, so the link needs no extra label.
 */

function Logo({
  className,
  variant = "lockup",
  size = "medium",
  ...props
}: LogoProps) {
  const isMark = variant === "mark"

  return (
    <span
      data-slot="logo"
      data-variant={variant}
      data-size={size}
      role={isMark ? "img" : undefined}
      aria-label={isMark ? "Slot" : undefined}
      className={cn(logoVariants({ size }), className)}
      {...props}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        focusable="false"
        className={cn("shrink-0", markSize[size])}
      >
        <ellipse cx="20" cy="8" rx="9" ry="4.5" className="fill-(--color-brand-mark)" />
        <ellipse cx="20" cy="18" rx="14" ry="5.5" className="fill-(--color-brand-mark-strong)" />
        <ellipse cx="20" cy="30" rx="20" ry="6.5" className="fill-(--color-brand-mark)" />
      </svg>
      {!isMark && (
        <span className={cn("font-semibold text-(--color-text-primary)", wordmarkSize[size])}>
          Slot
        </span>
      )}
    </span>
  )
}

export { Logo, logoVariants, type LogoProps }
