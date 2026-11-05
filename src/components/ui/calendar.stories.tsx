import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { formatDateLong } from '@/lib/format'
import { Calendar, type CalendarProps } from './calendar'

// Fixed dates so stories and tests are deterministic: today is Wednesday, November 4, 2026.
const today = new Date(2026, 10, 4)
const day = (month: number, date: number) => new Date(2026, month, date)
const unavailable = [day(10, 18), day(10, 25)]

function Controlled(props: CalendarProps) {
  const [selected, setSelected] = React.useState<Date | undefined>(props.selected)
  return (
    <div className="flex flex-col gap-(--space-4)">
      <Calendar {...props} selected={selected} onSelect={setSelected} />
      {/* Body/Small */}
      <p className="text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
        {selected ? `Selected: ${formatDateLong(selected)}` : 'No day selected'}
      </p>
    </div>
  )
}

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: { layout: 'padded' },
  args: { today, minDate: today, maxDate: day(11, 31), unavailable, selected: day(10, 10), defaultMonth: day(10, 1) },
  argTypes: { unavailable: { control: false } },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

/** Figma sample: November 2026, today the 4th (also the min date), the 10th selected, the 18th and 25th unavailable. */
export const Playground: Story = {}

/** WAI-ARIA date grid keyboard: arrows by day and week, Home/End, Page Up/Down by month, unavailable days skipped. */
export const Keyboard: Story = {
  args: { selected: undefined },
  play: async ({ canvas, userEvent }) => {
    const previous = canvas.getByRole('button', { name: 'Previous month' })
    const next = canvas.getByRole('button', { name: 'Next month' })
    // November is the min month: Previous is disabled (out of the tab order).
    await expect(previous).toBeDisabled()
    await expect(canvas.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument()

    const focused = () => document.activeElement as HTMLElement
    const expectDay = async (iso: string) => waitFor(() => expect(focused().dataset.day).toBe(iso))

    await userEvent.tab()
    await expect(next).toHaveFocus()
    // One Tab stop in the grid: today (nothing selected yet).
    await userEvent.tab()
    await expectDay('2026-11-04')
    await expect(focused()).toHaveAccessibleName(/Today.*November 4/)

    await userEvent.keyboard('{ArrowRight}')
    await expectDay('2026-11-05')
    await userEvent.keyboard('{ArrowDown}')
    await expectDay('2026-11-12')
    await userEvent.keyboard('{ArrowLeft}')
    await expectDay('2026-11-11')
    await userEvent.keyboard('{ArrowUp}')
    await expectDay('2026-11-04')
    // Unavailable days are skipped: from the 17th, ArrowRight passes the 18th.
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    await expectDay('2026-11-17')
    await userEvent.keyboard('{ArrowRight}')
    await expectDay('2026-11-19')
    await userEvent.keyboard('{Home}')
    await expectDay('2026-11-15')
    await userEvent.keyboard('{End}')
    await expectDay('2026-11-21')
    await userEvent.keyboard('{PageDown}')
    await waitFor(() => expect(canvas.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument())
    await expectDay('2026-12-21')
    // December is the max month: Next is disabled.
    await expect(canvas.getByRole('button', { name: 'Next month' })).toBeDisabled()
    await userEvent.keyboard('{PageUp}')
    await waitFor(() => expect(canvas.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument())
    await expectDay('2026-11-21')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(canvas.getByText('Selected: Saturday, November 21')).toBeInTheDocument())
    await expect(focused()).toHaveAccessibleName(/November 21.*selected/i)
  },
}
