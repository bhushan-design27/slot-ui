import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

/*
 * Figma: Dialog (79:66) on the "dialog overlay" frame (79:74). Radix Dialog
 * (from shadcn/ui `dialog`) provides the behaviour: Escape and an overlay
 * click close it (via onOpenChange), focus is trapped inside while open and
 * returns to the trigger on close.
 *
 * Layout follows Figma: title, description and footer stacked with space-4,
 * space-6 padding, 480px wide (--spacing(120) = 120 × space-1), footer
 * actions right-aligned with space-3. Figma has no close (×) button, so the
 * shadcn one is removed; Escape and the footer actions close it.
 */
type DialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  footer?: React.ReactNode
  /** Optional extra content between the description and the footer. */
  children?: React.ReactNode
  /** Element that opens the dialog, e.g. a Button. Optional when `open` is controlled. */
  trigger?: React.ReactNode
  className?: string
}

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  footer,
  children,
  trigger,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className="fixed inset-0 z-50 bg-(--color-surface-overlay) duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Content
          data-slot="dialog"
          // Without a description, tell Radix there's nothing to describe the dialog.
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex w-120 max-w-[calc(100%-var(--space-8))] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-(--space-4) rounded-(--radius-md) p-(--space-6) outline-none",
            "bg-(--color-surface-page) text-(--color-text-primary) inset-ring-(length:--border-width-1) inset-ring-(--color-border-subtle)",
            "shadow-[0_var(--shadow-offset-sm)_var(--shadow-blur-md)_0_var(--color-shadow-raised)]",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
        >
          {/* Heading/Small */}
          <DialogPrimitive.Title
            data-slot="dialog-title"
            className="w-full text-(length:--font-size-heading-sm) leading-(--font-line-height-heading-sm) font-semibold"
          >
            {title}
          </DialogPrimitive.Title>
          {description && (
            // Body/Medium
            <DialogPrimitive.Description
              data-slot="dialog-description"
              className="w-full text-(length:--font-size-body) leading-(--font-line-height-body) font-normal text-(--color-text-secondary)"
            >
              {description}
            </DialogPrimitive.Description>
          )}
          {children}
          {footer && (
            <div
              data-slot="dialog-footer"
              className="flex w-full flex-wrap items-center justify-end gap-(--space-3)"
            >
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Closes the dialog when its child is activated, e.g. `<DialogClose asChild><Button>…</Button></DialogClose>`. */
const DialogClose = DialogPrimitive.Close

export { Dialog, DialogClose, type DialogProps }
