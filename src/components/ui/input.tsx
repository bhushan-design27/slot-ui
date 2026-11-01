import * as React from "react"
import { cn } from "cn"

/*
 * Figma: Input (27:14). label / placeholder / helper are text props;
 * state maps to: Focus = :focus-visible, Error = `invalid` (aria-invalid),
 * Disabled = the native attribute.
 *
 * The field stroke is inside and excluded from layout in Figma, so it is an
 * inset-ring: the 2px Focus stroke doesn't shift the text, and the field
 * stays 48px tall.
 */
type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
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
 * A single-line text field with label and helper text, 48px tall.
 *
 * @figma Input 27:14
 * @states Default, Focus, Error, Disabled
 * @a11y The label is a <label for>, so clicking it focuses the field and screen readers announce it.
 * @a11y Helper text is linked with aria-describedby; in the Error state it should say how to fix the problem.
 * @a11y Error sets aria-invalid; helper text stays text-secondary when disabled (WCAG contrast).
 */

function Input({
  className,
  id,
  label,
  helper,
  invalid = false,
  disabled,
  type = "text",
  ...props
}: InputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const helperId = helper ? `${inputId}-helper` : undefined

  return (
    <div
      data-slot="input"
      className={cn("flex w-full flex-col items-start gap-(--space-2)", className)}
    >
      {label && (
        // Label/Small
        <label
          htmlFor={inputId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium",
            disabled ? "text-(--color-text-disabled)" : "text-(--color-text-primary)"
          )}
        >
          {label}
        </label>
      )}
      {/* Body/Medium */}
      <input
        id={inputId}
        type={type}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={helperId}
        className={cn(
          "w-full min-w-0 rounded-(--radius-md) px-(--space-4) py-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body) font-normal outline-none",
          "bg-(--color-surface-field) text-(--color-text-primary) placeholder:text-(--color-text-placeholder)",
          "inset-ring-(length:--border-width-1) inset-ring-(--color-border-field)",
          "aria-invalid:inset-ring-(--color-border-error)",
          "focus-visible:inset-ring-(length:--border-width-2) focus-visible:inset-ring-(--color-border-focus)",
          "aria-invalid:focus-visible:inset-ring-(--color-border-error)",
          "disabled:cursor-not-allowed disabled:bg-(--color-surface-disabled) disabled:text-(--color-text-disabled) disabled:placeholder:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)"
        )}
        {...props}
      />
      {helper && (
        // Body/Small
        <p
          id={helperId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-normal",
            // Helper text keeps text-secondary when disabled: it often
            // explains why the field is disabled.
            invalid && !disabled ? "text-(--color-text-error)" : "text-(--color-text-secondary)"
          )}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

export { Input, type InputProps }
