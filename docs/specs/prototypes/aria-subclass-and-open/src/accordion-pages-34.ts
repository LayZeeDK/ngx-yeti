import { Component, Directive, signal } from '@angular/core';
import { AccordionTrigger } from '@angular/aria/accordion';
import { YetiAccordionC, YetiAccordionItemC } from './yeti-accordion-c';
import { YetiAccordionPanel32, YetiAccordionTrigger32 } from './pages-32';

// PROTOTYPE (ticket 34).
// Point 1: Aria's trigger on Yeti's `summary` by subclassing, against ticket 32's
// composition (YetiAccordionTrigger32, `[attr.role]` null).
// Point 2: `[open]` against `[attr.open]` on details, a non-modal and a modal dialog.

/** Subclass; removes Aria's static role="button" with a binding, as ticket 32's composition does. */
@Directive({
  selector: 'summary[yetiTriggerSNull]',
  // Not inherited; YetiAccordionItemC's contentChild(AccordionTrigger) needs it.
  providers: [{ provide: AccordionTrigger, useExisting: YetiTriggerSNull }],
  host: { '[attr.role]': 'null' },
})
export class YetiTriggerSNull extends AccordionTrigger {}

/** Subclass; replaces Aria's static role="button" with a static empty role. */
@Directive({
  selector: 'summary[yetiTriggerSEmpty]',
  providers: [{ provide: AccordionTrigger, useExisting: YetiTriggerSEmpty }],
  host: { role: '' },
})
export class YetiTriggerSEmpty extends AccordionTrigger {}

const ACC = [YetiAccordionC, YetiAccordionItemC, YetiAccordionPanel32, YetiAccordionTrigger32, YetiTriggerSNull, YetiTriggerSEmpty];

@Component({
  selector: 'app-s34-acc',
  imports: ACC,
  template: `
    <div id="live">
      <div yetiAccordion [multiExpandable]="false" data-testid="comp">
        <details name="c" yetiAccordionItem>
          <summary [yetiAccordionTrigger32]="c1.aria" [(expanded)]="c1e">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanel32 #c1="yetiAccordionPanel32">Almost never.</p>
        </details>
        <details name="c" yetiAccordionItem>
          <summary [yetiAccordionTrigger32]="c2.aria" [(expanded)]="c2e">Can I use my own class names?</summary>
          <p yetiAccordionPanel32 #c2="yetiAccordionPanel32">Yes.</p>
        </details>
      </div>
      <div yetiAccordion [multiExpandable]="false" data-testid="snull">
        <details name="n" yetiAccordionItem>
          <summary yetiTriggerSNull [panel]="n1.aria" [(expanded)]="n1e">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanel32 #n1="yetiAccordionPanel32">Almost never.</p>
        </details>
        <details name="n" yetiAccordionItem>
          <summary yetiTriggerSNull [panel]="n2.aria" [(expanded)]="n2e">Can I use my own class names?</summary>
          <p yetiAccordionPanel32 #n2="yetiAccordionPanel32">Yes.</p>
        </details>
      </div>
      <div yetiAccordion [multiExpandable]="false" data-testid="sempty">
        <details name="e" yetiAccordionItem>
          <summary yetiTriggerSEmpty [panel]="e1.aria" [(expanded)]="e1e">Does Yeti need JavaScript?</summary>
          <p yetiAccordionPanel32 #e1="yetiAccordionPanel32">Almost never.</p>
        </details>
        <details name="e" yetiAccordionItem>
          <summary yetiTriggerSEmpty [panel]="e2.aria" [(expanded)]="e2e">Can I use my own class names?</summary>
          <p yetiAccordionPanel32 #e2="yetiAccordionPanel32">Yes.</p>
        </details>
      </div>
      <output id="state">{{ c1e() }},{{ c2e() }};{{ n1e() }},{{ n2e() }};{{ e1e() }},{{ e2e() }}</output>
    </div>
    @defer (hydrate never) {
      <div id="never">
        <div yetiAccordion data-testid="never-snull">
          <details yetiAccordionItem>
            <summary yetiTriggerSNull [panel]="m1.aria">Does Yeti need JavaScript?</summary>
            <p yetiAccordionPanel32 #m1="yetiAccordionPanel32">Almost never.</p>
          </details>
        </div>
        <div yetiAccordion data-testid="never-sempty">
          <details yetiAccordionItem>
            <summary yetiTriggerSEmpty [panel]="m2.aria">Does Yeti need JavaScript?</summary>
            <p yetiAccordionPanel32 #m2="yetiAccordionPanel32">Almost never.</p>
          </details>
        </div>
      </div>
    }
  `,
})
export class S34AccPage {
  protected readonly c1e = signal(false);
  protected readonly c2e = signal(false);
  protected readonly n1e = signal(false);
  protected readonly n2e = signal(false);
  protected readonly e1e = signal(false);
  protected readonly e2e = signal(false);
}

// ---------------------------------------------------------------- point 2

/**
 * Each element twice: `[open]` (property) and `[attr.open]` (attribute).
 * dT: details bound true; dF: details bound false; nT: non-modal dialog bound true;
 * nF: non-modal dialog bound false; mF: modal dialog bound false, opened by a
 * command="show-modal" invoker (no Angular listener, so it works before hydration).
 */
@Component({
  selector: 'app-o34-items',
  template: `
    <section data-form="prop">
      <details data-testid="prop-dT" [open]="dT()"><summary>prop dT</summary><p>content</p></details>
      <details data-testid="prop-dF" [open]="dF()"><summary>prop dF</summary><p>content</p></details>
      <dialog style="position: static" data-testid="prop-nT" id="prop-nT" [open]="nT()"><p>prop nT</p><button type="button" command="close" commandfor="prop-nT">Close prop nT</button></dialog>
      <dialog data-testid="prop-nF" id="prop-nF" [open]="nF()"><p>prop nF</p></dialog>
      <button type="button" command="show-modal" commandfor="prop-mF">Open prop mF</button>
      <dialog data-testid="prop-mF" id="prop-mF" [open]="mF()"><p>prop mF</p><button type="button" command="close" commandfor="prop-mF">Close prop mF</button></dialog>
    </section>
    <section data-form="attr">
      <details data-testid="attr-dT" [attr.open]="dT() ? '' : null"><summary>attr dT</summary><p>content</p></details>
      <details data-testid="attr-dF" [attr.open]="dF() ? '' : null"><summary>attr dF</summary><p>content</p></details>
      <dialog style="position: static" data-testid="attr-nT" id="attr-nT" [attr.open]="nT() ? '' : null"><p>attr nT</p><button type="button" command="close" commandfor="attr-nT">Close attr nT</button></dialog>
      <dialog data-testid="attr-nF" id="attr-nF" [attr.open]="nF() ? '' : null"><p>attr nF</p></dialog>
      <button type="button" command="show-modal" commandfor="attr-mF">Open attr mF</button>
      <dialog data-testid="attr-mF" id="attr-mF" [attr.open]="mF() ? '' : null"><p>attr mF</p><button type="button" command="close" commandfor="attr-mF">Close attr mF</button></dialog>
    </section>
    <p>
      <button type="button" id="set-mF-true" (click)="mF.set(true)">mF true</button>
      <button type="button" id="set-mF-false" (click)="mF.set(false)">mF false</button>
    </p>
  `,
})
export class O34Items {
  protected readonly dT = signal(true);
  protected readonly dF = signal(false);
  protected readonly nT = signal(true);
  protected readonly nF = signal(false);
  protected readonly mF = signal(false);
}

@Component({ selector: 'app-o34', imports: [O34Items], template: '<app-o34-items />' })
export class O34Page {}

@Component({
  selector: 'app-o34-never',
  imports: [O34Items],
  template: '@defer (hydrate never) { <app-o34-items /> }',
})
export class O34NeverPage {}
