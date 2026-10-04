// A consumer of the packed tarball (tools/package/pack-check.mjs): every
// `ngx-yeti` import resolves through the tarball's own `exports`.
import { type ApplicationConfig, Component, Directive } from '@angular/core';
import type {
  YetiComponentName,
  YetiLift,
  YetiRatio,
  YetiVariant,
  YetiWidth,
} from 'ngx-yeti';
import { YetiCard, YetiCardLink } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';
import { injectYetiItemStyles, provideYetiStyles } from 'ngx-yeti/styles';

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
  imports: [YetiCard, YetiCardLink, NgxYetiLift, AppBadge],
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
  `,
})
export class App {
  protected readonly variant: YetiVariant = 'primary';
  protected readonly threshold: YetiWidth = 'md';
  protected readonly ratio: YetiRatio = '16/9';
  protected readonly lift: YetiLift = 'scale';
}
