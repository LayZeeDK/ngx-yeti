import { AxeBuilder } from '@axe-core/playwright';
import { wcagTags } from '@ngx-yeti/testing';
import { expect, type Page } from '@playwright/test';

/**
 * Runs axe over the page in its current state and fails with the violations
 * listed. Layer 4 runs it only on states no play function reaches
 * (docs/specs/adr/0014-testing-stack-for-yeti.md, point 4).
 *
 * The context and the disabled `region` rule match the story gate of
 * `@storybook/addon-a11y`: the body, so overlays outside the story root
 * count, minus Storybook's own elements. A context narrower than the
 * document also skips axe's page-level rules, such as `landmark-one-main`,
 * which a component story cannot meet.
 */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page })
    .withTags([...wcagTags])
    .include('body')
    .exclude('.sb-wrapper')
    .exclude('#storybook-docs')
    .exclude('#storybook-highlights-root')
    .disableRules('region')
    .analyze();

  expect(
    violations.map(
      ({ id, help, nodes }) =>
        `${id}: ${help} (${nodes.map(({ target }) => target.join(' ')).join(', ')})`,
    ),
    'axe violations',
  ).toEqual([]);
}
