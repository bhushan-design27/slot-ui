import * as React from "react"
import { cn } from "cn"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { Icon } from "@/components/ui/icon"

/*
 * Figma: Disclosure (117:91). `summary` is the trigger text and `detail`
 * the optional second line (Figma `show detail` = `detail` is set);
 * children fill the `content` slot. state maps to: Hover = :hover, Focus =
 * :focus-visible, Open = the `open` prop (controlled) or `defaultOpen`.
 *
 * The border is drawn by an ::after overlay (inset-ring), not on the root,
 * so the trigger's hover background can't cover it, the same as the Figma
 * stroke sitting above the fill. The trigger is 48px tall with the summary
 * only (space-3 + Body/Medium + space-3) and 68px with a detail line
 * (+ Body/Small).
 * The focus outline sits on the trigger, 2px outside, like the Figma
 * focus ring; space-1 above the content keeps that outline clear of it.
 */
type DisclosureProps = Omit<
  React.ComponentProps<typeof CollapsiblePrimitive.Root>,
  "children" | "asChild"
> & {
  /** The trigger text: a short summary of what expands. Sentence case. */
  summary: string
  /** Optional second line under the summary, Body/Small in text-secondary. */
  detail?: string
  /** Figma Open state (controlled). */
  open?: boolean
  /** Initially open when uncontrolled. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Content slot, shown when open, stacked with space-3. */
  children?: React.ReactNode
}

/**
 * A row with a summary and optional detail line that expands to show more content below it.
 *
 * @figma Disclosure 117:91
 * @states Default, Hover, Focus, Open
 * @a11y The trigger is a native <button> with aria-expanded and aria-controls pointing at the content.
 * @a11y The visible summary and detail line are the button's accessible name (no aria-label, so the name always contains the visible text), so it should make sense on its own; the chevron is decorative.
 * @a11y Closed content is removed from the accessibility tree, so don't put the only copy of required information inside.
 */

function Disclosure({
  className,
  summary,
  detail,
  children,
  ...props
}: DisclosureProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="disclosure"
      className={cn(
        "group/disclosure relative w-full rounded-(--radius-md) bg-(--color-surface-page) text-(--color-text-primary)",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-(--radius-md) after:inset-ring-(length:--border-width-1) after:inset-ring-(--color-border-subtle)",
        className
      )}
      {...props}
    >
      <CollapsiblePrimitive.Trigger
        data-slot="disclosure-trigger"
        className={cn(
          // Body/Medium
          "flex w-full cursor-pointer items-center gap-(--space-2) rounded-(--radius-md) px-(--space-4) py-(--space-3) text-left text-(length:--font-size-body) leading-(--font-line-height-body) font-normal outline-none",
          "hover:bg-(--color-surface-hover)",
          "focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)"
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span>{summary}</span>
          {detail && (
            // Body/Small
            <span className="text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
              {detail}
            </span>
          )}
        </span>
        <Icon
          name="chevron-down"
          className="group-data-[state=open]/disclosure:rotate-180"
        />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content
        data-slot="disclosure-content"
        className="flex flex-col gap-(--space-3) px-(--space-4) pt-(--space-1) pb-(--space-4)"
      >
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Disclosure, type DisclosureProps }
