import { Component, type InputSignalWithTransform } from '@angular/core';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  attributeValue,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { type YetiAlign, type YetiGap } from './yeti-types';
import { YetiBox } from 'ngx-yeti/box';
import { type YetiBreakout } from 'ngx-yeti/breakout';
import { YetiCenter } from 'ngx-yeti/center';
import { type YetiCluster } from 'ngx-yeti/cluster';
import { type NgxYetiColumns } from 'ngx-yeti/columns';
import { type YetiCover } from 'ngx-yeti/cover';
import { type YetiGrid } from 'ngx-yeti/grid';
import { type YetiIcon } from 'ngx-yeti/icon';
import { type YetiLayer } from 'ngx-yeti/layer';
import { type YetiMasonry } from 'ngx-yeti/masonry';
import { type YetiOverlay } from 'ngx-yeti/overlay';
import { type YetiScroller } from 'ngx-yeti/scroller';
import { type YetiSidebar, type YetiSidebarChild } from 'ngx-yeti/sidebar';
import { type YetiStack, type YetiStackChild } from 'ngx-yeti/stack';
import {
  type YetiTableAlign,
  type YetiTableCell,
  type YetiTableHead,
} from 'ngx-yeti/table';
import { type YetiTimeline } from 'ngx-yeti/timeline';

// Angular sets one template binding on every directive on the element that
// declares its name, so two package directives sharing a name must agree on
// its type (building-blocks 1.4, shared vocabularies).
type GapOf<T extends { gap: () => unknown }> = ReturnType<T['gap']>;
type AlignOf<T extends { align: () => unknown }> = ReturnType<T['align']>;
type BooleanInput = InputSignalWithTransform<boolean, unknown>;

expectTypeOf<GapOf<YetiBox>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiBreakout>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiCenter>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiCluster>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<NgxYetiColumns>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiCover>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiGrid>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiIcon>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiMasonry>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiOverlay>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiScroller>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiSidebar>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiStack>>().toEqualTypeOf<YetiGap | undefined>();
expectTypeOf<GapOf<YetiTimeline>>().toEqualTypeOf<YetiGap | undefined>();

expectTypeOf<AlignOf<YetiCluster>>().toEqualTypeOf<YetiAlign | undefined>();
expectTypeOf<AlignOf<NgxYetiColumns>>().toEqualTypeOf<YetiAlign | undefined>();
expectTypeOf<AlignOf<YetiIcon>>().toEqualTypeOf<YetiAlign | undefined>();
expectTypeOf<AlignOf<YetiLayer>>().toEqualTypeOf<YetiAlign | undefined>();
expectTypeOf<AlignOf<YetiSidebar>>().toEqualTypeOf<YetiAlign | undefined>();
expectTypeOf<AlignOf<YetiStack>>().toEqualTypeOf<YetiAlign | undefined>();
// The one decided exception: a table cell's `align` is the narrower
// `YetiTableAlign`, and the table's usage rule keeps every other `align`
// directive off a cell (ticket 50 decision 39).
expectTypeOf<AlignOf<YetiTableCell>>().toEqualTypeOf<
  YetiTableAlign | undefined
>();
expectTypeOf<YetiTableAlign>().toExtend<YetiAlign>();

expectTypeOf<YetiSidebarChild['sticky']>().toEqualTypeOf<BooleanInput>();
expectTypeOf<YetiStackChild['sticky']>().toEqualTypeOf<BooleanInput>();
expectTypeOf<YetiTableHead['sticky']>().toEqualTypeOf<BooleanInput>();

const packageRoot = join(import.meta.dirname, '..');

/** The source files that declare `name` as an input, as `<item>/src/<file>`. */
function declaringFiles(name: string): string[] {
  const declaration = new RegExp(`^\\s*readonly ${name} = input\\b`, 'm');

  return Array.from(
    readdirSync(packageRoot, { recursive: true, encoding: 'utf8' }),
  )
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        /^[^/]+\/src\/[^/]+\.ts$/.test(file) &&
        !/\.(?:spec|stories)\.ts$/.test(file) &&
        declaration.test(readFileSync(join(packageRoot, file), 'utf8')),
    )
    .toSorted();
}

@Component({
  selector: 'yeti-shared-gap-fixture',
  imports: [YetiCenter, YetiBox],
  template: '<div yetiCenter yetiBox [gap]="gap"><p i18n>Centred</p></div>',
})
class SharedGapFixture {
  protected readonly gap: YetiGap = 'lg';
}

describe('shared input names', () => {
  it('are type-checked above for every directive that declares gap, align, or sticky', () => {
    expect(declaringFiles('gap')).toStrictEqual([
      'box/src/box.ts',
      'breakout/src/breakout.ts',
      'center/src/center.ts',
      'cluster/src/cluster.ts',
      'columns/src/columns.ts',
      'cover/src/cover.ts',
      'grid/src/grid.ts',
      'icon/src/icon.ts',
      'masonry/src/masonry.ts',
      'overlay/src/overlay.ts',
      'scroller/src/scroller.ts',
      'sidebar/src/sidebar.ts',
      'stack/src/stack.ts',
      'timeline/src/timeline.ts',
    ]);
    expect(declaringFiles('align')).toStrictEqual([
      'cluster/src/cluster.ts',
      'columns/src/columns.ts',
      'icon/src/icon.ts',
      'layer/src/layer.ts',
      'sidebar/src/sidebar.ts',
      'stack/src/stack.ts',
      'table/src/table-cell.ts',
    ]);
    expect(declaringFiles('sticky')).toStrictEqual([
      'sidebar/src/sidebar-child.ts',
      'stack/src/stack-child.ts',
      'table/src/table-head.ts',
    ]);
  });

  it('render one data-gap with the bound value for two directives sharing gap on one element', async () => {
    expect.assertions(4);

    const [host, ...rest] = openingTags(
      await renderServer(SharedGapFixture),
      'div',
    );
    assert.exists(host);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(host, 'class')).toBe('center box');
    expect(host.match(/\sdata-gap=/g)).toHaveLength(1);
    expect(attributeValue(host, 'data-gap')).toBe('lg');
  });
});
