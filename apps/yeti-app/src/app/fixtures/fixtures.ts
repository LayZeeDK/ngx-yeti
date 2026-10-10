import { type Type } from '@angular/core';
import { BoxFixture, BoxMarkersFixture } from './box-fixture';
import { BreakoutFixture } from './breakout-fixture';
import { ButtonFixture } from './button-fixture';
import { CardFixture } from './card-fixture';
import { CenterAntiPatternFixture, CenterFixture } from './center-fixture';
import { ClusterFixture } from './cluster-fixture';
import { ColumnsFixture } from './columns-fixture';
import { ContainerFixture } from './container-fixture';
import { CoverFixture } from './cover-fixture';
import { EnterFixture } from './enter-fixture';
import { FrameFixture } from './frame-fixture';
import { GridFixture } from './grid-fixture';
import { IconFixture } from './icon-fixture';
import { LayerFixture } from './layer-fixture';
import { LiftFixture } from './lift-fixture';
import { MasonryFixture } from './masonry-fixture';
import { OverlayFixture } from './overlay-fixture';
import { ReplayFixture } from './replay-fixture';
import { ScrollerFixture } from './scroller-fixture';
import { SetupBoundariesFixture } from './setup-boundaries-fixture';
import {
  SetupDeferFixture,
  SetupFixture,
  SetupOrderFixture,
} from './setup-fixture';
import { SidebarFixture } from './sidebar-fixture';
import { SpinnerFixture } from './spinner-fixture';
import { StackFixture } from './stack-fixture';
import { StaticAttributesFixture } from './static-attributes-fixture';
import {
  TableFixture,
  TableNumericFixture,
  TableWithoutTbodyFixture,
} from './table-fixture';
import { TimelineFixture } from './timeline-fixture';
import { VisuallyHiddenFixture } from './visually-hidden-fixture';

export const fixtures = {
  box: BoxFixture,
  'box-markers': BoxMarkersFixture,
  breakout: BreakoutFixture,
  button: ButtonFixture,
  card: CardFixture,
  center: CenterFixture,
  'center-anti-pattern': CenterAntiPatternFixture,
  cluster: ClusterFixture,
  columns: ColumnsFixture,
  container: ContainerFixture,
  cover: CoverFixture,
  enter: EnterFixture,
  frame: FrameFixture,
  grid: GridFixture,
  icon: IconFixture,
  layer: LayerFixture,
  lift: LiftFixture,
  masonry: MasonryFixture,
  overlay: OverlayFixture,
  replay: ReplayFixture,
  scroller: ScrollerFixture,
  setup: SetupFixture,
  'setup-boundaries': SetupBoundariesFixture,
  'setup-defer': SetupDeferFixture,
  'setup-order': SetupOrderFixture,
  sidebar: SidebarFixture,
  spinner: SpinnerFixture,
  stack: StackFixture,
  'static-attributes': StaticAttributesFixture,
  table: TableFixture,
  'table-numeric': TableNumericFixture,
  'table-without-tbody': TableWithoutTbodyFixture,
  timeline: TimelineFixture,
  'visually-hidden': VisuallyHiddenFixture,
} satisfies Record<string, Type<unknown>>;
