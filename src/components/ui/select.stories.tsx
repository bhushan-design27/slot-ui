import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './select'

const states = ['Default', 'Focus', 'Error', 'Disabled', 'Open'] as const

const services = [
  { value: 'massage', label: 'Massage' },
  { value: 'physio', label: 'Physio' },
  { value: 'classes', label: 'Classes' },
]

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: {
    label: 'Service',
    placeholder: 'Select a service',
    helper: 'You can change this later',
    options: services,
    invalid: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helper: { control: 'text' },
    options: { control: 'object' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'inline-radio', options: [undefined, ...services.map((s) => s.value)] },
    open: { control: 'boolean' },
    onValueChange: { action: 'valueChange' },
    onOpenChange: { action: 'openChange' },
  },
} satisfies Meta<typeof Select>

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

/**
 * Every Figma state side by side, like the component sheet. The Open column
 * is held open with `open`; Radix then treats the menu as modal (the rest of
 * the page is inert until it closes).
 */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Focus is a CSS state; force it for the Focus column.
    pseudo: { focusVisible: ['[data-figma-state="Focus"] button'] },
  },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-(--space-6)">
      {states.map((state) => (
        // 320px columns like Figma; the Open column leaves room for the menu.
        <div
          key={state}
          data-figma-state={state}
          className={`flex w-80 flex-col gap-(--space-2) ${state === 'Open' ? 'min-h-72' : ''}`}
        >
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {state}
          </span>
          <Select
            {...args}
            invalid={state === 'Error'}
            disabled={state === 'Disabled'}
            open={state === 'Open' ? true : undefined}
            value={state === 'Open' ? 'massage' : undefined}
          />
        </div>
      ))}
    </div>
  ),
}
