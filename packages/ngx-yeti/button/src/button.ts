import { Directive, input } from '@angular/core';
import type { YetiEmphasis, YetiSizeControl, YetiVariant } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `button` on the consumer's `button`, `a`, submit `input`, or toggle
 * `label`: the `button` class, the typed `data-variant`, `data-emphasis`, and
 * `data-size` attributes, and the `button` and `spinner` item files, the
 * second for the busy ring (button spec, sections 2 to 4). Every state stays
 * the consumer's and the element's: `disabled`, `aria-pressed`, `aria-busy`,
 * `aria-disabled`, and a wrapped input's `checked`. The directive declares no
 * listener, no output, and no `disabled`, `pressed`, `busy`, or `type` input,
 * so a `[disabled]` binding on a `button` host reaches the native property.
 *
 * Usage rules:
 *
 * 1. Put `yetiButton` on a `button` for an action, on an `a` for navigation,
 *    on an `input type="submit"` where a form uses a submit input, or on a
 *    `label` that wraps exactly one `input type="checkbox"` or
 *    `type="radio"` as its first-level child, and on nothing else. The class
 *    changes the look, not the role.
 * 2. Give every `button` host an explicit `type`: `type="button"` for an
 *    action, `type="submit"` only for the form's submit. The directive binds
 *    no `type`.
 * 3. Disable a `button` or `input` host with its own native `disabled`,
 *    static or bound (`[disabled]="saving()"`); disable a toggle label
 *    through its wrapped input's `disabled`.
 * 4. Disable a link with two bindings together: `[disabled]` on the `a`, and
 *    its `href` or `routerLink` bound to `null` while disabled. A disabled
 *    link that keeps its target still navigates; an enabled `a[yetiButton]`
 *    without a target is not focusable. Import `YetiButtonDisabledLink`
 *    wherever a template binds `[disabled]` on an `a[yetiButton]`; without
 *    it the compiler reports NG8002, because `disabled` is not a property of
 *    `a`. Do not write a static `role` or `aria-disabled` on such a link.
 * 5. A toggle is a `label` wrapping a native checkbox or radio, which needs
 *    no script, or a `button` carrying `aria-pressed`, bound from a signal:
 *    `[attr.aria-pressed]="bold()"` with your own `(click)` handler moving
 *    it. Never write `aria-pressed` statically on a toggle that changes, and
 *    never put it on an `a` or a `label`.
 * 6. A toggle uses `emphasis="medium"` or `"low"`, whose pressed state
 *    changes from no fill to a solid fill; a high-emphasis toggle changes
 *    only from one shade of its hue to a darker one.
 * 7. A button that waits carries `[attr.aria-busy]` and
 *    `[attr.aria-disabled]` together, both `'true'` while it waits, and its
 *    handler ignores presses until the wait ends. It keeps focus because it
 *    stays enabled. A busy submit button still submits on Enter and on
 *    click, so the form's submit handler checks the state too. Its visible
 *    label says what is happening ("Saving"), and your own live region
 *    announces the result where it is a status message. Inside a `buttons`
 *    group that hosts Aria Toolbar, the `aria-disabled` half goes through
 *    the group item's `busy` instead.
 * 8. An icon-only button has a name: give the SVG `role="img"` and an
 *    `aria-label`, or the button an `aria-label`. A decorative icon beside a
 *    text label has `aria-hidden="true"`, so the name is the visible text.
 * 9. Do not write `class="button"`, `data-variant`, `data-emphasis`,
 *    `data-size`, or `data-ngx-yeti-item-button` statically on a host; the
 *    directive binds them. A value newer than the pin goes through `$any`
 *    (`[variant]="$any('accent')"`).
 * 10. Put no `(click)` handler on an `a[yetiButton]`; an action is a
 *     `button` (rule 1). A `click` listener on an `<a>` makes Angular's
 *     dispatcher cancel its navigation inside a still-dehydrated block.
 * 11. Bind every input from values that are the same on the server and the
 *     client, never from a browser-only read.
 * 12. Import `YetiButton` in every component whose template writes
 *     `yetiButton`. A forgotten import with only static inputs renders the
 *     browser's own button with no error; a bound input (`[variant]`) makes
 *     the compiler report NG8002, and a template reference naming
 *     `yetiButton` NG8003.
 *
 * For a button first rendered on the client, add `button` and `spinner` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector:
    'button[yetiButton], a[yetiButton], input[yetiButton], label[yetiButton]',
  host: {
    class: 'button',
    'data-ngx-yeti-item-button': '',
    '[attr.data-variant]': 'variant() ?? null',
    '[attr.data-emphasis]': 'emphasis() ?? null',
    '[attr.data-size]': 'size() ?? null',
  },
  exportAs: 'yetiButton',
})
export class YetiButton {
  /** Which hue's ladder the button uses. Unset, Yeti's `primary` applies. */
  readonly variant = input<YetiVariant>();
  /**
   * How loud: `high` is a solid fill, `medium` an outline, `low` text alone.
   * Unset, Yeti's `high` applies.
   */
  readonly emphasis = input<YetiEmphasis>();
  /**
   * Scales the text and the padding together. Unset, Yeti's `md` applies.
   * HTML's own `size` attribute does nothing on the button's hosts.
   */
  readonly size = input<YetiSizeControl>();

  constructor() {
    injectYetiItemStyles('button');
    // The busy ring is spinner.css's rule, so a busy button needs that file.
    injectYetiItemStyles('spinner');
  }
}
