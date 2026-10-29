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
  },
};

export default preview;
