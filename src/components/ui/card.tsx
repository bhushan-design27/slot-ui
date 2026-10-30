import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

/*
 * Figma: Card (74:40). `title` is the Heading/Small title, `elevation`
 * maps 1:1, children fill the content slot (stacked with space-2, like the
 * Figma content frame).
 *
 * The border is an inset-ring so the space-6 padding matches Figma exactly.
 * Raised = the Figma drop shadow (0, shadow-offset-sm, blur shadow-blur-md,
 * color shadow-raised); it composes with the inset-ring box-shadow.
 *
 * A plain div, not <section>: a labelled section is a landmark, and a list
 * of cards would flood the landmark list with duplicates.
 */
const cardVariants = cva(
  "flex flex-col items-start gap-(--space-4) rounded-(--radius-md) bg-(--color-surface-page) p-(--space-6) text-(--color-text-primary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-subtle)",
  {
    variants: {
      elevation: {
        flat: "",
        raised: "shadow-[0_var(--shadow-offset-sm)_var(--shadow-blur-md)_0_var(--color-shadow-raised)]",
      },
    },
    defaultVariants: {
      elevation: "flat",
    },
  }
)

type CardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title?: string
  elevation?: "flat" | "raised"
}

function Card({ className, title, elevation = "flat", children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-elevation={elevation}
      className={cn(cardVariants({ elevation }), className)}
      {...props}
    >
      {title && (
        // Heading/Small
        <h2
          className="w-full text-(length:--font-size-heading-sm) leading-(--font-line-height-heading-sm) font-semibold"
        >
          {title}
        </h2>
      )}
      {children != null && (
        <div data-slot="card-content" className="flex w-full flex-col items-start gap-(--space-2)">
          {children}
        </div>
      )}
    </div>
  )
}

export { Card, cardVariants, type CardProps }
