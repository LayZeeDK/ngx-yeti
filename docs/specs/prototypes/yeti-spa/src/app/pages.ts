// PROTOTYPE (ticket 20): Yeti markup in routed views, @if, and @defer.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OwnEnter, OwnTabs, OwnToc } from './owned';

@Component({
  selector: 'app-tabs-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Tabs page</h1>
    <div class="enter" data-once data-enter="rise" id="enter1"><p>Enter me</p></div>
    <p>
      <a href="#t-target" id="frag-plain">plain #t-target</a> |
      <a href="tabs#t-target" id="frag-path">path tabs#t-target</a> |
      <a [routerLink]="[]" fragment="t-target" id="frag-router">routerLink fragment</a>
    </p>
    <div class="tabs" id="tabs1">
      <div role="tablist" aria-label="Demo">
        <button type="button" role="tab" id="tab-a" aria-controls="panel-a">A</button>
        <button type="button" role="tab" id="tab-b" aria-controls="panel-b">B</button>
      </div>
      <section role="tabpanel" id="panel-a" aria-labelledby="tab-a"><p>Panel A</p></section>
      <section role="tabpanel" id="panel-b" aria-labelledby="tab-b"><p id="t-target">Panel B target</p></section>
    </div>
    <div class="dropdown">
      <button class="button" type="button" popovertarget="route-pop" id="route-pop-btn">Route popover</button>
      <div id="route-pop" popover><a routerLink="/other" id="route-pop-link">Other</a></div>
    </div>
    <nav class="toc" id="toc1" aria-label="Hash toc">
      <a href="#h1" id="toc1-h1">One</a> <a href="#h2" id="toc1-h2">Two</a>
    </nav>
    <nav class="toc" id="toc2" aria-label="Path toc">
      <a href="tabs#h1" id="toc2-h1">One</a> <a href="tabs#h2" id="toc2-h2">Two</a>
    </nav>
    <h2 id="h1">One</h2>
    <div style="height: 150vh"></div>
    <h2 id="h2">Two</h2>
    <div style="height: 150vh"></div>
  `,
})
export class TabsPage {}

@Component({
  selector: 'app-other-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 id="other-h">Other page</h1>`,
})
export class OtherPage {}

@Component({
  selector: 'app-late-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Late page</h1>
    <button class="button" type="button" id="toggle" (click)="show.set(!show())">Toggle</button>
    @if (show()) {
      <div class="tabs" id="tabs-if">
        <div role="tablist" aria-label="If">
          <button type="button" role="tab" id="if-a" aria-controls="if-pa">A</button>
          <button type="button" role="tab" id="if-b" aria-controls="if-pb">B</button>
        </div>
        <section role="tabpanel" id="if-pa" aria-labelledby="if-a"><p>If A</p></section>
        <section role="tabpanel" id="if-pb" aria-labelledby="if-b"><p>If B</p></section>
      </div>
      <div class="enter" data-once data-enter="rise" id="enter-if"><p>Enter if</p></div>
      <div class="alert" role="status" id="alert-if">
        <div>Alert in &#64;if</div>
        <button type="button" data-close aria-label="Dismiss" id="alert-close">x</button>
      </div>
    }
    @defer (on timer(200ms)) {
      <div class="tabs" id="tabs-defer">
        <div role="tablist" aria-label="Defer">
          <button type="button" role="tab" id="df-a" aria-controls="df-pa">A</button>
          <button type="button" role="tab" id="df-b" aria-controls="df-pb">B</button>
        </div>
        <section role="tabpanel" id="df-pa" aria-labelledby="df-a"><p>Defer A</p></section>
        <section role="tabpanel" id="df-pb" aria-labelledby="df-b"><p>Defer B</p></section>
      </div>
    }
  `,
})
export class LatePage {
  protected readonly show = signal(false);
}

@Component({
  selector: 'app-owned-page',
  imports: [OwnTabs, OwnToc, OwnEnter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Owned page (directives own the behaviour)</h1>
    <div class="enter" data-once data-enter="rise" id="own-enter" nfsOwnEnter><p>Enter owned</p></div>
    <div class="tabs" id="tabs-own" nfsOwnTabs>
      <div role="tablist" aria-label="Owned">
        <button type="button" role="tab" id="own-a" aria-controls="own-pa">A</button>
        <button type="button" role="tab" id="own-b" aria-controls="own-pb">B</button>
      </div>
      <section role="tabpanel" id="own-pa" aria-labelledby="own-a"><p>Own A</p></section>
      <section role="tabpanel" id="own-pb" aria-labelledby="own-b"><p id="own-target">Own B</p></section>
    </div>
    <nav class="toc" id="toc-own" aria-label="Owned toc" nfsOwnToc>
      <a href="#oh1" id="toco-h1">One</a> <a href="#oh2" id="toco-h2">Two</a>
    </nav>
    <h2 id="oh1">One</h2>
    <div style="height: 150vh"></div>
    <h2 id="oh2">Two</h2>
    <div style="height: 150vh"></div>
  `,
})
export class OwnedPage {}

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Home page</h1>`,
})
export class HomePage {}
