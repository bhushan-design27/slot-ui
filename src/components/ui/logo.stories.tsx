import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from './logo'

const variants = ['lockup', 'mark'] as const
const sizes = ['small', 'medium'] as const

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: { layout: 'centered' },
  args: {
    variant: 'lockup',
    size: 'medium',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: sizes },
  },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every Figma variant: variant x size. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-(--space-4) text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
      <thead>
        <tr>
          <td />
          {sizes.map((size) => (
            <th key={size} className="text-left font-medium text-(--color-text-primary)">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {variants.map((variant) => (
          <tr key={variant}>
            <th className="pr-(--space-4) text-left font-medium text-(--color-text-primary)">{variant}</th>
            {sizes.map((size) => (
              <td key={size}>
                <Logo variant={variant} size={size} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}
