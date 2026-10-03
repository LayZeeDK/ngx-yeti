import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { rec } from '../rec';

// PROTOTYPE (ticket 18): one item of each kind, in Yeti's own markup, plus
// Angular listeners that show which events reach Angular before and after hydration.
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:yeti:select)': 'onYetiSelect()' },
  template: `
    <main class="container stack" data-gap="lg">
      <h1>Yeti rendering modes</h1>

      <!-- Stateless: card (the i18n copy is on /i18n) -->
      <article class="card" data-threshold="xs" data-testid="card">
        <h3>Weekend in the hills</h3>
        <p>Six miles, <strong>one summit</strong>, and three views.</p>
        <footer>
          <a class="button" href="/hills" data-emphasis="low">Read more</a>
        </footer>
      </article>

      <!-- Layout: grid with Yeti's attribute vocabulary -->
      <div class="grid" data-min="xs" data-gap="md" data-testid="layout">
        <div class="box" data-surface="raised" data-border>One</div>
        <div class="box" data-surface="raised" data-border>Two</div>
        <div class="box" data-surface="raised" data-border>Three</div>
      </div>

      <!-- Native: dialog with invoker commands -->
      <button class="button" type="button" commandfor="dlg" command="show-modal" data-testid="dialog-open">Delete project</button>
      <dialog class="dialog" id="dlg" aria-labelledby="dlg-title" data-testid="dialog" (close)="count('dialogClose')">
        <h2 id="dlg-title">Delete this project?</h2>
        <p>Everything in it goes too.</p>
        <footer>
          <form method="dialog"><button class="button" type="submit" data-testid="dialog-cancel">Cancel</button></form>
        </footer>
      </dialog>

      <!-- Native: dropdown with popover -->
      <div class="dropdown">
        <button class="button" type="button" popovertarget="dd" data-emphasis="medium" data-testid="dropdown-open">Account</button>
        <div id="dd" popover data-testid="dropdown" (toggle)="count('popoverToggle')">
          <a href="#profile">Profile</a>
          <button type="button" (click)="count('dropdownItemClick')">Sign out</button>
        </div>
      </div>

      <!-- Native: accordion with details; the second binds [open] -->
      <div class="accordion">
        <details name="faq" data-testid="acc-plain" (toggle)="count('detailsToggle')">
          <summary data-testid="acc-plain-summary">Does Yeti need JavaScript?</summary>
          <p>Almost never.</p>
        </details>
        <details [open]="boundOpen()" data-testid="acc-bound">
          <summary data-testid="acc-bound-summary">Bound to a signal (initially closed)</summary>
          <p>Angular writes the open property from a signal.</p>
        </details>
        <details open data-testid="acc-static">
          <summary data-testid="acc-static-summary">Static open attribute in the template</summary>
          <p>Server-rendered open.</p>
        </details>
      </div>

      <!-- tabs.js with the author's own aria-selected in the template (static attribute) -->
      <div class="tabs" data-testid="tabs2">
        <div role="tablist" aria-label="Second">
          <button type="button" role="tab" id="t2a" aria-controls="p2a" aria-selected="true" data-testid="tab2-a">First</button>
          <button type="button" role="tab" id="t2b" aria-controls="p2b" data-testid="tab2-b">Second</button>
        </div>
        <section role="tabpanel" id="p2a" aria-labelledby="t2a"><p>One.</p></section>
        <section role="tabpanel" id="p2b" aria-labelledby="t2b"><p>Two.</p></section>
      </div>

      <!-- Module-driven: tabs (tabs.js) -->
      <div class="tabs" data-testid="tabs">
        <div role="tablist" aria-label="Account">
          <button type="button" role="tab" id="tab-a" aria-controls="panel-a" data-testid="tab-a">Profile</button>
          <button type="button" role="tab" id="tab-b" aria-controls="panel-b" data-testid="tab-b">Billing</button>
        </div>
        <section role="tabpanel" id="panel-a" aria-labelledby="tab-a"><p>Your name.</p></section>
        <section role="tabpanel" id="panel-b" aria-labelledby="tab-b"><p>Your plan.</p></section>
      </div>

      <!-- Module-driven: carousel (carousel.js) -->
      <section class="carousel" aria-roledescription="carousel" aria-label="Featured work" data-testid="carousel">
        <div data-track role="group" aria-label="Slides" tabindex="0">
          <article id="work-1" class="box" data-surface="raised" data-border data-slide><h3>A trail map</h3></article>
          <article id="work-2" class="box" data-surface="raised" data-border data-slide><h3>A field guide</h3></article>
          <article id="work-3" class="box" data-surface="raised" data-border data-slide><h3>Posters</h3></article>
        </div>
        <ol data-dots role="list">
          <li><a href="#work-1"><span class="visually-hidden">Slide 1</span></a></li>
          <li><a href="#work-2" data-testid="dot-2"><span class="visually-hidden">Slide 2</span></a></li>
          <li><a href="#work-3"><span class="visually-hidden">Slide 3</span></a></li>
        </ol>
      </section>

      <!-- Enter utility on server-rendered content -->
      <p class="enter" data-testid="enter-ssr">Arrives on load.</p>
      <p class="enter" data-once data-testid="enter-once-ssr">Arrives once seen (enter.js).</p>

      <!-- Angular-only listeners -->
      <div class="cluster">
        <button class="button" type="button" data-testid="counter" (click)="clicks.set(clicks() + 1); count('counterClick')">Clicked {{ clicks() }}</button>
        <label>Name <input data-testid="input" (input)="typed.set($any($event.target).value); count('input')" /></label>
        <output data-testid="mirror">{{ typed() }}</output>
        <output data-testid="yeti-select">{{ selects() }}</output>
        <output data-testid="plain-field">{{ plainField }}</output>
        <output data-testid="plain-slides">{{ plainSlides }}</output>
      </div>
    </main>
  `,
})
export class Home {
  protected readonly views = 3;
  protected readonly clicks = signal(0);
  protected readonly typed = signal('');
  protected readonly boundOpen = signal(false);
  protected readonly selects = signal(0);
  // Not a signal: only zone.js would refresh the view after a plain addEventListener write.
  protected plainField = 0;
  protected plainSlides = 0;

  constructor() {
    const host = inject(ElementRef<HTMLElement>);
    afterNextRender(() => {
      rec('homeRendered');
      host.nativeElement.querySelector('.tabs')?.addEventListener('yeti:select', () => {
        this.plainField++;
        rec('plainListener');
      });
      // Only a plain field changes here, with no signal and no template listener.
      host.nativeElement.querySelector('.carousel')?.addEventListener('yeti:slide', () => {
        this.plainSlides++;
        rec('plainSlide');
      });
    });
  }

  protected count(key: string): void {
    rec(key);
  }

  protected onYetiSelect(): void {
    this.selects.update((n) => n + 1);
    rec('yetiSelectHost');
  }
}
