import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiSidebar, YetiSidebarChild } from 'ngx-yeti/sidebar';

/**
 * The sidebar spec's Fixture-app route (sidebar.md:310-317): section 8's
 * markup with a sticky `nav`, a long article, and a static `align`; a
 * stacked sidebar holding a center, the reference for the order with
 * `center`; both removed by one control; a sidebar that is also a box in a
 * `hydrate never` block; and the same sidebar holding a center in a
 * client-only `@defer` (the app preloads `sidebar` and `center`). The lone
 * center outside every sidebar keeps the `center` link in place, so the
 * client-only sidebar's link can arrive after it. The `h2` puts the
 * article's `h3` one level below a heading, as axe's `heading-order` asks
 * under the app's `h1`.
 */
@Component({
  selector: 'app-sidebar-fixture',
  imports: [
    RouterLink,
    YetiBorder,
    YetiBox,
    YetiCenter,
    YetiSidebar,
    YetiSidebarChild,
  ],
  template: `<h2>Trail guide</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live sidebars
    </button>
    <a routerLink="/replay">Leave for a page without sidebars</a>
    <div id="lone-center" yetiCenter max="xs">
      <p>A centred note outside every sidebar.</p>
    </div>
    @if (live()) {
      <div id="live-sidebar" yetiSidebar width="xs" gap="lg" align="center">
        <nav
          id="sticky-nav"
          yetiBox
          yetiBorder
          surface="raised"
          yetiSidebarChild
          sticky
          aria-label="Section"
        >
          <a href="#trail-notes">Overview</a>
        </nav>
        <article
          id="live-article"
          class="app-sidebar-long"
          yetiBox
          yetiBorder
          surface="raised"
        >
          <h3 id="trail-notes">Trail notes</h3>
          <p i18n>
            Takes the remaining width, and the whole width once the two no
            longer fit.
          </p>
        </article>
      </div>
      <div id="reference-sidebar" yetiSidebar width="lg" gap="lg">
        <div><p>Filters for the trail list.</p></div>
        <div id="reference-center" yetiCenter max="2xs">
          <p>A centred column inside a sidebar.</p>
        </div>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-sidebar" yetiSidebar yetiBox gap="lg">
        <div><p>A sidebar that never hydrates.</p></div>
        <div><p>It is a box as well.</p></div>
      </div>
    }
    @defer (on interaction) {
      <div id="client-sidebar" yetiSidebar width="lg" gap="lg">
        <div><p>Filters for the trail list.</p></div>
        <div id="client-center" yetiCenter max="2xs">
          <p>A centred column inside a sidebar.</p>
        </div>
      </div>
    } @placeholder {
      <button type="button">Show the client-only sidebar</button>
    }`,
  styles: `
    .app-sidebar-long {
      min-block-size: 150vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFixture {
  protected readonly live = signal(true);
}
