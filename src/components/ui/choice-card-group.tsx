import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { Avatar } from "@/components/ui/avatar"
import { Icon, type IconName } from "@/components/ui/icon"

/*
 * Figma: Choice Card Group (173:352) + Choice Card (172:322). A Radix
 * RadioGroup, like RadioGroup: one Tab stop, arrow keys move and select,
 * Space selects. Group: label / cards / helper stacked with space-2, cards
 * with space-3. Error = `invalid`: helper in text-error and the
 * border-width-2 bar 14px OUTSIDE the box, as RadioGroup.
 *
 * Card: space-4 padding, space-3 gaps, radius-md; 76px with a title and a
 * description (exempt from the 36/48/56 scale, CLAUDE.md). Borders are
 * inset-rings (Figma strokes are inside). Selected (Figma `selected`,
 * Radix data-state=checked) = surface-selected tint, a border-width-2
 * border-selected ring and the check; the 20px check slot is always
 * reserved, so selecting never moves the detail. Figma `show avatar` =
 * `avatar` is set, `show icon` = `icon` is set, `show detail` = `detail`.
 */

type ChoiceCardGroupProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Root>,
  "orientation" | "dir" | "children"
> & {
  /** Visible group label, Label/Small, e.g. "Choose a service". */
  label?: string
  /** Helper text under the cards; turns error red when invalid. */
  helper?: string
  /** Figma Error state: helper in text-error plus the error bar. Rendered as aria-invalid. */
  invalid?: boolean
  /** Figma Disabled state: every card is disabled. */
  disabled?: boolean
  /** The ChoiceCards. */
  children?: React.ReactNode
}

/**
 * A radio group of large selectable cards: pick one service or one therapist.
 *
 * @figma Choice Card Group 173:352
 * @states Default, Error, Disabled
 * @a11y role="radiogroup" labelled by the visible label; helper text is linked with aria-describedby; Error sets aria-invalid on the group.
 * @a11y Keyboard: one Tab stop (the selected card, else the first); arrow keys move between cards and select them; Space selects the focused card.
 * @a11y Continue sits outside the group, as the next Tab stop.
 */

function ChoiceCardGroup({
  label,
  helper,
  invalid = false,
  disabled = false,
  id,
  className,
  children,
  ...props
}: ChoiceCardGroupProps) {
  const generatedId = React.useId()
  const groupId = id ?? generatedId
  const labelId = label ? `${groupId}-label` : undefined
  const helperId = helper ? `${groupId}-helper` : undefined

  return (
    <div
      data-slot="choice-card-group-field"
      className={cn(
        "relative flex w-full flex-col items-start gap-(--space-2)",
        invalid && !disabled && [
          "before:absolute before:inset-y-0 before:left-[calc(-1*(var(--border-width-2)+var(--space-3)))]",
          "before:border-l-(length:--border-width-2) before:border-(--color-border-error)",
        ],
        className
      )}
    >
      {label && (
        // Label/Small
        <span
          id={labelId}
          className={cn(
            "w-full text-(length:--font-size-small) leading-(--font-line-height-small) font-medium",
            disabled ? "text-(--color-text-disabled)" : "text-(--color-text-primary)"
          )}
        >
          {label}
        </span>
      )}
      <RadioGroupPrimitive.Root
        id={groupId}
        data-slot="choice-card-group"
        aria-labelledby={labelId}
        aria-describedby={helperId}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="flex w-full flex-col gap-(--space-3)"
        {...props}
      >
        {children}
      </RadioGroupPrimitive.Root>
      {helper && (
        // Body/Small. Helper text keeps text-secondary when disabled.
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

type ChoiceCardProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  "title" | "children" | "asChild"
> & {
  /** The choice, Label/Medium: a service or a therapist's name. */
  title: string
  /** Supporting text, Body/Small text-secondary. */
  description: string
  /** Optional trailing detail, Label/Medium, e.g. a price (Figma `show detail`). */
  detail?: string
  /** Optional leading person (Figma `show avatar`); decorative, the title names them. */
  avatar?: { name: string; src?: string }
  /** Optional leading icon tile when there's no person, e.g. "users" (Figma `show icon`). */
  icon?: IconName
}

/**
 * One card in a ChoiceCardGroup: title, description, optional avatar or icon and detail.
 *
 * @figma Choice Card 172:322
 * @states Default, Hover, Focus, Disabled
 * @a11y Figma `selected` is the group's `value` (not a prop on the card), announced from aria-checked.
 * @a11y A role="radio" button named by its title; the description and detail are its accessible description.
 * @a11y The avatar, icon tile and check are decorative; Selected is announced from aria-checked.
 */

function ChoiceCard({
  className,
  title,
  description,
  detail,
  avatar,
  icon,
  id,
  ...props
}: ChoiceCardProps) {
  const generatedId = React.useId()
  const baseId = id ?? generatedId
  const describedBy = [`${baseId}-description`, detail ? `${baseId}-detail` : null].filter(Boolean).join(" ")

  return (
    <RadioGroupPrimitive.Item
      id={id}
      data-slot="choice-card"
      aria-labelledby={`${baseId}-title`}
      aria-describedby={describedBy}
      className={cn(
        "group/card relative flex w-full items-center gap-(--space-3) rounded-(--radius-md) p-(--space-4) text-left outline-none select-none transition-[color,background-color]",
        "bg-(--color-surface-page) inset-ring-(length:--border-width-1) inset-ring-(--color-border-control)",
        "enabled:data-[state=unchecked]:hover:bg-(--color-surface-hover) enabled:data-[state=unchecked]:hover:inset-ring-(--color-border-action-hover)",
        "data-[state=checked]:inset-ring-(length:--border-width-2)",
        "enabled:data-[state=checked]:bg-(--color-surface-selected) enabled:data-[state=checked]:inset-ring-(--color-border-selected)",
        "enabled:data-[state=checked]:hover:inset-ring-(--color-border-selected-hover)",
        "focus-visible:outline-solid focus-visible:outline-(length:--border-width-2) focus-visible:outline-offset-(length:--border-width-2) focus-visible:outline-(--color-border-focus)",
        "disabled:cursor-not-allowed disabled:bg-(--color-surface-disabled) disabled:inset-ring-(--color-border-disabled)",
        className
      )}
      {...props}
    >
      {avatar ? (
        <Avatar name={avatar.name} src={avatar.src} size="small" decorative />
      ) : icon ? (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-surface-neutral) inset-ring-(length:--border-width-1) inset-ring-(--color-border-subtle)"
        >
          <Icon name={icon} className="group-disabled/card:text-(--color-icon-disabled)" />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        {/* Label/Medium */}
        <span
          id={`${baseId}-title`}
          className="text-(length:--font-size-body) leading-(--font-line-height-body) font-medium text-(--color-text-primary) group-disabled/card:text-(--color-text-disabled)"
        >
          {title}
        </span>
        {/* Body/Small. Supporting text keeps text-secondary when disabled. */}
        <span
          id={`${baseId}-description`}
          className="text-(length:--font-size-small) leading-(--font-line-height-small) font-normal text-(--color-text-secondary)"
        >
          {description}
        </span>
      </span>
      {detail && (
        // Label/Medium
        <span
          id={`${baseId}-detail`}
          className="shrink-0 text-(length:--font-size-body) leading-(--font-line-height-body) font-medium text-(--color-text-primary) group-disabled/card:text-(--color-text-disabled)"
        >
          {detail}
        </span>
      )}
      {/* Check slot: always 20px, so selecting never shifts the detail. */}
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-(--radius-full) group-data-[state=checked]/card:bg-(--color-action-selected) group-disabled/card:group-data-[state=checked]/card:bg-(--color-action-disabled)"
      >
        <RadioGroupPrimitive.Indicator className="flex">
          <Icon name="check" className="text-(--color-icon-on-action) group-disabled/card:text-(--color-icon-on-disabled)" />
        </RadioGroupPrimitive.Indicator>
      </span>
    </RadioGroupPrimitive.Item>
  )
}

export { ChoiceCardGroup, ChoiceCard, type ChoiceCardGroupProps, type ChoiceCardProps }
