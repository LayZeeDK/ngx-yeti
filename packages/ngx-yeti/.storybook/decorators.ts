import { componentWrapperDecorator } from '@storybook/angular-vite';

export function withColorScheme(
  scheme: 'light' | 'dark',
): ReturnType<typeof componentWrapperDecorator> {
  return componentWrapperDecorator(
    (story) =>
      `<div style="color-scheme: ${scheme}; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${story}</div>`,
  );
}
