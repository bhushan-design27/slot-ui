import type { Meta, StoryObj } from '@storybook/react-vite'
import { StepIndicator } from './step-indicator'

const meta = {
  title: 'Components/StepIndicator',
  component: StepIndicator,
  parameters: { layout: 'padded' },
  args: { current: 4 },
  argTypes: {
    current: { control: 'inline-radio', options: [1, 2, 3, 4, 5] },
  },
} satisfies Meta<typeof StepIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  globals: { viewport: { value: 'slot-desktop', isRotated: false } },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'slot-mobile', isRotated: false } },
}

/** Every Figma `current` value (resize below 640px for the Mobile viewport). */
export const AllSteps: Story = {
  name: 'All steps',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-(--space-6)">
      {([1, 2, 3, 4, 5] as const).map((current) => (
        <StepIndicator key={current} current={current} />
      ))}
    </div>
  ),
}
