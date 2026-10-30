import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './card'

const elevations = ['flat', 'raised'] as const

// The Figma sample content: Body/Medium + Body/Small.
const bookingSummary = (
  <>
    <p className="w-full text-(length:--font-size-body) leading-(--font-line-height-body) text-(--color-text-primary)">
      Deep tissue massage, 60 min
    </p>
    <p className="w-full text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
      Tuesday 4 November at 10:00
    </p>
  </>
)

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
  // Figma cards are 400px wide (100 × space-1).
  decorators: [
    (Story) => (
      <div className="w-100 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Booking summary',
    elevation: 'flat',
    children: bookingSummary,
  },
  argTypes: {
    title: { control: 'text' },
    elevation: { control: 'inline-radio', options: elevations },
    children: { control: false, name: 'children (content)' },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Both elevations side by side, like the Figma component sheet. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { layout: 'padded', controls: { disable: true } },
  decorators: [],
  render: (args) => (
    <div className="grid grid-cols-[repeat(2,--spacing(100))] gap-(--space-6)">
      {elevations.map((elevation) => (
        <div key={elevation} className="flex flex-col gap-(--space-2)">
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {elevation}
          </span>
          <Card {...args} elevation={elevation} />
        </div>
      ))}
    </div>
  ),
}
