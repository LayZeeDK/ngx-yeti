import type { Result } from 'axe-core';

/**
 * One `id: help (targets)` line per axe violation, so a check reads as
 * `expect(violationLines(violations)).toEqual([])`.
 */
export function violationLines(violations: readonly Result[]): string[] {
  return violations.map(
    ({ id, help, nodes }) =>
      `${id}: ${help} (${nodes.map(({ target }) => target.join(' ')).join(', ')})`,
  );
}
