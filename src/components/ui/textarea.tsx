import * as React from "react"
import { cn } from "cn"

/*
 * Figma: Textarea (115:58). Same anatomy and states as Input (label /
 * placeholder / helper text props; Focus = :focus-visible, Error =
 * `invalid` (aria-invalid), Disabled = the native attribute), with a
 * multi-line field that is at least layout-textarea-min-height (120px:
 * 4 Body/Medium lines plus space-3 padding) and grows vertically.
 *
 * The field stroke is an inset-ring, like Input, so the 2px Focus stroke
 * doesn't shift the text.
 */
type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Visible label, Label/Small. */
  label?: string
  /** Example input shown while empty. Never a replacement for the label. */
  placeholder?: string
  /** Helper text under the field; turns error red when invalid. */
  helper?: string
  /** Figma Error state. Rendered as aria-invalid. */
  invalid?: boolean
  /** Figma Disabled state. Native attribute. */
  disabled?: boolean
}

/**
 * A multi-line text field with label and helper text, at least 120px tall.
 *
 * @figma Textarea 115:58
 * @states Default, Focus, Error, Disabled
 * @a11y The label is a <label for>, so clicking it focuses the field and screen readers announce it.
 * @a11y Helper text is linked with aria-describedby; in the Error state it should say how to fix the problem.
 * @a11y Error sets aria-invalid; helper text stays text-secondary when disabled (WCAG contrast).
 * @a11y Mark optional fields in the label ("(optional)"), not only in the helper.
 */

function Textarea({
  className,
  id,
  label,
  helper,
  invalid = false,
  disabled,
  ...props
}: TextareaProps) {
  const generatedId = React.useId()
  const textareaId = id ?? generatedId
  const helperId = helper ? `${textareaId}-helper` : undefined

  return (
    <div
      data-slot="textarea"
      className={cn("flex w-full flex-col items-start gap-(--space-2)", className)}
    >
      {label && (
        // Label/Small
        <label
          htmlFor={textareaId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium",
            disabled ? "text-(--color-text-disabled)" : "text-(--color-text-primary)"
          )}
        >
          {label}
        </label>
      )}
      {/* Body/Medium */}
      <textarea
        id={textareaId}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={helperId}
        className={cn(
          "block min-h-(--layout-textarea-min-height) w-full min-w-0 resize-y rounded-(--radius-md) px-(--space-4) py-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body) font-normal outline-none",
          "bg-(--color-surface-field) text-(--color-text-primary) placeholder:text-(--color-text-placeholder)",
          "inset-ring-(length:--border-width-1) inset-ring-(--color-border-field)",
          "aria-invalid:inset-ring-(--color-border-error)",
          "focus-visible:inset-ring-(length:--border-width-2) focus-visible:inset-ring-(--color-border-focus)",
          "aria-invalid:focus-visible:inset-ring-(--color-border-error)",
          "disabled:cursor-not-allowed disabled:resize-none disabled:bg-(--color-surface-disabled) disabled:text-(--color-text-disabled) disabled:placeholder:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)"
        )}
        {...props}
      />
      {helper && (
        // Body/Small
        <p
          id={helperId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-normal",
            invalid && !disabled ? "text-(--color-text-error)" : "text-(--color-text-secondary)"
          )}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

export { Textarea, type TextareaProps }
