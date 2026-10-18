import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiBorder, YetiBox } from 'ngx-yeti/box';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiContainer, YetiHide, YetiShow } from 'ngx-yeti/container';

/**
 * The container spec's Fixture-app route (container.md:320-330): a container
 * as wide as the page and Yeti's example, which one control removes; a
 * container and a container shared with `yetiBox` in a `hydrate never`
 * block; and Yeti's paragraphs in a client-only `@defer` (the app preloads
 * `container`).
 */
@Component({
  selector: 'app-container-fixture',
  imports: [
    RouterLink,
    YetiBorder,
    YetiBox,
    YetiCluster,
    YetiContainer,
    YetiHide,
    YetiShow,
  ],
  template: `<h2>Containers</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live containers
    </button>
    <a routerLink="/replay">Leave for a page without containers</a>
    @if (live()) {
      <div id="wide-container" yetiContainer>
        <p i18n>A container as wide as the page.</p>
      </div>
      <div
        id="live-container"
        yetiContainer
        yetiBox
        surface="raised"
        yetiBorder
      >
        <nav yetiCluster aria-label="Site">
          <a routerLink="/box">Home</a>
          <a routerLink="/cluster">Docs</a>
          <a routerLink="/stack" yetiShow="sm">Guides</a>
          <a routerLink="/center" yetiShow="sm">Blog</a>
          <a routerLink="/grid" yetiShow="md">Changelog</a>
          <a routerLink="/cover" yetiShow="md">Community</a>
          <a routerLink="/sidebar" yetiShow="lg">Contact</a>
        </nav>
        <p id="narrow-text" yetiHide="sm">Narrower than sm: two links.</p>
        <p id="sm-text" yetiShow="sm" yetiHide="md">
          At least sm wide: four links.
        </p>
        <p id="md-text" yetiShow="md" yetiHide="lg">
          At least md wide: six links.
        </p>
        <p id="wide-text" yetiShow="lg">At least lg wide: every link.</p>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-container" yetiContainer>
        <p id="never-wide" yetiShow="sm">Shown from sm; never hydrates.</p>
        <p id="never-narrow" yetiHide="sm">Gone from sm; never hydrates.</p>
      </div>
      <div id="never-shared" yetiContainer yetiBox gap="lg">
        <p>A container that is a box and never hydrates.</p>
      </div>
    }
    @defer (on interaction) {
      <div id="client-container" yetiContainer>
        <p id="client-narrow" yetiHide="sm">Narrower than sm.</p>
        <p id="client-sm" yetiShow="sm" yetiHide="md">At least sm wide.</p>
        <p id="client-md" yetiShow="md" yetiHide="lg">At least md wide.</p>
        <p id="client-wide" yetiShow="lg">At least lg wide.</p>
      </div>
    } @placeholder {
      <button type="button">Show the client-only container</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerFixture {
  protected readonly live = signal(true);
}
