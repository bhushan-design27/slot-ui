import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { Button } from './button'
import { Dialog, DialogClose } from './dialog'

// Figma "dialog overlay" (79:74): Secondary "Keep booking" + Danger "Cancel booking".
const cancelBookingFooter = (
  <>
    <DialogClose asChild>
      <Button variant="secondary">Keep booking</Button>
    </DialogClose>
    <DialogClose asChild>
      <Button variant="danger">Cancel booking</Button>
    </DialogClose>
  </>
)

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  args: {
    open: true,
    title: 'Cancel booking?',
    description: "You'll lose this time slot.",
    footer: cancelBookingFooter,
  },
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    footer: { control: false },
    children: { control: false },
    trigger: { control: false },
    defaultOpen: { table: { disable: true } },
    onOpenChange: { action: 'openChange' },
  },
  // Keep the `open` control in sync when Escape, the overlay or an action closes the dialog.
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <Dialog
        {...args}
        trigger={<Button variant="secondary">Open dialog</Button>}
        onOpenChange={(open) => {
          args.onOpenChange?.(open)
          updateArgs({ open })
        }}
      />
    )
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/**
 * The Figma example. Escape, the overlay or either button closes it; focus
 * stays inside the dialog while it's open and returns to the trigger after.
 */
export const CancelBooking: Story = {
  name: 'Cancel booking',
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <Dialog
        {...args}
        trigger={<Button variant="danger">Cancel booking</Button>}
        onOpenChange={(open) => updateArgs({ open })}
      />
    )
  },
}

/** Figma has a single Dialog variant: shown open on the overlay, as in the Figma frame. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (args) => <Dialog {...args} open />,
}
