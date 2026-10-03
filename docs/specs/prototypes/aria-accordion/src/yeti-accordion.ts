import { Directive, model } from '@angular/core';

// PROTOTYPE (ticket 29, variant A): ticket 25 row 21, sketched.
// `[yetiAccordion]` only adds the class; `details[yetiAccordionItem]` mirrors the
// platform's `open` state into a model from the `toggle` event. `name` and
// `summary` stay the consumer's. ponytail: writing the model back to the DOM
// is not sketched; ticket 18 measured that an `[open]` binding undoes a
// pre-hydration toggle, which is a separate question.
@Directive({
  selector: '[yetiAccordion]',
  host: { class: 'accordion' },
})
export class YetiAccordion {}

@Directive({
  selector: 'details[yetiAccordionItem]',
  host: { '(toggle)': 'onToggle($event)' },
})
export class YetiAccordionItem {
  readonly open = model(false);

  protected onToggle(event: Event): void {
    this.open.set((event as ToggleEvent).newState === 'open');
  }
}
