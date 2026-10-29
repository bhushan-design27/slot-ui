import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'

const variants = ['Primary', 'Secondary', 'Danger'] as const
const sizes = ['Small', 'Medium', 'Large'] as const
const states = ['Default', 'Hover', 'Focus', 'Disabled'] as const

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Book now',
    variant: 'Primary',
    size: 'Medium',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: sizes },
    disabled: { control: 'boolean' },
    children: { control: 'text', name: 'children (label)' },
    asChild: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every variant × size × state, laid out like the Figma component sheet. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Hover and Focus are CSS states; force them for the matching rows.
    pseudo: {
      hover: ['[data-figma-state="Hover"] button'],
      focusVisible: ['[data-figma-state="Focus"] button'],
    },
  },
  render: () => (
    <table className="border-separate border-spacing-(--space-4) text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
      <thead>
        <tr>
          <td />
          {variants.map((variant) => (
            <th key={variant} colSpan={sizes.length} className="text-left font-medium text-(--color-text-primary)">
              {variant}
            </th>
          ))}
        </tr>
        <tr>
          <td />
          {variants.flatMap((variant) =>
            sizes.map((size) => (
              <th key={`${variant}-${size}`} className="text-left font-normal">
                {size}
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {states.map((state) => (
          <tr key={state} data-figma-state={state}>
            <th className="pr-(--space-4) text-left font-medium text-(--color-text-primary)">{state}</th>
            {variants.flatMap((variant) =>
              sizes.map((size) => (
                <td key={`${variant}-${size}`}>
                  <Button variant={variant} size={size} disabled={state === 'Disabled'}>
                    Book now
                  </Button>
                </td>
              )),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}
