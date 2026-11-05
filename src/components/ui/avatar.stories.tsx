import type { Meta, StoryObj } from '@storybook/react-vite'
import avatarSrc from '@/assets/avatar-photo.jpg'
import { Avatar } from './avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  args: { name: 'Maya Kim', size: 'large', src: avatarSrc, decorative: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'large'] },
    src: { control: 'text' },
    initials: { control: 'text' },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Both sizes, image and initials fallback; a broken image falls back to initials. */
export const AllVariants: Story = {
  name: 'All variants',
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-(--space-4) text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
      <thead>
        <tr>
          <td />
          <th className="text-left font-medium text-(--color-text-primary)">small</th>
          <th className="text-left font-medium text-(--color-text-primary)">large</th>
        </tr>
      </thead>
      <tbody>
        {([['photo', avatarSrc], ['initials', undefined], ['broken image', '/missing.png']] as const).map(([row, src]) => (
          <tr key={row}>
            <th className="pr-(--space-4) text-left font-medium text-(--color-text-primary)">{row}</th>
            <td><Avatar name="Maya Kim" size="small" src={src} /></td>
            <td><Avatar name="Maya Kim" size="large" src={src} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/** Name shown next to it: the avatar is decorative, so the name is read once. */
export const WithName: Story = {
  name: 'With name (decorative)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-(--space-3) text-(length:--font-size-body) leading-(--font-line-height-body) text-(--color-text-primary)">
      <Avatar name="Maya Kim" decorative />
      Maya Kim
    </div>
  ),
}
