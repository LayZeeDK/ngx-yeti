import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { rec } from '../rec';

// PROTOTYPE (ticket 18): Yeti items that carry translated text. Without
// withI18nSupport() the server marks this component ngSkipHydration.
@Component({
  selector: 'app-i18n-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container stack">
      <article class="card" data-threshold="xs" data-testid="card">
        <h3 i18n="@@cardTitle">Weekend in the hills</h3>
        <p i18n="@@cardBody">Six miles, <strong>one summit</strong>, and {views, plural, =1 {one view} other {{{views}} views}}.</p>
        <footer>
          <a class="button" href="/hills" data-emphasis="low" i18n="@@cardMore">Read more</a>
        </footer>
      </article>
      <button class="button" type="button" commandfor="dlg" command="show-modal" data-testid="dialog-open" i18n="@@dialogOpen">Delete project</button>
      <dialog class="dialog" id="dlg" aria-labelledby="dlg-title" data-testid="dialog">
        <h2 id="dlg-title" i18n="@@dialogTitle">Delete this project?</h2>
        <form method="dialog"><button class="button" type="submit">OK</button></form>
      </dialog>
      <div class="tabs" data-testid="tabs">
        <div role="tablist" aria-label="Account">
          <button type="button" role="tab" id="tab-a" aria-controls="panel-a" data-testid="tab-a" i18n="@@tabA">Profile</button>
          <button type="button" role="tab" id="tab-b" aria-controls="panel-b" data-testid="tab-b" i18n="@@tabB">Billing</button>
        </div>
        <section role="tabpanel" id="panel-a" aria-labelledby="tab-a"><p>A</p></section>
        <section role="tabpanel" id="panel-b" aria-labelledby="tab-b"><p>B</p></section>
      </div>
      <button class="button" type="button" data-testid="counter" (click)="clicks.set(clicks() + 1); hit()">Clicked {{ clicks() }}</button>
    </main>
  `,
})
export class I18nPage {
  protected readonly views = 3;
  protected readonly clicks = signal(0);

  protected hit(): void {
    rec('counterClick');
  }
}
