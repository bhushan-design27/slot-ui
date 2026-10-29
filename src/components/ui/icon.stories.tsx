import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, iconNames } from './icon'

const meta = {
  title: 'Components/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  args: {
    name: 'chevron-down',
    disabled: false,
  },
  argTypes: {
    name: { control: 'inline-radio', options: iconNames },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every Figma `name` value, default and disabled color. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-(--space-4) text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
      <thead>
        <tr>
          <td />
          {iconNames.map((name) => (
            <th key={name} className="text-left font-medium text-(--color-text-primary)">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(['Default', 'Disabled'] as const).map((state) => (
          <tr key={state}>
            <th className="pr-(--space-4) text-left font-medium text-(--color-text-primary)">{state}</th>
            {iconNames.map((name) => (
              <td key={name}>
                <Icon name={name} disabled={state === 'Disabled'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}
