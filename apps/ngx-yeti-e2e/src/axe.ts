import { AxeBuilder } from '@axe-core/playwright';
import { wcagTags } from '@ngx-yeti/testing';
import { expect, type Page } from '@playwright/test';

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
