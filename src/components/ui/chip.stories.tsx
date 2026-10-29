import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { Chip } from './chip'

const states = ['Default', 'Hover', 'Selected', 'Disabled', 'Focus'] as const

const meta = {
  title: 'Components/Chip',
  component: Chip,
  parameters: { layout: 'centered' },
  args: {
    children: 'Massage',
    selected: false,
    disabled: false,
  },
  argTypes: {
    children: { control: 'text', name: 'children (label)' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultSelected: { table: { disable: true } },
    asChild: { table: { disable: true } },
    onSelectedChange: { action: 'selectedChange' },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

// Clicking the chip keeps the `selected` control in sync.
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <Chip
        {...args}
        onSelectedChange={(selected) => {
          args.onSelectedChange?.(selected)
          updateArgs({ selected })
        }}
      />
    )
  },
}

/** Every Figma state, in the Figma sheet order. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Hover and Focus are CSS states; force them for the matching cells.
    pseudo: {
      hover: ['[data-figma-state="Hover"] button'],
      focusVisible: ['[data-figma-state="Focus"] button'],
    },
  },
  render: () => (
    <div className="flex gap-(--space-6)">
      {states.map((state) => (
        <div key={state} data-figma-state={state} className="flex flex-col items-start gap-(--space-2)">
          <span className="text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)">
            {state}
          </span>
          <Chip selected={state === 'Selected'} disabled={state === 'Disabled'}>
            Massage
          </Chip>
        </div>
      ))}
    </div>
  ),
}

/** Chips as a filter group: click or press Space / Enter to toggle. */
export const FilterGroup: Story = {
  name: 'Filter group',
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['Massage'])
    const toggle = (label: string, on: boolean) =>
      setSelected((current) => (on ? [...current, label] : current.filter((l) => l !== label)))

    return (
      <div role="group" aria-label="Treatment type" className="flex flex-wrap gap-(--space-2)">
        {['Massage', 'Physio', 'Classes'].map((label) => (
          <Chip key={label} selected={selected.includes(label)} onSelectedChange={(on) => toggle(label, on)}>
            {label}
          </Chip>
        ))}
      </div>
    )
  },
}
