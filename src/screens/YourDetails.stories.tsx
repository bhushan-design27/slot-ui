import type { Meta, StoryObj } from '@storybook/react-vite'
import { YourDetails } from './YourDetails'

const meta = {
  title: 'Screens/YourDetails',
  component: YourDetails,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof YourDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Mobile: Story = {
  globals: { viewport: { value: 'slot-mobile', isRotated: false } },
}

export const Desktop: Story = {
  globals: { viewport: { value: 'slot-desktop', isRotated: false } },
}
