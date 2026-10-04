import { type Type } from '@angular/core';
import { CardFixture } from './card-fixture';
import { LiftFixture } from './lift-fixture';
import { ReplayFixture } from './replay-fixture';
import { SetupBoundariesFixture } from './setup-boundaries-fixture';
import { SetupDeferFixture, SetupFixture } from './setup-fixture';

export const fixtures = {
  card: CardFixture,
  lift: LiftFixture,
  replay: ReplayFixture,
  setup: SetupFixture,
  'setup-boundaries': SetupBoundariesFixture,
  'setup-defer': SetupDeferFixture,
} satisfies Record<string, Type<unknown>>;
