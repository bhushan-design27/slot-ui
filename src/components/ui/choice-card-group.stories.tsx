import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import avatarSrc from '@/assets/avatar-photo.jpg'
import { Button } from './button'
import { ChoiceCard, ChoiceCardGroup } from './choice-card-group'

const services = [
  { value: 'deep-tissue', title: 'Deep tissue massage', description: 'Firm pressure for muscle tension', detail: '$95' },
  { value: 'swedish', title: 'Swedish massage', description: 'Gentle, relaxing full-body massage', detail: '$85' },
  { value: 'hot-stone', title: 'Hot stone massage', description: 'Heated stones ease deep tension', detail: '$110' },
]

const Services = ({ disabledValue }: { disabledValue?: string }) =>
  services.map((s) => <ChoiceCard key={s.value} {...s} disabled={s.value === disabledValue} />)

const meta = {
  title: 'Components/ChoiceCardGroup',
  component: ChoiceCardGroup,
  parameters: { layout: 'padded' },
  args: { label: 'Choose a service', helper: 'Prices include tax', defaultValue: 'deep-tissue', invalid: false, disabled: false },
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [(Story) => <div className="max-w-(--layout-form-max) pl-(--space-4)"><Story /></div>],
  render: (args) => (
    <ChoiceCardGroup {...args}>
      <Services />
    </ChoiceCardGroup>
  ),
} satisfies Meta<typeof ChoiceCardGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Figma group states: Default (one selected), Error, Disabled. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-(--space-8)">
      <ChoiceCardGroup label="Choose a service" helper="Prices include tax" defaultValue="deep-tissue">
        <Services />
      </ChoiceCardGroup>
      <ChoiceCardGroup label="Choose a service" helper="Choose a service to continue" invalid>
        <Services />
      </ChoiceCardGroup>
      <ChoiceCardGroup label="Choose a service" helper="Prices include tax" disabled defaultValue="deep-tissue">
        <Services />
      </ChoiceCardGroup>
    </div>
  ),
}

/** Therapists: avatars, and an icon tile for "Any available therapist" so titles line up. */
export const Therapists: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ChoiceCardGroup label="Choose a therapist" defaultValue="any">
      <ChoiceCard value="any" icon="users" title="Any available therapist" description="First available time" />
      <ChoiceCard value="maya" avatar={{ name: 'Maya Kim', src: avatarSrc }} title="Maya Kim" description="Deep tissue, sports massage" />
      <ChoiceCard value="jordan" avatar={{ name: 'Jordan Lee' }} title="Jordan Lee" description="Swedish, hot stone" />
    </ChoiceCardGroup>
  ),
}

/** Radio group keyboard: one Tab stop, arrows move and select (skipping disabled cards), Continue is next. */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <form className="flex flex-col gap-(--space-8)" onSubmit={(e) => e.preventDefault()}>
      <ChoiceCardGroup label="Choose a service">
        <Services disabledValue="hot-stone" />
      </ChoiceCardGroup>
      <Button type="submit">Continue</Button>
    </form>
  ),
  play: async ({ canvas, userEvent }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Choose a service' })
    const [deep, swedish, hotStone] = canvas.getAllByRole('radio')
    await expect(deep).toHaveAccessibleName('Deep tissue massage')
    await expect(deep).toHaveAccessibleDescription('Firm pressure for muscle tension $95')
    await expect(group).toBeInTheDocument()

    const press = async (key: string, expected: HTMLElement) => {
      await userEvent.keyboard(`{${key}>}`)
      await waitFor(() => expect(expected).toBeChecked())
      await userEvent.keyboard(`{/${key}}`)
      await expect(expected).toHaveFocus()
    }

    // Tab enters on the first card without selecting it.
    await userEvent.tab()
    await expect(deep).toHaveFocus()
    await expect(deep).not.toBeChecked()
    // Space selects the focused card.
    await userEvent.keyboard(' ')
    await waitFor(() => expect(deep).toBeChecked())
    // Arrows move and select; the disabled card is skipped and focus wraps.
    await press('ArrowDown', swedish)
    await expect(deep).not.toBeChecked()
    await press('ArrowDown', deep)
    await press('ArrowUp', swedish)
    await press('ArrowRight', deep)
    await expect(hotStone).toBeDisabled()
    // One Tab stop: Tab leaves the group for Continue; Shift+Tab returns to the selected card.
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(deep).toHaveFocus()
  },
}
