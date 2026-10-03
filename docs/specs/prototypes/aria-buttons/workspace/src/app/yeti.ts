// PROTOTYPE (ticket 29, buttons): the package's directives, sketched only as far as
// ticket 25 row 27 needs them. Not the package's API.
import { booleanAttribute, Directive, input, model } from '@angular/core';

/** `.buttons` group: Yeti's data-gap and data-affix (buttons/manifest.json). */
@Directive({
  selector: '[yetiButtons]',
  host: {
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-affix]': 'affix() ? "" : null',
  },
})
export class YetiButtons {
  readonly gap = input<string>();
  readonly affix = input(false, { transform: booleanAttribute });
}

/**
 * `.button` member: a toggle moves aria-pressed (the "script" Yeti's docs leave to the page),
 * and busy sets aria-busy plus aria-disabled, as button.css's busy comment describes.
 */
@Directive({
  selector: '[yetiButton]',
  host: {
    '[attr.aria-pressed]': 'pressed() ?? null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '[attr.aria-disabled]': 'busy() ? "true" : null',
    '(click)': 'toggle()',
  },
})
export class YetiButton {
  readonly pressed = model<boolean | undefined>(undefined);
  readonly busy = input(false, { transform: booleanAttribute });

  toggle() {
    const p = this.pressed();

    if (p !== undefined) {
      this.pressed.set(!p);
    }
  }
}
