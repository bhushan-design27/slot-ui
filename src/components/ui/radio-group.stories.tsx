import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, waitFor } from 'storybook/test'
import { RadioGroup } from './radio-group'

const appointmentTypes = [
  { value: 'in-person', label: 'In person' },
  { value: 'video', label: 'Video' },
  { value: 'phone', label: 'Phone' },
]

const radioStates = ['Default', 'Hover', 'Focus', 'Disabled'] as const
const groupStates = ['Default', 'Error', 'Disabled'] as const

const caption =
  'text-(length:--font-size-small) leading-(--font-line-height-small) font-medium text-(--color-text-secondary)'

const meta = {
  title: 'Components/Radio Group',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  args: {
    label: 'Appointment type',
    helper: 'You can change this later',
    options: appointmentTypes,
    invalid: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    options: { control: 'object' },
    value: { control: 'inline-radio', options: [undefined, ...appointmentTypes.map((o) => o.value)] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultValue: { table: { disable: true } },
    onValueChange: { action: 'valueChange' },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

// Selecting an option keeps the `value` control in sync.
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <RadioGroup
        {...args}
        onValueChange={(value) => {
          args.onValueChange?.(value)
          updateArgs({ value })
        }}
      />
    )
  },
}

/**
 * Like the Figma sheets: the Radio states (selected False / True), then the
 * Radio Group states. Each single radio is a one-option group named with
 * aria-label, since a radio needs a group.
 */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    // Hover and Focus are CSS states; force them for the matching cells.
    pseudo: {
      hover: ['[data-figma-state="Hover"] label'],
      focusVisible: ['[data-figma-state="Focus"] button'],
    },
  },
  render: () => (
    <div className="flex flex-col gap-(--space-8)">
      <div className="grid grid-cols-[auto_repeat(4,auto)] items-center justify-start gap-x-(--space-6) gap-y-(--space-4)">
        <span />
        {radioStates.map((state) => (
          <span key={state} className={caption}>
            {state}
          </span>
        ))}
        {[false, true].map((selected) => [
          <span key={`${selected}`} className={caption}>
            {selected ? 'Selected' : 'Not selected'}
          </span>,
          ...radioStates.map((state) => (
            <div key={`${selected}-${state}`} data-figma-state={state}>
              <RadioGroup
                aria-label={`${state}, ${selected ? 'selected' : 'not selected'}`}
                options={[{ value: 'in-person', label: 'In person' }]}
                defaultValue={selected ? 'in-person' : undefined}
                disabled={state === 'Disabled'}
              />
            </div>
          )),
        ])}
      </div>
      <div className="flex flex-wrap items-start gap-(--space-6)">
        {groupStates.map((state) => (
          <div key={state} className="flex flex-col gap-(--space-2)">
            <span className={caption}>{state}</span>
            <RadioGroup
              label="Appointment type"
              helper={state === 'Error' ? 'Choose an appointment type' : 'You can change this later'}
              options={appointmentTypes}
              invalid={state === 'Error'}
              disabled={state === 'Disabled'}
            />
          </div>
        ))}
      </div>
    </div>
  ),
}

/** Arrow keys move between options and select them; the group is one Tab stop. */
export const Keyboard: Story = {
  args: { defaultValue: 'in-person' },
  play: async ({ canvas, userEvent }) => {
    const inPerson = canvas.getByRole('radio', { name: 'In person' })
    const video = canvas.getByRole('radio', { name: 'Video' })
    const phone = canvas.getByRole('radio', { name: 'Phone' })

    // Radix selects on the focus that an arrow key causes while the key is
    // still down, like a real key press; an instant press-and-release would
    // release before that focus. So hold the key until the option is checked.
    const press = async (key: string, expected: HTMLElement) => {
      await userEvent.keyboard(`{${key}>}`)
      await waitFor(() => expect(expected).toBeChecked())
      await userEvent.keyboard(`{/${key}}`)
      await expect(expected).toHaveFocus()
    }

    await userEvent.tab()
    await expect(inPerson).toHaveFocus()

    await press('ArrowDown', video)
    await press('ArrowDown', phone)
    // Wraps around to the first option.
    await press('ArrowDown', inPerson)
    await press('ArrowUp', phone)
  },
}
