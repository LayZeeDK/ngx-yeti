import { type Type } from '@angular/core';
import { CardFixture } from './card-fixture';
import { HighlightFixture } from './highlight-fixture';
import { ReplayFixture } from './replay-fixture';

export const fixtures = {
  card: CardFixture,
  highlight: HighlightFixture,
  replay: ReplayFixture,
} satisfies Record<string, Type<unknown>>;
