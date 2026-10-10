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
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { YetiCenter } from 'ngx-yeti/center';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { YetiStack, YetiStackChild } from 'ngx-yeti/stack';
import { injectYetiItemStyles, provideYetiStyles } from 'ngx-yeti/styles';
export {} from 'ngx-yeti/box';
export {} from 'ngx-yeti/breakout';
export {} from 'ngx-yeti/button';
export {} from 'ngx-yeti/cluster';
export {} from 'ngx-yeti/columns';
export {} from 'ngx-yeti/container';
export {} from 'ngx-yeti/cover';
export {} from 'ngx-yeti/enter';
export {} from 'ngx-yeti/frame';
export {} from 'ngx-yeti/grid';
export {} from 'ngx-yeti/icon';
export {} from 'ngx-yeti/layer';
export {} from 'ngx-yeti/masonry';
export {} from 'ngx-yeti/overlay';
export {} from 'ngx-yeti/scroller';
export {} from 'ngx-yeti/sidebar';
export {} from 'ngx-yeti/spinner';
export {} from 'ngx-yeti/table';
export {} from 'ngx-yeti/timeline';
export {} from 'ngx-yeti/visually-hidden';

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
  `,
})
export class App {
  protected readonly variant: YetiVariant = 'primary';
  protected readonly threshold: YetiWidth = 'md';
  protected readonly ratio: YetiRatio = '16/9';
  protected readonly lift: YetiLift = 'scale';
  protected readonly gap: YetiGap = 'sm-lg';
  protected readonly align: YetiAlign = 'start';
}
