import * as React from "react"
import { cn } from "cn"
import { Check, ChevronDown, type LucideIcon } from "lucide-react"

/*
 * Figma: Icon (79:22). Lucide icons at 20px; `name` values are the Figma
 * variant values (Lucide names). Add a Figma variant first, then add it here.
 *
 * Figma draws the stroke at border-width-2 on the 20px frame. Lucide's
 * viewBox is 24, so a plain stroke-width of 2 would scale down to 1.67px:
 * non-scaling-stroke keeps it at exactly border-width-2.
 */
const icons = {
  "chevron-down": ChevronDown,
  check: Check,
} satisfies Record<string, LucideIcon>

type IconName = keyof typeof icons

const iconNames = Object.keys(icons) as IconName[]

type IconProps = Omit<React.ComponentProps<"svg">, "name"> & {
  /** Lucide icon name, as in the Figma Icon variants. */
  name: IconName
  /** Use the icon-disabled colour. */
  disabled?: boolean
}

/**
 * A 20px Lucide icon in the Slot icon colours.
 *
 * @figma Icon 79:22
 * @a11y Decorative by default (aria-hidden). Pass aria-label to make it a meaningful image (role="img").
 */

function Icon({ name, disabled = false, className, ...props }: IconProps) {
  const Glyph = icons[name]
  const labelled = props["aria-label"] != null || props["aria-labelledby"] != null

  return (
    <Glyph
      data-slot="icon"
      data-name={name}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      className={cn(
        "size-5 shrink-0 stroke-(length:--border-width-2) [&_*]:[vector-effect:non-scaling-stroke]",
        disabled ? "text-(--color-icon-disabled)" : "text-(--color-icon-default)",
        className
      )}
      {...props}
    />
  )
}

export { Icon, iconNames, type IconName, type IconProps }
