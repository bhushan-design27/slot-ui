import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import tokenTree from '../../tokens/slot.tokens.json'
import { aliasTarget, flattenTokens, type FlatToken } from '@/lib/tokens'

const tokens = flattenTokens(tokenTree)
const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]))

function describe(t: FlatToken): string {
  const alias = aliasTarget(t.token.$value)
  if (alias) return `→ ${byPath.get(alias)?.path.join('/') ?? alias}`
  const value = t.token.$value
  if (typeof value === 'string') return value
  return 'hex' in value ? value.hex : `${value.value}${value.unit}`
}

function TokenTable({ items, preview }: { items: FlatToken[]; preview: (t: FlatToken) => ReactNode }) {
  return (
    <table className="w-full border-collapse text-(length:--font-size-small) leading-(--font-line-height-small)">
      <thead>
        <tr className="text-left text-(--color-text-secondary)">
          <th className="py-(--space-2) pr-(--space-4) font-medium">Preview</th>
          <th className="py-(--space-2) pr-(--space-4) font-medium">Figma variable</th>
          <th className="py-(--space-2) pr-(--space-4) font-medium">CSS variable</th>
          <th className="py-(--space-2) font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        {items.map((t) => (
          <tr key={t.cssName} className="border-t border-(--color-border-subtle) text-(--color-text-primary)">
            <td className="py-(--space-2) pr-(--space-4)">{preview(t)}</td>
            <td className="py-(--space-2) pr-(--space-4)">{t.path.join('/')}</td>
            <td className="py-(--space-2) pr-(--space-4) font-mono">
              {t.cssName}
              {t.derived && <span className="ml-(--space-2) text-(--color-text-secondary)">(no Figma code syntax)</span>}
            </td>
            <td className="py-(--space-2) font-mono text-(--color-text-secondary)">{describe(t)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const swatch = (t: FlatToken) => (
  <div
    className="size-(--space-8) rounded-(--radius-sm) border border-(--color-border-subtle)"
    style={{ background: `var(${t.cssName})` }}
  />
)

const meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SemanticColors: Story = {
  render: () => (
    <TokenTable items={tokens.filter((t) => t.collection === 'Semantic' && t.token.$type === 'color')} preview={swatch} />
  ),
}

export const PrimitiveColors: Story = {
  render: () => (
    <TokenTable items={tokens.filter((t) => t.collection === 'Primitives' && t.token.$type === 'color')} preview={swatch} />
  ),
}

export const Spacing: Story = {
  render: () => (
    <TokenTable
      items={tokens.filter((t) => t.path[0] === 'space')}
      preview={(t) => <div className="h-(--space-4) bg-(--color-action-primary)" style={{ width: `var(${t.cssName})` }} />}
    />
  ),
}

export const Radius: Story = {
  render: () => (
    <TokenTable
      items={tokens.filter((t) => t.path[0] === 'radius')}
      preview={(t) => (
        <div
          className="size-(--space-8) border-(length:--border-width-2) border-(--color-border-action)"
          style={{ borderRadius: `var(${t.cssName})` }}
        />
      )}
    />
  ),
}

export const OtherDimensions: Story = {
  render: () => (
    <TokenTable
      items={tokens.filter((t) => t.token.$type !== 'color' && !['space', 'radius'].includes(t.path[0]))}
      preview={() => null}
    />
  ),
}
