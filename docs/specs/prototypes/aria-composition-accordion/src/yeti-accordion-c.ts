import { AfterContentInit, Directive, ElementRef, computed, contentChild, inject } from '@angular/core';
import { AccordionGroup, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';

// PROTOTYPE (ticket 30, variant C): Aria Accordion fitted to Yeti's
// details/summary by directive composition. Public Aria API only.

/** `.accordion` container hosting Aria's group (keys, exclusivity, roving focus). */
@Directive({
  selector: '[yetiAccordion]',
  host: { class: 'accordion' },
  hostDirectives: [{ directive: AccordionGroup, inputs: ['multiExpandable', 'wrap', 'disabled'] }],
})
export class YetiAccordionC {}

/** `summary` hosting Aria's trigger. The panel is passed as `[yetiAccordionTrigger]`. */
@Directive({
  selector: 'summary[yetiAccordionTrigger]',
  hostDirectives: [
    {
      directive: AccordionTrigger,
      inputs: ['panel: yetiAccordionTrigger', 'expanded', 'disabled'],
      outputs: ['expandedChange'],
    },
  ],
})
export class YetiAccordionTrigger {}

/**
 * The content element hosting Aria's panel. No `ngAccordionContent`: the
 * content is projected as is, so it is in the server HTML. `aria` is the
 * Aria instance the trigger needs (whether a host directive's own exportAs
 * works from the template was not tried).
 */
@Directive({
  selector: '[yetiAccordionPanel]',
  exportAs: 'yetiAccordionPanel',
  hostDirectives: [{ directive: AccordionPanel, inputs: ['id'] }],
})
export class YetiAccordionPanel {
  readonly aria = inject(AccordionPanel);
}

/** Same, with Aria's `inert` overridden by the hosting directive's own binding. */
@Directive({
  selector: '[yetiAccordionPanelNoInert]',
  exportAs: 'yetiAccordionPanel',
  hostDirectives: [{ directive: AccordionPanel, inputs: ['id'] }],
  host: { '[attr.inert]': 'null' },
})
export class YetiAccordionPanelNoInert {
  readonly aria = inject(AccordionPanel);
}

/**
 * `details` kept in sync with Aria both ways: `open` follows Aria's
 * `expanded` (an attribute binding, so the server writes it), and a native
 * toggle (no script yet, find-in-page, a fragment link) sets `expanded`.
 */
@Directive({
  selector: 'details[yetiAccordionItem]',
  host: {
    '[attr.open]': "expanded() ? '' : null",
    '(toggle)': 'onToggle()',
  },
})
export class YetiAccordionItemC implements AfterContentInit {
  protected readonly trigger = contentChild(AccordionTrigger);
  protected readonly expanded = computed(() => this.trigger()?.expanded() ?? false);

  readonly #details = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement;

  // An item the visitor opened before hydration still has `open` here, before
  // the host binding first runs; hand it to Aria so hydration keeps it open.
  // ponytail: misses an initially open item the visitor closed before
  // hydration (no public "is hydrating" signal to tell that from a fresh render).
  readonly #openAtStart = this.#details.hasAttribute('open');

  ngAfterContentInit(): void {
    if (this.#openAtStart) {
      this.trigger()?.expanded.set(true);
    }
  }

  // ponytail: reads the live open state, not event.newState. A toggle event is
  // queued, so one fired by hydration rewriting [open] can arrive after a
  // replayed click has opened the item again (ticket 30, run 1).
  protected onToggle(): void {
    this.trigger()?.expanded.set(this.#details.open);
  }
}
