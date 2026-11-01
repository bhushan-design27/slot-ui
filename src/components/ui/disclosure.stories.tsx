import type { Meta, StoryObj } from '@storybook/react-vite'
import { Disclosure } from './disclosure'

const states = ['Default', 'Hover', 'Focus', 'Open'] as const

const details = [
  { term: 'Service', detail: 'Deep tissue massage' },
  { term: 'Duration', detail: '60 min' },
  { term: 'Date and time', detail: 'Tuesday 4 November at 10:00' },
  { term: 'Price', detail: '$95' },
]

const Details = () => (
  <dl className="flex flex-col gap-(--space-3)">
    {details.map(({ term, detail }) => (
      <div key={term} className="flex flex-col gap-(--space-1)">
        <dt className="text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
          {term}
        </dt>
        <dd className="text-(length:--font-size-body) leading-(--font-line-height-body)">{detail}</dd>
      </div>
    ))}
  </dl>
)

const meta = {
  title: 'Components/Disclosure',
  component: Disclosure,
  parameters: { layout: 'centered' },
  args: {
    summary: 'Deep tissue massage',
    detail: 'Tue 4 Nov, 10:00 · $95',
    children: <Details />,
  },
  argTypes: {
    summary: { control: 'text' },
    detail: { control: 'text' },
    open: { control: 'boolean' },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-(--layout-form-max) max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Disclosure>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Every Figma state side by side, like the component sheet. */
export const AllVariants: Story = {
  name: 'All variants',
  decorators: [],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Hover and Focus are CSS states; force them for their columns.
    pseudo: {
      hover: ['[data-figma-state="Hover"] [data-slot="disclosure-trigger"]'],
      focusVisible: ['[data-figma-state="Focus"] [data-slot="disclosure-trigger"]'],
    },
  },
  render: (args) => (
    <div className="flex w-(--layout-form-max) max-w-full flex-col gap-(--space-6)">
      {states.map((state) => (
        <div key={state} data-figma-state={state} className="flex flex-col gap-(--space-2)">
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {state}
          </span>
          <Disclosure {...args} defaultOpen={state === 'Open'} />
        </div>
      ))}
    </div>
  ),
}
