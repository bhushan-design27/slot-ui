import * as React from "react"
import { cn } from "cn"
import { Icon } from "@/components/ui/icon"

/*
 * Figma: Step Indicator (145:279), built from Step (145:123).
 * `current` maps 1:1. Figma `viewport` is a CSS breakpoint, not a prop
 * (like Hover / Focus): Mobile below sm (640px) shows segments
 * (border-width-4 tall, space-1 apart) and "Step n of 5 · Label";
 * Desktop shows every Step: a 24px marker + label, space-6 apart.
 *
 * Step `status`: Completed = action-primary marker with a check,
 * Current = border-action ring (border-width-2) + Label/Small label,
 * Upcoming = border-control ring (border-width-1), text-secondary.
 *
 * One <ol> serves both layouts, so assistive tech always gets the full
 * list; the mobile summary line is aria-hidden (it repeats the list).
 */
const steps = ["Service", "Therapist", "Time", "Details", "Review"] as const

type StepIndicatorProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The current step, 1 (Service) to 5 (Review). */
  current: 1 | 2 | 3 | 4 | 5
}

/**
 * Booking progress through Service, Therapist, Time, Details and Review.
 *
 * @figma Step Indicator 145:279
 * @a11y An ordered list (aria-label "Booking steps"); the current step has aria-current="step".
 * @a11y Completed steps are prefixed "Completed:" for screen readers; markers and segments are decorative.
 * @a11y On phones the labels are visually hidden but still read, so the list stays complete.
 */

function StepIndicator({ className, current, ...props }: StepIndicatorProps) {
  return (
    <div
      data-slot="step-indicator"
      className={cn("flex w-full flex-col gap-(--space-2) sm:w-auto", className)}
      {...props}
    >
      <ol aria-label="Booking steps" className="flex w-full gap-(--space-1) sm:w-auto sm:items-center sm:gap-(--space-6)">
        {steps.map((label, index) => {
          const number = index + 1
          const status = number < current ? "completed" : number === current ? "current" : "upcoming"
          return (
            <li
              key={label}
              data-status={status}
              aria-current={status === "current" ? "step" : undefined}
              className="flex flex-1 items-center gap-(--space-2) sm:flex-none"
            >
              <span
                aria-hidden
                className={cn(
                  "h-(--border-width-4) w-full rounded-(--radius-full) sm:hidden",
                  number <= current ? "bg-(--color-action-primary)" : "bg-(--color-surface-track)"
                )}
              />
              <span
                aria-hidden
                className={cn(
                  // Label/Small
                  "hidden size-6 shrink-0 items-center justify-center rounded-(--radius-full) text-(length:--font-size-small) leading-(--font-line-height-small) font-medium sm:flex",
                  status === "completed" && "bg-(--color-action-primary)",
                  status === "current" &&
                    "bg-(--color-surface-page) text-(--color-text-action) inset-ring-(length:--border-width-2) inset-ring-(--color-border-action)",
                  status === "upcoming" &&
                    "bg-(--color-surface-page) text-(--color-text-secondary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-control)"
                )}
              >
                {status === "completed" ? <Icon name="check" className="text-(--color-icon-on-action)" /> : number}
              </span>
              <span
                className={cn(
                  "sr-only text-(length:--font-size-small) leading-(--font-line-height-small) whitespace-nowrap sm:not-sr-only",
                  // Label/Small for the current step, Body/Small otherwise
                  status === "current" ? "font-medium text-(--color-text-primary)" : "font-normal",
                  status === "completed" && "text-(--color-text-primary)",
                  status === "upcoming" && "text-(--color-text-secondary)"
                )}
              >
                {status === "completed" && <span className="sr-only">Completed: </span>}
                {label}
              </span>
            </li>
          )
        })}
      </ol>
      {/* Label/Small */}
      <p
        aria-hidden
        className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-primary) sm:hidden"
      >
        Step {current} of {steps.length} · {steps[current - 1]}
      </p>
    </div>
  )
}

export { StepIndicator, steps as stepIndicatorSteps, type StepIndicatorProps }
