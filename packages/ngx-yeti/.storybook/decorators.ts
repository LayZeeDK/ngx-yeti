import { componentWrapperDecorator } from '@storybook/angular-vite';

/**
 * Renders the story on Yeti's page surface in one colour scheme, so axe and
 * contrast assertions see the colours a page in that scheme shows
 * (docs/specs/issues/50-decide-open-points-of-the-specs.md, decision 8).
 */
export function withColorScheme(
  scheme: 'light' | 'dark',
): ReturnType<typeof componentWrapperDecorator> {
  return componentWrapperDecorator(
    (story) =>
      `<div style="color-scheme: ${scheme}; color: var(--yeti-color-text); background-color: var(--yeti-color-surface)">${story}</div>`,
  );
}
