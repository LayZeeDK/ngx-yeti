// PROTOTYPE (ticket 35): one widget set, placed in each rendering case. Routes: /h35/<mode>/<case>.
import { ChangeDetectionStrategy, Component, inject, input, PendingTasks, signal } from '@angular/core';
import { Route } from '@angular/router';
import { H35_ITEMS } from './items';
import { H35_MODE, H35Mode } from './ids';

@Component({
  selector: 'h35-set',
  imports: [H35_ITEMS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section [attr.data-set]="tag()">
	<div yetiTabs>
		<div role="tablist" aria-label="Account" yetiTabList [selectedTab]="'one'">
			<button type="button" yetiTab value="one">One</button>
			<button type="button" yetiTab value="two">Two</button>
		</div>
		<div yetiTabPanel value="one"><p>Panel one</p></div>
		<div yetiTabPanel value="two"><p>Panel two</p></div>
	</div>
	<div role="group" aria-label="Actions" yetiButtons>
		<button type="button" yetiButton>Save</button>
		<button type="button" yetiButton>Cancel</button>
	</div>
	<h3 yetiLabel #l="yetiLabel">Heading {{ tag() }}</h3>
	<div role="region" yetiLabelled [by]="l"><button type="button" yetiTrigger [for]="p">Show</button></div>
	<div yetiPanel #p="yetiPanel"><p>Panel {{ tag() }}</p></div>
</section>`,
})
export class H35Set {
  readonly tag = input.required<string>();
}

@Component({
  selector: 'h35-full',
  imports: [H35Set],
  template: `<h35-set tag="a" /><h35-set tag="b" />`,
})
export class H35Full {}

@Component({
  selector: 'h35-on',
  imports: [H35Set],
  template: `<h35-set tag="a" />
@defer (hydrate on timer(1500ms)) { <h35-set tag="b" /> }
<h35-set tag="c" />`,
})
export class H35On {}

@Component({
  selector: 'h35-never',
  imports: [H35Set],
  template: `<h35-set tag="a" />
@defer (hydrate never) { <h35-set tag="b" /> }
<h35-set tag="c" />`,
})
export class H35Never {}

@Component({
  selector: 'h35-client',
  imports: [H35Set],
  template: `<h35-set tag="a" />
@defer (on timer(500ms)) { <h35-set tag="b" /> } @placeholder { <p>Later</p> }
<h35-set tag="c" />`,
})
export class H35Client {}

@Component({
  selector: 'h35-for',
  imports: [H35Set],
  template: `@for (t of tags(); track t) { <h35-set [tag]="t" /> }
<button type="button" data-testid="add" (click)="add()">Add</button>`,
})
export class H35For {
  readonly tags = signal(['a', 'b']);

  add() {
    this.tags.update((t) => [...t, `n${t.length}`]);
  }
}

@Component({
  selector: 'h35-never-add',
  imports: [H35Set],
  template: `<h35-set tag="a" />
@defer (hydrate never) { <h35-set tag="b" /> }
@for (t of tags(); track t) { <h35-set [tag]="t" /> }
<button type="button" data-testid="add" (click)="add()">Add</button>`,
})
export class H35NeverAdd {
  readonly tags = signal<string[]>([]);

  add() {
    this.tags.update((t) => [...t, `n${t.length}`]);
  }
}

/** Server-only probe for concurrency: half the ids are created, then the render waits 400 ms. */
@Component({
  selector: 'h35-late',
  imports: [H35Set],
  template: `<h35-set tag="a" />
@if (late()) { <h35-set tag="b" /> }`,
})
export class H35Late {
  readonly late = signal(false);

  constructor() {
    inject(PendingTasks).run(async () => {
      await new Promise((r) => setTimeout(r, 400));
      this.late.set(true);
    });
  }
}

const cases = { full: H35Full, on: H35On, never: H35Never, client: H35Client, for: H35For, neveradd: H35NeverAdd, late: H35Late };
const modes: H35Mode[] = ['cdk', 'counter', 'adopt', 'noseed'];

export const h35Routes: Route[] = modes.flatMap((mode) =>
  Object.entries(cases).map(([name, component]) => ({
    path: `h35/${mode}/${name}`,
    component,
    providers: [{ provide: H35_MODE, useValue: mode }],
  })),
);
