/**
 * Shared helpers for reading tokens/slot.tokens.json (W3C DTCG format).
 * Used by scripts/build-tokens.ts and the Foundations stories, so CSS
 * variable naming is defined in one place.
 */

export type ColorValue = {
  colorSpace: 'srgb'
  components: [number, number, number]
  alpha: number
  hex: string
}
export type DimensionValue = { value: number; unit: 'px' | 'rem' }
export type TokenValue = string | ColorValue | DimensionValue

export type FigmaExtension = {
  collection: string
  scopes: string[]
  codeSyntax: { WEB?: string }
}

export type Token = {
  $type: 'color' | 'dimension' | 'fontFamily'
  $value: TokenValue
  $description?: string
  $extensions?: { 'com.figma'?: FigmaExtension }
}

export type TokenGroup = { [key: string]: TokenGroup | Token | string | undefined }

export type FlatToken = {
  /** Figma variable path, e.g. ["color", "text", "primary"] */
  path: string[]
  token: Token
  /** CSS custom property name, e.g. "--color-text-primary" */
  cssName: string
  /** true when Figma has no WEB code syntax and the name was derived from the path */
  derived: boolean
  collection: string
}

const isToken = (node: unknown): node is Token =>
  typeof node === 'object' && node !== null && '$value' in node

/**
 * CSS name = the Figma WEB code syntax ("var(--color-text-primary)").
 * Fallback when it is missing: path segments joined with "-".
 */
export function cssNameFor(path: string[], token: Token): { cssName: string; derived: boolean } {
  const web = token.$extensions?.['com.figma']?.codeSyntax.WEB
  const match = web?.match(/^var\((--[a-z0-9-]+)\)$/)
  return match ? { cssName: match[1], derived: false } : { cssName: `--${path.join('-')}`, derived: true }
}

/** Accepts any parsed DTCG JSON (e.g. a JSON module import) and returns its tokens in document order. */
export function flattenTokens(group: object, path: string[] = [], out: FlatToken[] = []): FlatToken[] {
  for (const [key, node] of Object.entries(group as TokenGroup)) {
    if (key.startsWith('$') || typeof node !== 'object' || node === null) continue
    const nodePath = [...path, key]
    if (isToken(node)) {
      out.push({
        path: nodePath,
        token: node,
        ...cssNameFor(nodePath, node),
        collection: node.$extensions?.['com.figma']?.collection ?? 'Other',
      })
    } else {
      flattenTokens(node, nodePath, out)
    }
  }
  return out
}

/** "{color.slate.900}" -> "color.slate.900", or null when the value is not an alias. */
export function aliasTarget(value: TokenValue): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/^\{(.+)\}$/)
  return match ? match[1] : null
}
