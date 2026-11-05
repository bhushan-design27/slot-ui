import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineMessage } from './inline-message'

const variants = ['info', 'success', 'warning', 'error'] as const
const examples: Record<(typeof variants)[number], { title: string; message: string }> = {
  info: { title: 'Booking updated', message: "We've moved your appointment to 10:30 AM." },
  success: { title: 'Booking confirmed', message: "We've sent the details to your email." },
  warning: { title: 'Arrive 10 minutes early', message: 'Your first visit starts with a short health form.' },
  error: { title: "We couldn't take payment", message: 'Check your card details and try again.' },
}

const meta = {
  title: 'Components/InlineMessage',
  component: InlineMessage,
  parameters: { layout: 'padded' },
  args: { variant: 'info', ...examples.info },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    title: { control: 'text' },
    message: { control: 'text' },
  },
  decorators: [(Story) => <div className="max-w-(--layout-form-max)"><Story /></div>],
} satisfies Meta<typeof InlineMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every Figma variant, with and without a title (Figma `show title`). */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-(--space-4)">
      {variants.map((variant) => (
        <InlineMessage key={variant} variant={variant} {...examples[variant]} />
      ))}
      <InlineMessage variant="info" message="Without a title: the message alone." />
    </div>
  ),
}
