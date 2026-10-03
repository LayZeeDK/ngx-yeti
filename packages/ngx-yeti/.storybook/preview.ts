import type { Preview } from '@storybook/angular-vite';
import './styles.css';

const preview: Preview = {
  parameters: {
    a11y: {
      // Docs: docs/specs/adr/0014-testing-stack-for-yeti.md point 1 and
      // docs/specs/adr/0015-wcag-2-2-aa-enforcement-over-yeti.md point 2.
      test: 'error',
      options: {
        runOnly: {
          type: 'tag',
          values: [
            'wcag2a',
            'wcag2aa',
            'wcag21a',
            'wcag21aa',
            'wcag22aa',
            'best-practice',
          ],
        },
      },
    },
  },
};

export default preview;
