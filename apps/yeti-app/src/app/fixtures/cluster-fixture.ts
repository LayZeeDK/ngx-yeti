import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiCluster } from 'ngx-yeti/cluster';
import { NgxYetiEnter } from 'ngx-yeti/enter';

/**
 * The cluster spec's Fixture-app route (cluster.md:306-313): a list of tags,
 * a row of links in a narrow frame so it wraps, a cluster written with the
 * static `align`, a thresholded cluster in a frame below every threshold, and
 * a cluster that is also an arrival; a cluster and a cluster shared with
 * `yetiEnter` in a `hydrate never` block; and a cluster in a client-only
 * `@defer` (the app preloads `cluster`). One control removes the live
 * clusters, the live arrival among them.
 */
@Component({
  selector: 'app-cluster-fixture',
  imports: [NgxYetiEnter, RouterLink, YetiCluster],
  template: `<h2>Clusters</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live clusters
    </button>
    <a routerLink="/replay">Leave for a page without clusters</a>
    @if (live()) {
      <ul id="tags-cluster" yetiCluster gap="xs" role="list">
        <li i18n>css</li>
        <li>layout</li>
        <li>intrinsic</li>
      </ul>
      <div class="app-cluster-wrap">
        <nav id="trails-cluster" yetiCluster gap="sm" aria-label="Trails">
          @for (trail of trails; track trail) {
            <a [href]="'#' + trail">{{ trail }}</a>
          }
        </nav>
      </div>
      <div id="aligned-cluster" yetiCluster align="baseline">
        <span>Distance</span>
        <span class="app-cluster-large">14.2 km</span>
      </div>
      <div class="app-cluster-narrow">
        <div id="threshold-cluster" yetiCluster threshold="sm" gap="xs">
          <span>Save</span>
          <span>Preview</span>
          <span>Discard</span>
        </div>
      </div>
      <ul
        id="arriving-cluster"
        yetiCluster
        yetiEnter="rise"
        stagger
        role="list"
      >
        <li>Hills</li>
        <li>Lakes</li>
        <li>Coast</li>
      </ul>
    }
    @defer (hydrate never) {
      <ul id="never-cluster" yetiCluster gap="sm" role="list">
        <li>A cluster that never hydrates</li>
        <li>The server rendered it</li>
      </ul>
      <ul id="never-shared" yetiCluster yetiEnter="rise" stagger role="list">
        <li>A row that arrived</li>
        <li>and never hydrates</li>
      </ul>
    }
    @defer (on interaction) {
      <ul id="client-cluster" yetiCluster gap="sm" role="list">
        <li>A cluster from the client</li>
        <li>Rendered after a click</li>
      </ul>
    } @placeholder {
      <button type="button">Show the client-only cluster</button>
    }`,
  styles: `
    .app-cluster-wrap {
      inline-size: 12rem;
    }

    .app-cluster-narrow {
      inline-size: 10rem;
    }

    .app-cluster-large {
      font-size: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClusterFixture {
  protected readonly live = signal(true);
  protected readonly trails = ['Ridge', 'Valley', 'Lake', 'Coast', 'Forest'];
}
