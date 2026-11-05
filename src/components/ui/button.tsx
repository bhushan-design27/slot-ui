import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"
import { Icon, type IconName } from "@/components/ui/icon"

/*
 * Figma: Button (12:54). variant × size map to props; state is CSS:
 * Hover = :hover, Focus = :focus-visible, Disabled = the native attribute.
 *
 * Figma strokes are inside and excluded from layout, so borders are drawn
 * with inset-ring (box-shadow) rather than `border`: padding stays exactly
 * the Figma padding and heights land on 36 / 48 / 56.
 *
 * Focus ring: Figma draws it as two drop shadows (a surface-page gap under
 * a border-focus ring). In code it is an outline with outline-offset, both
 * border-width-2: same geometry, but the gap is transparent, so it works on
 * any background. Only colours transition (not outline-color, which
 * `transition-colors` includes), so the ring appears instantly.
 *
 * size="icon" (Figma size=Icon): a 36x36 square, space-2 padding around a
 * 20px Icon. The Figma `label` property is its accessible name, so in code
 * `aria-label` is required (TypeScript fails without it) and there are no
 * children. The icon uses currentColor, i.e. the label colour of each
 * state; Figma binds the matching icon tokens (icon/on-action,
 * icon/action, icon/action-hover, icon/disabled, icon/on-disabled).
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-(--space-2) rounded-(--radius-md) font-medium whitespace-nowrap select-none outline-none transition-[color,background-color,border-color,text-decoration-color,fill,stroke]",
    "focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-(--color-action-primary) text-(--color-text-on-action)",
          "enabled:hover:bg-(--color-action-primary-hover)",
          "disabled:bg-(--color-action-disabled) disabled:text-(--color-text-on-disabled)",
        ],
        secondary: [
          "bg-(--color-action-secondary) text-(--color-text-action) inset-ring-(length:--border-width-1) inset-ring-(--color-border-action)",
          "enabled:hover:bg-(--color-action-secondary-hover) enabled:hover:text-(--color-text-action-hover) enabled:hover:inset-ring-(--color-border-action-hover)",
          "disabled:text-(--color-text-disabled) disabled:inset-ring-(--color-border-disabled)",
        ],
        danger: [
          "bg-(--color-action-danger) text-(--color-text-on-action)",
          "enabled:hover:bg-(--color-action-danger-hover)",
          "disabled:bg-(--color-action-disabled) disabled:text-(--color-text-on-disabled)",
        ],
      },
      size: {
        // Label/Small
        small:
          "px-(--space-3) py-(--space-2) text-(length:--font-size-small) leading-(--font-line-height-small)",
        // Label/Medium
        medium:
          "px-(--space-4) py-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body)",
        // Label/Medium
        large:
          "px-(--space-6) py-(--space-4) text-(length:--font-size-body) leading-(--font-line-height-body)",
        // 36 x 36: space-2 + 20px Icon + space-2
        icon: "p-(--space-2)",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  }
)

type ButtonBaseProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** Visual emphasis: primary, secondary or danger (destructive). */
  variant?: "primary" | "secondary" | "danger"
  /** Figma Disabled state. Native attribute. */
  disabled?: boolean
  /** Render the single child (e.g. a link) with button styles instead of a <button>. */
  asChild?: boolean
}

type LabelButtonProps = ButtonBaseProps & {
  /** Height 36 / 48 / 56; icon = a 36x36 icon-only button. */
  size?: "small" | "medium" | "large"
  /** The label. Sentence case. */
  children?: React.ReactNode
  icon?: never
}

type IconButtonProps = ButtonBaseProps & {
  /** Height 36 / 48 / 56; icon = a 36x36 icon-only button. */
  size: "icon"
  /** Icon-only buttons: the Lucide icon (Figma: the nested Icon's name). */
  icon: IconName
  /** Required for icon-only buttons: the accessible name, e.g. "Previous month" (Figma `label`). */
  "aria-label": string
  children?: never
}

/**
 * The implementation's props: one flat type, so react-docgen (the manifest)
 * can read every prop and value. Callers get the stricter overloads below.
 */
type ButtonProps = ButtonBaseProps & {
  /** Height 36 / 48 / 56; icon = a 36x36 icon-only button (needs `icon` and `aria-label`). */
  size?: "small" | "medium" | "large" | "icon"
  /** The label. Sentence case. Not used with size="icon". */
  children?: React.ReactNode
  /** Icon-only buttons: the Lucide icon (Figma: the nested Icon's name). */
  icon?: IconName
}

/**
 * An action the user can take.
 *
 * @figma Button 12:54
 * @states Default, Hover, Focus, Disabled
 * @a11y Renders a native <button> with type="button" by default, so it never submits a form by accident.
 * @a11y Disabled uses the native attribute: the button leaves the tab order and is announced as unavailable.
 * @a11y Focus ring: 2px border-focus outline, 2px from the button (transparent gap), on :focus-visible only.
 * @a11y size="icon" requires aria-label (enforced by the types); the icon itself is decorative.
 */

function Button(props: IconButtonProps): React.JSX.Element
function Button(props: LabelButtonProps): React.JSX.Element
function Button({
  className,
  variant = "primary",
  size = "medium",
  asChild = false,
  type = "button",
  icon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {icon ? <Icon name={icon} className="text-current" /> : children}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps }
