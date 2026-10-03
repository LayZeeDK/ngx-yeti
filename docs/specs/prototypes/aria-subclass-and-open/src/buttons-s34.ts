// PROTOTYPE (ticket 34, point 1): Aria Toolbar fitted to Yeti's buttons two ways.
// (C) composition, ticket 30's yetiButtons/yetiButton unchanged.
// (S) subclassing: the package's directives `extends` Aria's classes and put the
//     same overrides in their own `host` metadata.
import { booleanAttribute, Component, computed, contentChildren, Directive, inject, input, model, signal } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';

// ---------------------------------------------------------------- (C) composition, ticket 30

@Directive({
  selector: '[yetiButtonsC]',
  hostDirectives: [{ directive: Toolbar, inputs: ['orientation', 'wrap', 'softDisabled', 'disabled'] }],
  host: { '[attr.role]': '"toolbar"' },
})
export class YetiButtonsC {
  readonly buttons = contentChildren(YetiButtonC, { descendants: true });
  readonly ariaLive = computed(() => this.buttons().some((b) => b.widget.active()));
}

@Directive({
  selector: '[yetiButtonC]',
  hostDirectives: [{ directive: ToolbarWidget, inputs: ['disabled: busy'] }],
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '[attr.aria-pressed]': 'pressed() ?? null',
    '(click)': 'toggle()',
  },
})
export class YetiButtonC {
  readonly widget = inject(ToolbarWidget);
  readonly #group = inject(YetiButtonsC);
  readonly busy = input(false, { transform: booleanAttribute });
  readonly pressed = model<boolean | undefined>(undefined);

  protected readonly tabIndex = computed(() => {
    if (this.#group.ariaLive()) {
      return this.widget.active() ? 0 : -1;
    }

    return this.#group.buttons()[0] === this ? 0 : -1;
  });

  toggle() {
    const p = this.pressed();

    if (p !== undefined) {
      this.pressed.set(!p);
    }
  }
}

// ---------------------------------------------------------------- (S) subclassing

@Directive({
  selector: '[yetiButtonsS]',
  // Not inherited (ProvidersFeature has no ngInherit), and ToolbarWidget does inject(Toolbar).
  providers: [{ provide: Toolbar, useExisting: YetiButtonsS }],
  host: { '[attr.role]': '"toolbar"' },
})
export class YetiButtonsS extends Toolbar {
  readonly buttons = contentChildren(YetiButtonS, { descendants: true });
  readonly ariaLive = computed(() => this.buttons().some((b) => b.active()));
}

@Directive({
  selector: '[yetiButtonS]',
  // `inputs: ['disabled: busy']` here re-declared the inherited signal input as a plain
  // input and threw `ctx.disabled is not a function` (results/s34-alias-error.txt),
  // so busy is Aria's own `disabled` input.
  host: {
    '[attr.tabindex]': 'serverTabIndex()',
    '[attr.aria-busy]': 'disabled() ? "true" : null',
    '[attr.aria-pressed]': 'pressed() ?? null',
    '(click)': 'toggle()',
  },
})
export class YetiButtonS extends ToolbarWidget {
  readonly #group = inject(YetiButtonsS);
  readonly pressed = model<boolean | undefined>(undefined);

  protected readonly serverTabIndex = computed(() => {
    if (this.#group.ariaLive()) {
      return this.active() ? 0 : -1;
    }

    return this.#group.buttons()[0] === this ? 0 : -1;
  });

  toggle() {
    const p = this.pressed();

    if (p !== undefined) {
      this.pressed.set(!p);
    }
  }
}

// ---------------------------------------------------------------- pages

@Component({
  selector: 'app-s34-variants',
  imports: [YetiButtonsC, YetiButtonC, YetiButtonsS, YetiButtonS],
  template: `
    <section data-variant-id="C">
      <h2>(C) composition</h2>
      <div class="buttons" aria-label="Form actions" yetiButtonsC data-testid="c-action">
        <button class="button" type="submit" yetiButtonC>Save</button>
        <button class="button" type="button" data-emphasis="low" yetiButtonC>Cancel</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonC [busy]="true">Export</button>
      </div>
      <div class="buttons" role="group" aria-label="Text style" yetiButtonsC data-affix data-testid="c-toggle">
        <button class="button" type="button" data-emphasis="medium" yetiButtonC [(pressed)]="b1">Bold</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonC [(pressed)]="i1">Italic</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonC [(pressed)]="u1">Underline</button>
      </div>
    </section>
    <section data-variant-id="S">
      <h2>(S) subclass</h2>
      <div class="buttons" aria-label="Form actions" yetiButtonsS data-testid="s-action">
        <button class="button" type="submit" yetiButtonS>Save</button>
        <button class="button" type="button" data-emphasis="low" yetiButtonS>Cancel</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonS [disabled]="true">Export</button>
      </div>
      <div class="buttons" role="group" aria-label="Text style" yetiButtonsS data-affix data-testid="s-toggle">
        <button class="button" type="button" data-emphasis="medium" yetiButtonS [(pressed)]="b2">Bold</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonS [(pressed)]="i2">Italic</button>
        <button class="button" type="button" data-emphasis="medium" yetiButtonS [(pressed)]="u2">Underline</button>
      </div>
    </section>
  `,
})
export class S34Variants {
  readonly b1 = signal<boolean | undefined>(true);
  readonly i1 = signal<boolean | undefined>(false);
  readonly u1 = signal<boolean | undefined>(false);
  readonly b2 = signal<boolean | undefined>(true);
  readonly i2 = signal<boolean | undefined>(false);
  readonly u2 = signal<boolean | undefined>(false);
}

@Component({ selector: 'app-s34', imports: [S34Variants], template: '<app-s34-variants />' })
export class S34Page {}

@Component({
  selector: 'app-s34-never',
  imports: [S34Variants],
  template: '@defer (hydrate never) { <app-s34-variants /> }',
})
export class S34NeverPage {}
