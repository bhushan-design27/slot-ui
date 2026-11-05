import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { formatDateLong } from '@/lib/format'
import { Button } from './button'
import { TimeSlotGroup, type TimeSlot } from './time-slot-group'

const day = new Date(2026, 10, 10)
const at = (h: number, m = 0) => new Date(2026, 10, 10, h, m)
const slots: TimeSlot[] = [
  { time: at(9) }, { time: at(9, 30) }, { time: at(10) }, { time: at(10, 30) },
  { time: at(11), disabled: true }, { time: at(11, 30) }, { time: at(13) }, { time: at(13, 30), disabled: true },
  { time: at(14) }, { time: at(14, 30) }, { time: at(15) }, { time: at(16) },
]
const label = `Available times on ${formatDateLong(day)}`

const meta = {
  title: 'Components/TimeSlotGroup',
  component: TimeSlotGroup,
  parameters: { layout: 'padded' },
  args: { label, slots, defaultValue: at(10).toISOString() },
  argTypes: { slots: { control: false } },
  decorators: [(Story) => <div className="max-w-(--layout-form-max)"><Story /></div>],
} satisfies Meta<typeof TimeSlotGroup>

export default meta
type Story = StoryObj<typeof meta>

/** 4 columns from 640px. */
export const Desktop: Story = {
  globals: { viewport: { value: 'slot-desktop', isRotated: false } },
}

/** 3 columns on phones. */
export const Mobile: Story = {
  globals: { viewport: { value: 'slot-mobile', isRotated: false } },
}

/** Figma empty=True: no available time on the day. */
export const Empty: Story = {
  args: { slots: [{ time: at(9), disabled: true }, { time: at(10), disabled: true }] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('radiogroup')).toBeNull()
    await expect(canvas.getByRole('status')).toHaveTextContent('No times left on this day. Try another day.')
  },
}

/** Linear radio keyboard: arrows go to the next/previous available time and select it; disabled times are skipped. */
export const Keyboard: Story = {
  args: { defaultValue: undefined },
  render: (args) => (
    <div className="flex flex-col gap-(--space-8)">
      <TimeSlotGroup {...args} />
      <Button>Continue</Button>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('radiogroup', { name: label })).toBeInTheDocument()
    const radio = (name: string) => canvas.getByRole('radio', { name })
    const press = async (key: string, expected: HTMLElement) => {
      await userEvent.keyboard(`{${key}>}`)
      await waitFor(() => expect(expected).toBeChecked())
      await userEvent.keyboard(`{/${key}}`)
      await expect(expected).toHaveFocus()
    }
    await userEvent.tab()
    await expect(radio('9:00 AM')).toHaveFocus()
    await press('ArrowRight', radio('9:30 AM'))
    // Down is linear (next slot), not "one row down".
    await press('ArrowDown', radio('10:00 AM'))
    await press('ArrowRight', radio('10:30 AM'))
    // 11:00 AM is disabled: skipped.
    await expect(radio('11:00 AM')).toBeDisabled()
    await press('ArrowRight', radio('11:30 AM'))
    await press('ArrowLeft', radio('10:30 AM'))
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(radio('10:30 AM')).toHaveFocus()
  },
}
