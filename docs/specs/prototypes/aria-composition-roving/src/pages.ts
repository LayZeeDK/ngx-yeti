// PROTOTYPE (ticket 30): Yeti's own markup (buttons/example.html + docs.md, tabs/example.html,
// carousel/example.html) on the package's directives that host Aria.
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { YetiButton, YetiButtons, YetiCarouselSlide, YetiTab, YetiTabList, YetiTabPanel, YetiTabs } from './roving';
import { YetiCarousel } from './carousel-glue';

@Component({
  selector: 'r30-buttons',
  imports: [YetiButtons, YetiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="buttons" role="group" aria-label="Form actions" yetiButtons data-testid="action">
	<button class="button" type="submit" yetiButton>Save</button>
	<button class="button" type="button" data-emphasis="low" yetiButton>Cancel</button>
	<button class="button" type="button" data-emphasis="medium" yetiButton [busy]="true">Export</button>
</div>
<div class="buttons" role="group" aria-label="Text style" data-affix yetiButtons data-testid="toggle">
	<button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="bold">Bold</button>
	<button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="italic">Italic</button>
	<button class="button" type="button" data-emphasis="medium" yetiButton [(pressed)]="underline">Underline</button>
</div>
<!-- Probe: a consumer's dynamic role binding, not a static attribute. -->
<div class="buttons" [attr.role]="'group'" aria-label="Bound role" yetiButtons data-testid="bound">
	<button class="button" type="button" yetiButton>One</button>
	<button class="button" type="button" yetiButton>Two</button>
</div>`,
})
export class R30Buttons {
  readonly bold = signal<boolean | undefined>(true);
  readonly italic = signal<boolean | undefined>(false);
  readonly underline = signal<boolean | undefined>(false);
}

@Component({
  selector: 'r30-tabs',
  imports: [YetiTabs, YetiTab, YetiTabList, YetiTabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="tabs" yetiTabs data-testid="tabs">
	<div role="tablist" aria-label="Account" yetiTabList [(selectedTab)]="selected">
		<button type="button" role="tab" id="tab-profile" aria-controls="panel-profile" yetiTab value="profile">Profile</button>
		<button type="button" role="tab" id="tab-billing" aria-controls="panel-billing" yetiTab value="billing">Billing</button>
	</div>
	<section role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" yetiTabPanel value="profile">
		<p>Your name and how people reach you.</p>
	</section>
	<section role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" yetiTabPanel value="billing">
		<p>Your plan and your invoices.</p>
	</section>
</div>`,
})
export class R30Tabs {
  readonly selected = signal<string | undefined>('profile');
}

@Component({
  selector: 'r30-carousel',
  imports: [YetiCarousel, YetiTabList, YetiTab, YetiCarouselSlide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work" yetiCarousel data-testid="carousel">
	<div data-track role="group" aria-label="Slides" tabindex="0">
		<article yetiCarouselSlide value="work-1" id="work-1" class="box" data-surface="raised" data-border data-slide><h3>A trail map</h3><p>Printed in two colors.</p></article>
		<article yetiCarouselSlide value="work-2" id="work-2" class="box" data-surface="raised" data-border data-slide><h3>A field guide</h3><p>Three hundred pages.</p></article>
		<article yetiCarouselSlide value="work-3" id="work-3" class="box" data-surface="raised" data-border data-slide><h3>A season of posters</h3><p>Twelve of them.</p></article>
	</div>
	<ol data-dots yetiTabList [(selectedTab)]="selected" aria-label="Choose a slide">
		<li role="none"><a yetiTab value="work-1" href="{{path()}}#work-1"><span class="visually-hidden">Slide 1</span></a></li>
		<li role="none"><a yetiTab value="work-2" href="{{path()}}#work-2"><span class="visually-hidden">Slide 2</span></a></li>
		<li role="none"><a yetiTab value="work-3" href="{{path()}}#work-3"><span class="visually-hidden">Slide 3</span></a></li>
	</ol>
</section>`,
})
export class R30Carousel {
  readonly selected = signal<string | undefined>('work-1');
  readonly path = input('/r30-carousel');
}

@Component({ selector: 'r30-p-buttons', imports: [R30Buttons], template: '<main class="container stack"><h1>buttons</h1><r30-buttons /></main>' })
export class R30PageButtons {}

@Component({ selector: 'r30-p-tabs', imports: [R30Tabs], template: '<main class="container stack"><h1>tabs</h1><r30-tabs /></main>' })
export class R30PageTabs {}

@Component({ selector: 'r30-p-carousel', imports: [R30Carousel], template: '<main class="container stack"><h1>carousel</h1><r30-carousel /></main>' })
export class R30PageCarousel {}

@Component({
  selector: 'r30-p-never',
  imports: [R30Buttons, R30Tabs, R30Carousel],
  template: `<main class="container stack"><h1>hydrate never</h1>
    @defer (hydrate never) { <r30-buttons /> }
    @defer (hydrate never) { <r30-tabs /> }
    @defer (hydrate never) { <r30-carousel path="/r30-never" /> }</main>`,
})
export class R30PageNever {}
