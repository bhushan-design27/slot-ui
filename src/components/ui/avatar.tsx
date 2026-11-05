import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

/*
 * Figma: Avatar (143:147). `size` Small = 32, Large = 64. `initials`
 * (text property) defaults to the first letters of `name`; Figma
 * `show image` = `src` is set (and loaded). If the image fails to load,
 * the initials show, like show image = false.
 */
const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-(--radius-full) bg-(--color-surface-neutral) font-medium text-(--color-text-neutral) select-none",
    // The border-subtle ring sits above the image, like the Figma inside stroke.
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-(--radius-full) after:inset-ring-(length:--border-width-1) after:inset-ring-(--color-border-subtle)",
  ],
  {
    variants: {
      size: {
        // Label/Small
        small: "size-8 text-(length:--font-size-small) leading-(--font-line-height-small)",
        // Label/Medium
        large: "size-16 text-(length:--font-size-body) leading-(--font-line-height-body)",
      },
    },
    defaultVariants: {
      size: "small",
    },
  }
)

function initialsFrom(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return letters.map((word) => word[0]?.toUpperCase() ?? "").join("")
}

type AvatarProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The person's name: the accessible name, and the source of the initials. */
  name: string
  /** Image URL (Figma `show image` = `src` is set). */
  src?: string
  /** Initials shown without an image. Defaults to the first letters of `name`. */
  initials?: string
  /** small = 32px, large = 64px. */
  size?: "small" | "large"
  /** Set when the name is shown next to the avatar: hides it from assistive tech. */
  decorative?: boolean
}

/**
 * A round image of a person, with an initials fallback.
 *
 * @figma Avatar 143:147
 * @a11y decorative: aria-hidden, for when the name is visible next to it (so it isn't read twice).
 * @a11y Otherwise role="img" with aria-label={name}; the image itself has empty alt, so the name is read once.
 */

function Avatar({
  className,
  name,
  src,
  initials,
  size = "small",
  decorative = false,
  ...props
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const showImage = src != null && src !== failedSrc

  return (
    <span
      data-slot="avatar"
      data-size={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {initials ?? initialsFrom(name)}
      {showImage && (
        <img
          src={src}
          alt=""
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  )
}

export { Avatar, avatarVariants, type AvatarProps }
