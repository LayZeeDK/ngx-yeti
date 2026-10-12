import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiButton, YetiButtonDisabledLink } from 'ngx-yeti/button';

/**
 * The button spec's Fixture-app route (button.md:348-356): section 8's
 * markup in a form that submits by GET to its own URL, a static disabled
 * link, a button the server renders busy, and a plain button where a later
 * item's dialog opener will stand; a busy button in a `hydrate never` block;
 * and a button in a client-only `@defer` (the app preloads `button` and
 * `spinner`). One control removes the live buttons. The route has no
 * spinner, so its `spinner` link is the buttons' own.
 */
@Component({
  selector: 'app-button-fixture',
  imports: [RouterLink, YetiButton, YetiButtonDisabledLink],
  template: `<h2 i18n>Buttons</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live buttons
    </button>
    <a routerLink="/replay">Leave for a page without buttons</a>
    <a routerLink="/spinner">Go to the spinner page</a>
    @if (live()) {
      <form id="button-form">
        <button id="save" yetiButton type="button">Save</button>
        <button
          id="bold"
          yetiButton
          type="button"
          emphasis="medium"
          [attr.aria-pressed]="bold()"
          (click)="pressBold()"
        >
          Bold
        </button>
        <output id="bold-presses">{{ presses() }}</output>
        <button
          id="send"
          yetiButton
          type="submit"
          [attr.aria-busy]="saving()"
          [attr.aria-disabled]="saving()"
        >
          Send
        </button>
        <label id="offline" yetiButton emphasis="medium"
          ><input type="checkbox" name="offline" value="yes" /> Keep maps
          offline</label
        >
        <a
          id="docs"
          yetiButton
          variant="secondary"
          size="lg"
          routerLink="/replay"
          >Read the docs</a
        >
        <a
          id="next"
          yetiButton
          [disabled]="last()"
          [routerLink]="last() ? null : '/replay'"
          >Next</a
        >
        <a id="previous" yetiButton disabled>Previous</a>
        <button
          id="busy"
          yetiButton
          type="button"
          [attr.aria-busy]="waiting()"
          [attr.aria-disabled]="waiting()"
        >
          Saving
        </button>
        <button id="opener" yetiButton type="button" emphasis="low">
          Open the dialog
        </button>
      </form>
    }
    @defer (hydrate never) {
      <button
        id="never-busy"
        yetiButton
        type="button"
        aria-busy="true"
        aria-disabled="true"
      >
        Archiving
      </button>
    }
    @defer (on interaction) {
      <button id="client-button" yetiButton type="button">
        A button from the client
      </button>
    } @placeholder {
      <button type="button">Show the client-only button</button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonFixture {
  protected readonly live = signal(true);
  protected readonly bold = signal(false);
  protected readonly presses = signal(0);
  protected readonly saving = signal(false);
  protected readonly last = signal(true);
  protected readonly waiting = signal(true);

  protected pressBold(): void {
    this.bold.update((bold) => !bold);
    this.presses.update((presses) => presses + 1);
  }
}
