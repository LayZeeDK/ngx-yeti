/**
 * The axe rule tags every accessibility check runs: the story gate and
 * `@axe-core/playwright` (docs/specs/adr/0014-testing-stack-for-yeti.md,
 * points 1 and 4). `wcag22aa` turns on axe-core's `target-size` rule.
 */
export const wcagTags = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
] as const;
