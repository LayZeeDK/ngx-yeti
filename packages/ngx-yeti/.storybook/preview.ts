import { wcagTags } from '@ngx-yeti/testing';
import type { Preview } from '@storybook/angular-vite';
import './styles.css';

// Angular reports runtime errors through console.error and carries on, so a
// story whose directive throws would otherwise still pass.
const consoleErrors: unknown[][] = [];

const preview: Preview = {
  beforeEach: () => {
    const original = console.error;
    consoleErrors.length = 0;
    console.error = (...args: unknown[]): void => {
      consoleErrors.push(args);
      original(...args);
    };

    return (): void => {
      console.error = original;
    };
  },
  afterEach: () => {
    if (consoleErrors.length > 0) {
      throw new Error(
        `The story logged ${String(consoleErrors.length)} console error(s): ${consoleErrors.map((args) => args.map(String).join(' ')).join(' | ')}`,
      );
    }
  },
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
