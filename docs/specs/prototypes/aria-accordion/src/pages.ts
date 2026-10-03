import { Component, signal } from '@angular/core';
import {
  AccordionContent,
  AccordionGroup,
  AccordionPanel,
  AccordionTrigger,
} from '@angular/aria/accordion';
import { YetiAccordion, YetiAccordionItem } from './yeti-accordion';

// PROTOTYPE (ticket 29, accordion). Text and structure are Yeti's
// `src/components/accordion/example.html` (f52d1e8b9). Each page has the
// accordion live (#live) and a second copy inside `@defer (hydrate never)` (#never).

/** Yeti's example.html, verbatim, no directives: the style reference. */
@Component({
  selector: 'app-ref',
  template: `
    <div id="live">
      <div class="accordion">
        <details name="faq">
          <summary>Does Yeti need JavaScript?</summary>
          <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq">
          <summary>Can I use my own class names?</summary>
          <p>Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
    </div>
  `,
})
export class RefPage {}

/** (A) ticket 25 row 21: details/summary with the sketched directives. */
@Component({
  selector: 'app-a',
  imports: [YetiAccordion, YetiAccordionItem],
  template: `
    <div id="live">
      <div yetiAccordion>
        <details name="faq" yetiAccordionItem (openChange)="s1.set($event)">
          <summary>Does Yeti need JavaScript?</summary>
          <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq" yetiAccordionItem (openChange)="s2.set($event)">
          <summary>Can I use my own class names?</summary>
          <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
      <output id="state">{{ s1() }},{{ s2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion>
          <details name="faq-never" yetiAccordionItem>
            <summary>Does Yeti need JavaScript?</summary>
            <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
          </details>
          <details name="faq-never" yetiAccordionItem>
            <summary>Can I use my own class names?</summary>
            <p>Yes. Anything Yeti does not declare is ignored.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class APage {
  protected readonly s1 = signal(false);
  protected readonly s2 = signal(false);
}

/**
 * (B) Aria Accordion as its docs write it (accordion-group.ts:34-56): a heading
 * holding a button trigger, then a region panel with lazy content.
 * `multiExpandable=false` stands in for Yeti's shared `name`.
 */
@Component({
  selector: 'app-b',
  imports: [AccordionGroup, AccordionTrigger, AccordionPanel, AccordionContent],
  template: `
    <div id="live">
      <div ngAccordionGroup class="accordion" [multiExpandable]="false">
        <div>
          <h3><button ngAccordionTrigger [panel]="p1" [(expanded)]="e1">Does Yeti need JavaScript?</button></h3>
          <div ngAccordionPanel #p1="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
            </ng-template>
          </div>
        </div>
        <div>
          <h3><button ngAccordionTrigger [panel]="p2" [(expanded)]="e2">Can I use my own class names?</button></h3>
          <div ngAccordionPanel #p2="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
            </ng-template>
          </div>
        </div>
      </div>
      <output id="state">{{ e1() }},{{ e2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div ngAccordionGroup class="accordion" [multiExpandable]="false">
          <div>
            <h3><button ngAccordionTrigger [panel]="n1">Does Yeti need JavaScript?</button></h3>
            <div ngAccordionPanel #n1="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
              </ng-template>
            </div>
          </div>
          <div>
            <h3><button ngAccordionTrigger [panel]="n2">Can I use my own class names?</button></h3>
            <div ngAccordionPanel #n2="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Yes. Anything Yeti does not declare is ignored.</p>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class BPage {
  protected readonly e1 = signal(false);
  protected readonly e2 = signal(false);
}

/**
 * (B2) the hybrid: the trigger on Yeti's summary, the panel a div inside the
 * details, the details' open bound to the trigger's expanded state.
 * (B3, `/b3`) is the same without the [open] binding.
 */
@Component({
  selector: 'app-b2',
  imports: [AccordionGroup, AccordionTrigger, AccordionPanel, AccordionContent],
  template: `
    <div id="live">
      <div ngAccordionGroup class="accordion" [multiExpandable]="false">
        <details [open]="e1()">
          <summary ngAccordionTrigger [panel]="p1" [(expanded)]="e1">Does Yeti need JavaScript?</summary>
          <div ngAccordionPanel #p1="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
            </ng-template>
          </div>
        </details>
        <details [open]="e2()">
          <summary ngAccordionTrigger [panel]="p2" [(expanded)]="e2">Can I use my own class names?</summary>
          <div ngAccordionPanel #p2="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
            </ng-template>
          </div>
        </details>
      </div>
      <output id="state">{{ e1() }},{{ e2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div ngAccordionGroup class="accordion" [multiExpandable]="false">
          <details>
            <summary ngAccordionTrigger [panel]="n1">Does Yeti need JavaScript?</summary>
            <div ngAccordionPanel #n1="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
              </ng-template>
            </div>
          </details>
          <details>
            <summary ngAccordionTrigger [panel]="n2">Can I use my own class names?</summary>
            <div ngAccordionPanel #n2="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Yes. Anything Yeti does not declare is ignored.</p>
              </ng-template>
            </div>
          </details>
        </div>
      </div>
    }
  `,
})
export class B2Page {
  protected readonly e1 = signal(false);
  protected readonly e2 = signal(false);
}

// (B3) the hybrid without the [open] binding.
@Component({
  selector: 'app-b3',
  imports: [AccordionGroup, AccordionTrigger, AccordionPanel, AccordionContent],
  template: `
    <div id="live">
      <div ngAccordionGroup class="accordion" [multiExpandable]="false">
        <details>
          <summary ngAccordionTrigger [panel]="p1" [(expanded)]="e1">Does Yeti need JavaScript?</summary>
          <div ngAccordionPanel #p1="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
            </ng-template>
          </div>
        </details>
        <details>
          <summary ngAccordionTrigger [panel]="p2" [(expanded)]="e2">Can I use my own class names?</summary>
          <div ngAccordionPanel #p2="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
            </ng-template>
          </div>
        </details>
      </div>
      <output id="state">{{ e1() }},{{ e2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div ngAccordionGroup class="accordion" [multiExpandable]="false">
          <details>
            <summary ngAccordionTrigger [panel]="n1">Does Yeti need JavaScript?</summary>
            <div ngAccordionPanel #n1="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
              </ng-template>
            </div>
          </details>
          <details>
            <summary ngAccordionTrigger [panel]="n2">Can I use my own class names?</summary>
            <div ngAccordionPanel #n2="ngAccordionPanel">
              <ng-template ngAccordionContent>
                <p>Yes. Anything Yeti does not declare is ignored.</p>
              </ng-template>
            </div>
          </details>
        </div>
      </div>
    }
  `,
})
export class B3Page {
  protected readonly e1 = signal(false);
  protected readonly e2 = signal(false);
}

// (B, first item expanded from the start) checks whether the server renders an expanded panel's content.
@Component({
  selector: 'app-b-open',
  imports: [AccordionGroup, AccordionTrigger, AccordionPanel, AccordionContent],
  template: `
    <div id="live">
      <div ngAccordionGroup class="accordion">
        <div>
          <h3><button ngAccordionTrigger [panel]="p1" [expanded]="true">Does Yeti need JavaScript?</button></h3>
          <div ngAccordionPanel #p1="ngAccordionPanel">
            <ng-template ngAccordionContent><p id="ans1">Almost never.</p></ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BOpenPage {}
