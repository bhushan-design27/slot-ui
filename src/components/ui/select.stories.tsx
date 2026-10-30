import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './select'

const states = ['Default', 'Focus', 'Error', 'Disabled'] as const

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
 * The closed Figma states side by side, like the component sheet. Open has
 * its own story: an open Select is modal (Radix aria-hides the rest of the
 * page), so it can't share a page with other focusable fields.
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
        // 320px columns like Figma.
        <div key={state} data-figma-state={state} className="flex w-80 flex-col gap-(--space-2)">
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {state}
          </span>
          <Select
            {...args}
            invalid={state === 'Error'}
            disabled={state === 'Disabled'}
          />
        </div>
      ))}
    </div>
  ),
}

/** Figma Open state: menu held open with "Massage" selected (field shows it, row has the check). */
export const Open: Story = {
  args: { open: true, value: 'massage' },
  decorators: [
    (Story) => (
      // Room below the field for the menu.
      <div className="min-h-72 w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
}
