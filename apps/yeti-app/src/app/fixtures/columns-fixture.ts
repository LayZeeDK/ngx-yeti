import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { NgxYetiColumns, YetiColumnsChild } from 'ngx-yeti/columns';

/**
 * The columns spec's Fixture-app route (columns.md:299-305): Yeti's example
 * with a static `align` and a spanning child, which one control removes; a
 * layout in a `hydrate never` block; and a layout in a client-only `@defer`
 * (the app preloads `columns`). The `h2` puts the columns' `h3` one level
 * below a heading, as axe's `heading-order` asks under the app's `h1`.
 */
@Component({
  selector: 'app-columns-fixture',
  imports: [RouterLink, YetiBorder, YetiBox, NgxYetiColumns, YetiColumnsChild],
  template: `<h2>Trail plans</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live columns
    </button>
    <a routerLink="/replay">Leave for a page without columns</a>
    @if (live()) {
      <div id="live-columns" yetiColumns threshold="md" align="center">
        <section id="plan" yetiBox surface="raised" yetiBorder>
          <h3 i18n>Plan</h3>
          <p>Three equal columns in a wide container.</p>
        </section>
        <section id="build" yetiBox surface="raised" yetiBorder>
          <h3>Build</h3>
          <p>Three rows in a narrow one.</p>
        </section>
        <section
          id="ship"
          yetiBox
          surface="raised"
          yetiBorder
          yetiColumnsChild
          span="2"
        >
          <h3>Ship</h3>
          <p>No breakpoint anywhere.</p>
        </section>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-columns" yetiColumns threshold="2xs">
        <p>A layout that never hydrates.</p>
        <p>The server rendered it.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-columns" yetiColumns threshold="2xs">
        <p>A layout from the client.</p>
        <p>Its second column.</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only columns</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnsFixture {
  protected readonly live = signal(true);
}
