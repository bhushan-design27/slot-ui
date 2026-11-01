import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './textarea'

const states = ['Default', 'Focus', 'Error', 'Disabled'] as const

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  args: {
    label: 'Notes for your therapist (optional)',
    placeholder: 'Anything they should know',
    helper: 'Injuries, pressure preferences or anything else.',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helper: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  decorators: [
    (Story) => (
      <div className="w-(--layout-form-max) max-w-full">
        <Story />
      </div>
    ),
  ],
}

/** Every Figma state side by side, like the component sheet. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Focus is a CSS state; force it for the Focus column.
    pseudo: { focusVisible: ['[data-figma-state="Focus"] textarea'] },
  },
  render: (args) => (
    <div className="grid grid-cols-4 gap-(--space-6)">
      {states.map((state) => (
        <div key={state} data-figma-state={state} className="flex flex-col gap-(--space-2)">
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {state}
          </span>
          <Textarea {...args} invalid={state === 'Error'} disabled={state === 'Disabled'} />
        </div>
      ))}
    </div>
  ),
}
