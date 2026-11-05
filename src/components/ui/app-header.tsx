import * as React from "react"
import { cn } from "cn"
import { Logo } from "@/components/ui/logo"

/*
 * Figma: App Header (143:148). Logo lockup (medium) on the left, the
 * "My bookings" link (Label/Medium, text-action) on the right, nothing
 * else. space-4 padding (72px tall), content max layout-content-max,
 * centred. The bottom stroke is inside in Figma, so it is an inset
 * box-shadow, not a border, to keep the 72px height.
 */
const focusRing =
  "rounded-(--radius-sm) outline-none focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)"

type AppHeaderProps = Omit<React.ComponentProps<"header">, "children"> & {
  /** Where the logo links to. */
  homeHref?: string
  /** Where "My bookings" links to. */
  bookingsHref?: string
}

/**
 * The app bar: the Slot logo (links home) and a "My bookings" link.
 *
 * @figma App Header 143:148
 * @a11y A <header> landmark (banner when it isn't inside main/article); the link is in a <nav aria-label="Main">.
 * @a11y The logo link's name is the visible wordmark, "Slot".
 */

function AppHeader({
  className,
  homeHref = "/",
  bookingsHref = "/bookings",
  ...props
}: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        "w-full bg-(--color-surface-page) p-(--space-4) shadow-[inset_0_calc(-1*var(--border-width-1))_0_0_var(--color-border-subtle)]",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-(--layout-content-max) items-center justify-between gap-(--space-4)">
        <a href={homeHref} className={cn("inline-flex", focusRing)}>
          <Logo variant="lockup" size="medium" />
        </a>
        <nav aria-label="Main">
          {/* Label/Medium */}
          <a
            href={bookingsHref}
            className={cn(
              "inline-flex text-(length:--font-size-body) leading-(--font-line-height-body) font-medium text-(--color-text-action) hover:text-(--color-text-action-hover) hover:underline",
              focusRing
            )}
          >
            My bookings
          </a>
        </nav>
      </div>
    </header>
  )
}

export { AppHeader, type AppHeaderProps }
