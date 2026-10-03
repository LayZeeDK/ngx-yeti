import { wcagTags } from '@ngx-yeti/testing';
import type { Preview } from '@storybook/angular-vite';
import './styles.css';

const preview: Preview = {
  parameters: {
    a11y: {
      // Any violation fails the story test: the gate of ADR 0015 point 2.
      test: 'error',
      options: {
        runOnly: {
          type: 'tag',
          values: [...wcagTags],
        },
      },
    },
  },
};

export default preview;
