import { wcagTags } from '@ngx-yeti/testing';
import type { Preview } from '@storybook/angular-vite';
import { expect, spyOn, type MockInstance } from 'storybook/test';
import './styles.css';

// Angular reports runtime errors through console.error and carries on, so a
// story whose directive throws would otherwise still pass. Storybook restores
// every spy before the next story.
let consoleError: MockInstance<typeof console.error> | undefined;

const preview: Preview = {
  beforeEach: () => {
    consoleError = spyOn(console, 'error');
  },
  afterEach: async () => {
    await expect(consoleError).not.toHaveBeenCalled();
  },
  parameters: {
    a11y: {
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
