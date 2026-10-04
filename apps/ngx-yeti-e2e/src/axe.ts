import { AxeBuilder } from '@axe-core/playwright';
import { violationLines, wcagTags } from '@ngx-yeti/testing';
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

  expect(violationLines(violations), 'axe violations').toEqual([]);
}
