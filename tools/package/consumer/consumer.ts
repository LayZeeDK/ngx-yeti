// A consumer of the packed tarball (tools/package/pack-check.mjs): every
// `ngx-yeti` import resolves through the tarball's own `exports`.
import { type ApplicationConfig, Component, Directive } from '@angular/core';
import type {
  YetiAlign,
  YetiComponentName,
  YetiGap,
  YetiLift,
  YetiRatio,
  YetiVariant,
  YetiWidth,
} from 'ngx-yeti';
import { NgxYetiPaint, YetiBorder, YetiBox, YetiText } from 'ngx-yeti/box';
import {
  YetiBreakout,
  YetiBreakoutChild,
  YetiBreakoutNote,
} from 'ngx-yeti/breakout';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { YetiCenter } from 'ngx-yeti/center';
import { YetiCluster } from 'ngx-yeti/cluster';
import { NgxYetiColumns, YetiColumnsChild } from 'ngx-yeti/columns';
import { YetiCover, YetiCoverChild } from 'ngx-yeti/cover';
import { NgxYetiEnter } from 'ngx-yeti/enter';
import { YetiFrame } from 'ngx-yeti/frame';
import { YetiGrid, YetiGridChild } from 'ngx-yeti/grid';
import { YetiLayer, YetiLayerChild } from 'ngx-yeti/layer';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { YetiMasonry } from 'ngx-yeti/masonry';
import { YetiOverlay, YetiOverlayChild } from 'ngx-yeti/overlay';
import { type YetiScrollerJustify, YetiScroller } from 'ngx-yeti/scroller';
import { YetiSidebar, YetiSidebarChild } from 'ngx-yeti/sidebar';
import { YetiSpinner } from 'ngx-yeti/spinner';
import { YetiStack, YetiStackChild } from 'ngx-yeti/stack';
import { injectYetiItemStyles, provideYetiStyles } from 'ngx-yeti/styles';
import { YetiTimeline } from 'ngx-yeti/timeline';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';
export {} from 'ngx-yeti/button';
export {} from 'ngx-yeti/container';
export {} from 'ngx-yeti/icon';
export {} from 'ngx-yeti/table';

const preload: readonly YetiComponentName[] = ['card', 'lift'];

export const appConfig: ApplicationConfig = {
  providers: [provideYetiStyles({ url: 'yeti-css/', preload })],
};

/** A consumer's own item root directive, as the setup spec's helper allows. */
@Directive({ selector: '[appBadge]' })
export class AppBadge {
  constructor() {
    injectYetiItemStyles('badge');
  }
}

@Component({
  selector: 'app-root',
  imports: [
    YetiCard,
    YetiCardLink,
    NgxYetiLift,
    YetiStack,
    YetiStackChild,
    YetiCenter,
    YetiBox,
    YetiBorder,
    NgxYetiPaint,
    YetiText,
    YetiBreakout,
    YetiBreakoutChild,
    YetiBreakoutNote,
    YetiCluster,
    NgxYetiColumns,
    YetiColumnsChild,
    YetiCover,
    YetiCoverChild,
    NgxYetiEnter,
    YetiFrame,
    YetiGrid,
    YetiGridChild,
    YetiLayer,
    YetiLayerChild,
    YetiMasonry,
    YetiOverlay,
    YetiOverlayChild,
    YetiScroller,
    YetiSidebar,
    YetiSidebarChild,
    YetiSpinner,
    YetiTimeline,
    YetiVisuallyHidden,
    AppBadge,
  ],
  template: `
    <article
      yetiCard
      [variant]="variant"
      [threshold]="threshold"
      [ratio]="ratio"
      raised
      [yetiLift]="lift"
      #card="yetiCard"
    >
      <h2>
        <a href="/docs" yetiCardLink stretch #link="yetiCardLink">Docs</a>
      </h2>
      <span appBadge>{{ card.raised() }} {{ link.stretch() }}</span>
    </article>
    <article yetiCard yetiLift></article>
    <div yetiStack [gap]="gap" [align]="align" fill #stack="yetiStack">
      <main yetiCenter [max]="threshold" [gap]="gap" #center="yetiCenter">
        {{ stack.rule() }} {{ center.intrinsic() }}
      </main>
      <p yetiStackChild split [space]="gap" #child="yetiStackChild">
        {{ child.sticky() }}
      </p>
    </div>
    <section yetiBox [gap]="gap" surface="raised" yetiBorder #box="yetiBox">
      <p yetiPaint="primary" yetiText="white">{{ box.surface() }}</p>
    </section>
    <div yetiBreakout>
      <p yetiBreakoutChild>Wide</p>
      <aside yetiBreakoutNote>Note</aside>
    </div>
    <ul yetiCluster [gap]="gap">
      <li>One</li>
    </ul>
    <div yetiColumns>
      <p yetiColumnsChild>Column</p>
    </div>
    <div yetiCover>
      <h2 yetiCoverChild>Cover</h2>
    </div>
    <p yetiEnter="rise">Arrives</p>
    <div yetiFrame [ratio]="ratio">
      <img src="/photo.jpg" alt="A photo" />
    </div>
    <ul yetiGrid [gap]="gap">
      <li yetiGridChild>Cell</li>
    </ul>
    <figure yetiLayer>
      <figcaption yetiLayerChild>Caption</figcaption>
    </figure>
    <div yetiMasonry>
      <p>Brick</p>
    </div>
    <div yetiOverlay>
      <p yetiOverlayChild>Over</p>
    </div>
    <ul yetiScroller [justify]="justify" [gap]="gap">
      <li>Slide</li>
    </ul>
    <div yetiSidebar>
      <nav yetiSidebarChild>Side</nav>
      <main>Main</main>
    </div>
    <span yetiSpinner [variant]="variant"></span>
    <ol yetiTimeline>
      <li>Entry</li>
    </ol>
    <span yetiVisuallyHidden>Hidden label</span>
  `,
})
export class App {
  protected readonly variant: YetiVariant = 'primary';
  protected readonly threshold: YetiWidth = 'md';
  protected readonly ratio: YetiRatio = '16/9';
  protected readonly lift: YetiLift = 'scale';
  protected readonly gap: YetiGap = 'sm-lg';
  protected readonly align: YetiAlign = 'start';
  protected readonly justify: YetiScrollerJustify = 'center';
}
