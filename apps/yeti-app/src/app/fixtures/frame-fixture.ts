import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiFrame } from 'ngx-yeti/frame';

/** A green clip, 32 by 18 pixels and a fifth of a second long, in WebM. */
const clip =
  'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAH3EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggEjTbuMU6uEHFO7a1OsggHh7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjIuMy4xMDBXQYxMYXZmNjIuMy4xMDBEiYhAaQAAAAAAABZUrmvIrgEAAAAAAAA/14EBc8WIb3FjNkADYCCcgQAitZyDdW5kiIEAhoVWX1ZQOIOBASPjg4QL68IA4JCwgSC6gRKagQJVsIRVuYEBElTDZ/tzc59jwIBnyJlFo4dFTkNPREVSRIeMTGF2ZjYyLjMuMTAwc3PWY8CLY8WIb3FjNkADYCBnyKFFo4dFTkNPREVSRIeUTGF2YzYyLjExLjEwMCBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjIwMDAwMDAwMAAfQ7Z1ueeBAKO0gQAAgJACAJ0BKiAAEgAARwiFhYiFhIgCAgJ1qgIH+RXeYP77Gcuu8WlGv/mwP28+3nhYABxTu2uRu4+zgQC3iveBAfGCAaPwgQM=';

/**
 * The frame spec's Fixture-app route (frame.md:273-281): a photo in `fill`
 * mode whose frame alone reserves its shape while it loads, a `21/9`
 * panorama, an `iframe` with `srcdoc`, a `video` with a `src` attribute and
 * one with `<source>` children and controls, which one control removes; a
 * frame in a `hydrate never` block; and a frame in a client-only `@defer`
 * (the app preloads `frame`).
 */
@Component({
  selector: 'app-frame-fixture',
  imports: [NgOptimizedImage, RouterLink, YetiFrame],
  template: `<h2>Frames</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live frames
    </button>
    <a routerLink="/replay">Leave for a page without frames</a>
    @if (live()) {
      <div id="photo-frame" yetiFrame ratio="16/9" class="app-positioned">
        <img
          ngSrc="trail.svg"
          fill
          alt="A mountain trail at dusk under a pale sun"
          i18n-alt
        />
      </div>
      <p id="after-photo" i18n>The trail climbs north from the lake.</p>
      <div id="wide-frame" yetiFrame ratio="21/9" class="app-positioned">
        <img
          ngSrc="trail.svg"
          fill
          alt="The ridge above the lake in a wide strip"
        />
      </div>
      <div id="srcdoc-frame" yetiFrame ratio="4/3">
        <iframe
          title="Trail notes"
          srcdoc='&lt;!doctype html&gt;&lt;html lang="en"&gt;&lt;title&gt;Trail notes&lt;/title&gt;&lt;p&gt;Six miles and one summit.&lt;/p&gt;&lt;/html&gt;'
        ></iframe>
      </div>
      <div id="video-src-frame" yetiFrame>
        <video src="${clip}" muted></video>
      </div>
      <div id="video-source-frame" yetiFrame>
        <video controls muted>
          <source src="${clip}" type="video/webm" />
        </video>
      </div>
    }
    @defer (hydrate never) {
      <div id="never-frame" yetiFrame ratio="4/3" class="app-positioned">
        <img
          ngSrc="trail.svg"
          fill
          alt="The trail's hills, cropped to four by three"
        />
      </div>
    }
    @defer (on interaction) {
      <div id="client-frame" yetiFrame ratio="1/1" class="app-positioned">
        <img ngSrc="trail.svg" fill alt="The trail's hills, cropped square" />
      </div>
    } @placeholder {
      <button type="button">Show the client-only frame</button>
    }`,
  styles: `
    .app-positioned {
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameFixture {
  protected readonly live = signal(true);
}
