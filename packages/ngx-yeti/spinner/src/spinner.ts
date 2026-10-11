import { Directive, input } from '@angular/core';
import type { YetiSizeControl, YetiVariant } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `spinner` on the consumer's element: the `spinner` class, the typed
 * `data-variant` and `data-size` attributes, and the `spinner` item file
 * (spinner spec, sections 2 to 4). The role, the name, the visible text, and
 * the `@if` that inserts and removes the ring are the consumer's; the
 * directive adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiSpinner` on an empty, non-interactive inline element, `span`
 *    as Yeti's example writes it, placed in the line of text it belongs to.
 *    Never on a `button`, a link, or a form control, and never with content
 *    of its own: the host is a 1 em box whose border is the ring.
 * 2. A spinner that stands alone carries `role="status"` and a name,
 *    `aria-label` or `aria-labelledby`, such as "Loading". Never write
 *    `aria-label` without the role: a `span` has the generic role, which
 *    prohibits a name.
 * 3. Write visible text beside the ring that says what is waiting ("Loading
 *    the latest posts"), so the ring is never the only visual sign of the
 *    wait and its hue carries no meaning on its own.
 * 4. Where the visible text is already inside a status region of yours, the
 *    ring carries `aria-hidden="true"` and no role or name, so the wait is
 *    not announced twice.
 * 5. Insert the spinner when the work starts and remove it when the work
 *    ends, with `@if` or by leaving a `@defer` block's `@loading` state. The
 *    ring turns without end unless the user prefers reduced motion, and the
 *    essential-activity exception of WCAG 2.2.2 holds only while the work
 *    runs.
 * 6. Announce the end of the wait, its result or its failure, as a status
 *    message you write, in a status region present before the message
 *    changes. The spinner's own status says "waiting", not "done".
 * 7. Never put `yetiSpinner` inside a `yetiButton` to show a busy button.
 *    Set `aria-busy="true"` with `aria-disabled="true"` on the button and
 *    Yeti draws the ring after its label.
 * 8. Use `progress` for work with a known length; a spinner shows no value.
 * 9. Do not write `class="spinner"`, `data-variant`, `data-size`, or
 *    `data-ngx-yeti-item-spinner` statically on the host; the directive
 *    binds them. A value newer than the pin goes through `$any`
 *    (`[variant]="$any('info')"`).
 * 10. Bind every input and the `@if` that shows the spinner from values that
 *     are the same on the server and the client, never from a browser-only
 *     read.
 * 11. If you set `--yeti-spinner-duration`, also set it to `0.01ms` under
 *     `prefers-reduced-motion: reduce`, as Yeti does.
 * 12. Import `YetiSpinner` in every component whose template writes the
 *     attribute. A forgotten import with only static inputs renders an empty
 *     `span` with no ring and no error.
 *
 * For a spinner first rendered on the client, add `spinner` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiSpinner]',
  host: {
    class: 'spinner',
    'data-ngx-yeti-item-spinner': '',
    '[attr.data-variant]': 'variant() ?? null',
    '[attr.data-size]': 'size() ?? null',
  },
  exportAs: 'yetiSpinner',
})
export class YetiSpinner {
  /** The hue of the ring's bright edge. Unset, Yeti's `primary` applies. */
  readonly variant = input<YetiVariant>();
  /**
   * The text step the ring is one em of. Unset, Yeti's `md` applies. HTML's
   * own `size` attribute does nothing on the spinner's host.
   */
  readonly size = input<YetiSizeControl>();

  constructor() {
    injectYetiItemStyles('spinner');
  }
}
