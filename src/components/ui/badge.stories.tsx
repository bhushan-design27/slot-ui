import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'

const variants = ['success', 'info', 'warning', 'error', 'neutral'] as const
const examples: Record<(typeof variants)[number], string> = {
  success: 'Confirmed',
  info: 'Upcoming',
  warning: 'Pending',
  error: 'Payment failed',
  neutral: 'Cancelled',
}

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  args: { variant: 'success', children: 'Confirmed' },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    children: { control: 'text', name: 'label' },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every Figma variant, with a typical booking status. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-(--space-3)">
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {examples[variant]}
        </Badge>
      ))}
    </div>
  ),
}
