// PROTOTYPE (ticket 29, buttons): (A) ticket 25 row 27, role="group"; (B) Aria Toolbar.
// Both on Yeti's own markup (buttons/example.html, buttons/docs.md).
import { Component, signal } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';
import { YetiButton, YetiButtons } from './yeti';

@Component({
  selector: 'app-variants',
  imports: [YetiButtons, YetiButton, Toolbar, ToolbarWidget],
  template: `
    <section class="variant" data-variant-id="A">
      <h2>(A) role="group"</h2>
      <div class="buttons" role="group" aria-label="Form actions" yetiButtons data-testid="a-action">
        <button class="button" type="submit">Save</button>
        <button class="button" type="button" data-emphasis="low">Cancel</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [busy]="true">Export</button>
      </div>
      <div class="buttons" role="group" aria-label="Text style" yetiButtons affix data-testid="a-toggle">
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="bold">Bold</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="italic">Italic</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="underline">Underline</button>
      </div>
    </section>

    <section class="variant" data-variant-id="B">
      <h2>(B) Aria Toolbar</h2>
      <div class="buttons" ngToolbar aria-label="Form actions" yetiButtons data-testid="b-action">
        <button class="button" type="submit" ngToolbarWidget>Save</button>
        <button class="button" type="button" data-emphasis="low" ngToolbarWidget>Cancel</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [busy]="true" ngToolbarWidget>Export</button>
      </div>
      <div class="buttons" ngToolbar aria-label="Text style" yetiButtons affix data-testid="b-toggle">
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="bold2" ngToolbarWidget>Bold</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="italic2" ngToolbarWidget>Italic</button>
        <button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="underline2" ngToolbarWidget>Underline</button>
      </div>
      <!-- Probes: what a consumer writing Yeti's markup by hand meets. -->
      <div class="buttons" role="group" ngToolbar aria-label="Probe" data-testid="b-probe">
        <button class="button" type="button" aria-disabled="true" aria-busy="true" ngToolbarWidget>Static busy</button>
        <button class="button" type="button" ngToolbarWidget [disabled]="true" aria-busy="true">Aria-disabled busy</button>
        <button class="button" type="button" tabindex="0" ngToolbarWidget>Static tabindex</button>
      </div>
    </section>
  `,
})
export class Variants {
  readonly bold = signal<boolean | undefined>(true);
  readonly italic = signal<boolean | undefined>(false);
  readonly underline = signal<boolean | undefined>(false);
  readonly bold2 = signal<boolean | undefined>(true);
  readonly italic2 = signal<boolean | undefined>(false);
  readonly underline2 = signal<boolean | undefined>(false);
}
