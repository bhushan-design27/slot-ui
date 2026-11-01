import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // axe runs on every story. 'error' = violations fail test runs instead of being only listed.
    a11y: { test: 'error' },
    // Screen stories show these two sizes: globals: { viewport: { value: 'slot-mobile' } }.
    viewport: {
      options: {
        'slot-mobile': { name: 'Slot mobile (390)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        'slot-desktop': { name: 'Slot desktop (1440)', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
  },
};

export default preview;
