import { Directive } from '@angular/core';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `visually-hidden` on the consumer's element: the `visually-hidden`
 * class and its item file (visually-hidden spec, sections 2 to 4). The text
 * leaves the screen and stays in the accessibility tree, so it is announced
 * in source order and joins the accessible name of the control around it.
 * The directive has no inputs and adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Text only. Put only text inside the host; a link, a button, or any
 *    other focusable element inside stays focusable and takes Tab focus
 *    with nothing on screen. Never put the directive on a focusable element.
 * 2. One name per control. An `aria-label` on the control replaces the
 *    hidden text in its name. Use the label when the name rewords the
 *    content, and the hidden text when the name is the content.
 * 3. Visible words first. Keep the control's visible words at the start of
 *    its accessible name, with the hidden words after them, so the name
 *    contains the visible label (WCAG 2.5.3).
 * 4. Not `hidden`, not `aria-hidden`. Either on the host or an ancestor
 *    removes the words from the accessibility tree, the opposite of this
 *    directive.
 * 5. Not with `yetiPrint`. On screen `print` removes the element, and on
 *    paper the clip leaves a blank pixel.
 * 6. Not on the skip link. Yeti's base rule hides and shows the page's skip
 *    link; this class would keep it hidden when it takes focus.
 * 7. No static `class="visually-hidden"`. Write the directive attribute,
 *    never Yeti's class. A class of your own on the same element is allowed.
 * 8. Last resort. A control with room for a word should show the word.
 *
 * For hidden text first rendered on the client, add `visually-hidden` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`, so the words never
 * show for a frame.
 */
@Directive({
  selector: '[yetiVisuallyHidden]',
  host: {
    class: 'visually-hidden',
    'data-ngx-yeti-item-visually-hidden': '',
  },
  exportAs: 'yetiVisuallyHidden',
})
export class YetiVisuallyHidden {
  constructor() {
    injectYetiItemStyles('visually-hidden');
  }
}
