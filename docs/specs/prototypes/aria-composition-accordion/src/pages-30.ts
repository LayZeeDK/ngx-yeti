import { Component, signal } from '@angular/core';
import {
  YetiAccordionC,
  YetiAccordionItemC,
  YetiAccordionPanel,
  YetiAccordionPanelNoInert,
  YetiAccordionTrigger,
} from './yeti-accordion-c';
import { YetiAccordion, YetiAccordionItem } from './yeti-accordion';

// PROTOTYPE (ticket 30, accordion). Text is Yeti's example.html (f52d1e8b9).
// #live is hydrated; #never sits inside @defer (hydrate never).

const C_IMPORTS = [YetiAccordionC, YetiAccordionItemC, YetiAccordionTrigger, YetiAccordionPanel];

/** (C) Aria by composition on details/summary, content projected directly. */
@Component({
  selector: 'app-c',
  imports: C_IMPORTS,
  template: `
    <div id="live">
      <div yetiAccordion [multiExpandable]="false">
        <details name="faq" yetiAccordionItem>
          <summary [yetiAccordionTrigger]="p1.aria" [(expanded)]="e1">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanel #p1="yetiAccordionPanel" id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq" yetiAccordionItem>
          <summary [yetiAccordionTrigger]="p2.aria" [(expanded)]="e2">Can I use my own class names?</summary>
          <p yetiAccordionPanel #p2="yetiAccordionPanel" id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
      <output id="state">{{ e1() }},{{ e2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion [multiExpandable]="false">
          <details name="faq-never" yetiAccordionItem>
            <summary [yetiAccordionTrigger]="n1.aria">Does Yeti need JavaScript?</summary>
            <p yetiAccordionPanel #n1="yetiAccordionPanel">Almost never. A handful of optional modules exist and nothing depends on them.</p>
          </details>
          <details name="faq-never" yetiAccordionItem>
            <summary [yetiAccordionTrigger]="n2.aria">Can I use my own class names?</summary>
            <p yetiAccordionPanel #n2="yetiAccordionPanel">Yes. Anything Yeti does not declare is ignored.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class CPage {
  protected readonly e1 = signal(false);
  protected readonly e2 = signal(false);
}

/** (C-noinert) C with the hosting directive overriding Aria's inert. */
@Component({
  selector: 'app-c-noinert',
  imports: [YetiAccordionC, YetiAccordionItemC, YetiAccordionTrigger, YetiAccordionPanelNoInert],
  template: `
    <div id="live">
      <div yetiAccordion [multiExpandable]="false">
        <details name="faq" yetiAccordionItem>
          <summary [yetiAccordionTrigger]="p1.aria" [(expanded)]="e1">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanelNoInert #p1="yetiAccordionPanel" id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq" yetiAccordionItem>
          <summary [yetiAccordionTrigger]="p2.aria" [(expanded)]="e2">Can I use my own class names?</summary>
          <p yetiAccordionPanelNoInert #p2="yetiAccordionPanel" id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
      <output id="state">{{ e1() }},{{ e2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion [multiExpandable]="false">
          <details name="faq-never" yetiAccordionItem>
            <summary [yetiAccordionTrigger]="n1.aria">Does Yeti need JavaScript?</summary>
            <p yetiAccordionPanelNoInert #n1="yetiAccordionPanel">Almost never. A handful of optional modules exist and nothing depends on them.</p>
          </details>
          <details name="faq-never" yetiAccordionItem>
            <summary [yetiAccordionTrigger]="n2.aria">Can I use my own class names?</summary>
            <p yetiAccordionPanelNoInert #n2="yetiAccordionPanel">Yes. Anything Yeti does not declare is ignored.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class CNoInertPage {
  protected readonly e1 = signal(false);
  protected readonly e2 = signal(false);
}

/** (C-open) first item expanded from the start: does the server write open? */
@Component({
  selector: 'app-c-open',
  imports: C_IMPORTS,
  template: `
    <div id="live">
      <div yetiAccordion [multiExpandable]="false">
        <details name="faq" yetiAccordionItem>
          <summary [yetiAccordionTrigger]="p1.aria" [expanded]="true">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanel #p1="yetiAccordionPanel" id="ans1">Almost never.</p>
        </details>
      </div>
    </div>
  `,
})
export class COpenPage {}

/** (D) custom, no Aria: ticket 29's (A) with an h3 inside each summary. */
@Component({
  selector: 'app-d',
  imports: [YetiAccordion, YetiAccordionItem],
  template: `
    <div id="live">
      <div yetiAccordion>
        <details name="faq" yetiAccordionItem (openChange)="s1.set($event)">
          <summary><h3>Does Yeti need JavaScript?</h3></summary>
          <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq" yetiAccordionItem (openChange)="s2.set($event)">
          <summary><h3>Can I use my own class names?</h3></summary>
          <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
      <output id="state">{{ s1() }},{{ s2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion>
          <details name="faq-never" yetiAccordionItem>
            <summary><h3>Does Yeti need JavaScript?</h3></summary>
            <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
          </details>
          <details name="faq-never" yetiAccordionItem>
            <summary><h3>Can I use my own class names?</h3></summary>
            <p>Yes. Anything Yeti does not declare is ignored.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class DPage {
  protected readonly s1 = signal(false);
  protected readonly s2 = signal(false);
}

/** (D-role) the heading's role on an inner span instead of an h3. */
@Component({
  selector: 'app-d-role',
  imports: [YetiAccordion, YetiAccordionItem],
  template: `
    <div id="live">
      <div yetiAccordion>
        <details name="faq" yetiAccordionItem (openChange)="s1.set($event)">
          <summary><span role="heading" aria-level="3">Does Yeti need JavaScript?</span></summary>
          <p id="ans1">Almost never. A handful of optional modules exist and nothing depends on them.</p>
        </details>
        <details name="faq" yetiAccordionItem (openChange)="s2.set($event)">
          <summary><span role="heading" aria-level="3">Can I use my own class names?</span></summary>
          <p id="ans2">Yes. Anything Yeti does not declare is ignored.</p>
        </details>
      </div>
      <output id="state">{{ s1() }},{{ s2() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion>
          <details name="faq-never" yetiAccordionItem>
            <summary><span role="heading" aria-level="3">Does Yeti need JavaScript?</span></summary>
            <p>Almost never. A handful of optional modules exist and nothing depends on them.</p>
          </details>
          <details name="faq-never" yetiAccordionItem>
            <summary><span role="heading" aria-level="3">Can I use my own class names?</span></summary>
            <p>Yes. Anything Yeti does not declare is ignored.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class DRolePage {
  protected readonly s1 = signal(false);
  protected readonly s2 = signal(false);
}
