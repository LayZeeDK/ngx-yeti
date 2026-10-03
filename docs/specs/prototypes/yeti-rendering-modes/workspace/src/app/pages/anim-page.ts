import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

// PROTOTYPE (ticket 18): animate.enter and animate.leave next to Yeti's own
// transitions, its enter utility, and alert.js removing a node Angular owns.
@Component({
  selector: 'app-anim-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container stack">
      <div class="cluster">
        <button class="button" data-testid="t-dialog" (click)="dialog.set(!dialog())">dialog</button>
        <button class="button" data-testid="t-enterclass" (click)="enterClass.set(!enterClass())">animate.enter=enter</button>
        <button class="button" data-testid="t-enterstatic" (click)="enterStatic.set(!enterStatic())">static .enter</button>
        <button class="button" data-testid="t-enteronce" (click)="enterOnce.set(!enterOnce())">.enter[data-once]</button>
        <button class="button" data-testid="t-alert" (click)="alert.set(!alert())">alert (alert.js)</button>
        <button class="button" data-testid="t-alert2" (click)="alert2.set(!alert2())">alert (animate.leave)</button>
      </div>

      @if (dialog()) {
        <dialog class="dialog" open data-testid="an-dialog" animate.leave="t-leave-dialog"><p>Non-modal, open on insert.</p></dialog>
      }
      @if (enterClass()) {
        <div class="box" data-testid="an-enterclass" animate.enter="enter">animate.enter with Yeti's .enter</div>
      }
      @if (enterStatic()) {
        <div class="box enter" data-testid="an-enterstatic">static .enter</div>
      }
      @if (enterOnce()) {
        <div class="box enter" data-once data-testid="an-enteronce">.enter[data-once], inserted after load</div>
      }
      @if (alert()) {
        <div class="alert" role="status" data-variant="success" data-testid="an-alert">
          <div><strong>Saved.</strong> alert.js closes this.</div>
          <button type="button" data-close aria-label="Dismiss" data-testid="an-alert-close">x</button>
        </div>
      }
      @if (alert2()) {
        <div class="alert" role="status" data-variant="warning" data-testid="an-alert2" animate.leave="t-leave-anim">
          <div>Angular removes this with animate.leave.</div>
        </div>
      }
      <p class="enter" data-once data-testid="an-once-ssr">Server-rendered .enter[data-once]</p>
    </main>
  `,
})
export class AnimPage {
  protected readonly dialog = signal(false);
  protected readonly enterClass = signal(false);
  protected readonly enterStatic = signal(false);
  protected readonly enterOnce = signal(false);
  protected readonly alert = signal(true);
  protected readonly alert2 = signal(true);
}
