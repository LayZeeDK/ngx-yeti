import { type Type } from '@angular/core';
import { HighlightFixture } from './highlight-fixture';
import { ReplayFixture } from './replay-fixture';

/**
 * One row per fixture: its route path and its component. The client and
 * server routes both derive from this table, so each fixture is served at
 * `/<path>` (prerendered) and `/server/<path>` (rendered per request).
 */
export const fixtures = {
  highlight: HighlightFixture,
  replay: ReplayFixture,
} satisfies Record<string, Type<unknown>>;
