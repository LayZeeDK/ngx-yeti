import { type Type } from '@angular/core';
import { HighlightFixture } from './highlight-fixture';
import { ReplayFixture } from './replay-fixture';

export const fixtures = {
  highlight: HighlightFixture,
  replay: ReplayFixture,
} satisfies Record<string, Type<unknown>>;
