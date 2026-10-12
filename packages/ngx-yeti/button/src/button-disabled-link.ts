import { Directive, booleanAttribute, input } from '@angular/core';

/**
 * The disabled state of an `a[yetiButton]`: while `disabled` is true, the
 * link is marked `role="link"` and `aria-disabled="true"`, which Yeti's CSS
 * styles. The consumer binds the link's `href` or `routerLink` to `null` at
 * the same time, so it becomes a placeholder link that Tab skips and no
 * press follows (button spec, sections 2 and 4). It sets no presence
 * attribute, loads no item file, and declares no listener.
 *
 * Usage rules (numbered as on `YetiButton`):
 *
 * 4. Disable a link with two bindings together: `[disabled]` on the `a`, and
 *    its `href` or `routerLink` bound to `null` while disabled. A disabled
 *    link that keeps its target still navigates; an enabled `a[yetiButton]`
 *    without a target is not focusable. Import `YetiButtonDisabledLink`
 *    wherever a template binds `[disabled]` on an `a[yetiButton]`; without
 *    it the compiler reports NG8002, because `disabled` is not a property of
 *    `a`. Do not write a static `role` or `aria-disabled` on such a link.
 * 10. Put no `(click)` handler on an `a[yetiButton]`; an action is a
 *     `button`.
 * 11. Bind `disabled` from a value that is the same on the server and the
 *     client, never from a browser-only read.
 *
 * A static `<a yetiButton disabled>` is a link that is always disabled.
 */
@Directive({
  selector: 'a[yetiButton][disabled]',
  host: {
    '[attr.role]': "disabled() ? 'link' : null",
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    // `disabled` is not an attribute of `a`: a static one is the input's
    // value, and this binding keeps it out of the DOM.
    '[attr.disabled]': 'null',
  },
  exportAs: 'yetiButtonDisabledLink',
})
export class YetiButtonDisabledLink {
  /** Marks the link a disabled placeholder. */
  readonly disabled = input(false, { transform: booleanAttribute });
}
