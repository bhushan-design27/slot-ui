import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppHeader } from './app-header'

const meta = {
  title: 'Components/AppHeader',
  component: AppHeader,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  globals: { viewport: { value: 'slot-desktop', isRotated: false } },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'slot-mobile', isRotated: false } },
}
