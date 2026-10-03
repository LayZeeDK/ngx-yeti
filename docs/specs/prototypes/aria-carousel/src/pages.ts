// PROTOTYPE (ticket 29): the carousel on Yeti's example.html markup, as
// (A) ticket 25 row 29 and (B) Aria Tabs (dots = tabs, slides = tab panels).
// Hrefs carry the route path because <base href="/"> would send a bare "#id"
// to "/#id" (building-blocks 1.15); the package's injectSameDocumentHref would
// write the same thing.
import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';
import { YETI_CAROUSEL } from './a-carousel';
import { BGlue } from './b-glue';

const log = (w: Window & { __slides?: unknown[] }, e: unknown) => (w.__slides ??= []).push(e);

@Component({
  selector: 'app-a',
  imports: [YETI_CAROUSEL],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work" yetiCarousel (slide)="onSlide($event.index)">
	<div data-track role="group" aria-label="Slides" tabindex="0">
		<article id="{{p()}}work-1" class="box" data-surface="raised" data-border data-slide yetiCarouselSlide aria-label="1 of 3"><h3>A trail map</h3><p>Printed in two colors.</p></article>
		<article id="{{p()}}work-2" class="box" data-surface="raised" data-border data-slide yetiCarouselSlide aria-label="2 of 3"><h3>A field guide</h3><p>Three hundred pages.</p></article>
		<article id="{{p()}}work-3" class="box" data-surface="raised" data-border data-slide yetiCarouselSlide aria-label="3 of 3"><h3>A season of posters</h3><p>Twelve of them.</p></article>
	</div>
	<ol data-dots role="list">
		<li><a href="{{path()}}#{{p()}}work-1" [yetiCarouselDot]="0"><span class="visually-hidden">Slide 1</span></a></li>
		<li><a href="{{path()}}#{{p()}}work-2" [yetiCarouselDot]="1"><span class="visually-hidden">Slide 2</span></a></li>
		<li><a href="{{path()}}#{{p()}}work-3" [yetiCarouselDot]="2"><span class="visually-hidden">Slide 3</span></a></li>
	</ol>
	<div class="cluster">
		<button class="button" yetiCarouselPrevious>Previous slide</button>
		<button class="button" yetiCarouselNext>Next slide</button>
	</div>
</section>`,
})
export class ACarousel {
  path = input('/a');
  p = input('');
  onSlide(index: number) {
    if (typeof window !== 'undefined') log(window, { v: 'A', index });
  }
}

@Component({
  selector: 'app-b',
  imports: [Tabs, TabList, Tab, TabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work" ngTabs>
	<div data-track role="group" aria-label="Slides" tabindex="0">
		<article ngTabPanel value="{{p()}}work-1" id="{{p()}}work-1" class="box" data-surface="raised" data-border data-slide><h3>A trail map</h3><p>Printed in two colors.</p></article>
		<article ngTabPanel value="{{p()}}work-2" id="{{p()}}work-2" class="box" data-surface="raised" data-border data-slide><h3>A field guide</h3><p>Three hundred pages.</p></article>
		<article ngTabPanel value="{{p()}}work-3" id="{{p()}}work-3" class="box" data-surface="raised" data-border data-slide><h3>A season of posters</h3><p>Twelve of them.</p></article>
	</div>
	<ol data-dots ngTabList [(selectedTab)]="selected" aria-label="Choose a slide">
		<li role="none"><a ngTab value="{{p()}}work-1" href="{{path()}}#{{p()}}work-1"><span class="visually-hidden">Slide 1</span></a></li>
		<li role="none"><a ngTab value="{{p()}}work-2" href="{{path()}}#{{p()}}work-2"><span class="visually-hidden">Slide 2</span></a></li>
		<li role="none"><a ngTab value="{{p()}}work-3" href="{{path()}}#{{p()}}work-3"><span class="visually-hidden">Slide 3</span></a></li>
	</ol>
</section>`,
})
export class BCarousel {
  path = input('/b');
  p = input('');
  selected = linkedSignal<string | undefined>(() => this.p() + 'work-1');
}

@Component({
  selector: 'app-b-glue',
  imports: [Tabs, TabList, Tab, TabPanel, BGlue],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work" ngTabs bGlue (slide)="onSlide($event.index)">
	<div data-track role="group" aria-label="Slides" tabindex="0">
		<article ngTabPanel value="work-1" id="work-1" class="box" data-surface="raised" data-border data-slide><h3>A trail map</h3><p>Printed in two colors.</p></article>
		<article ngTabPanel value="work-2" id="work-2" class="box" data-surface="raised" data-border data-slide><h3>A field guide</h3><p>Three hundred pages.</p></article>
		<article ngTabPanel value="work-3" id="work-3" class="box" data-surface="raised" data-border data-slide><h3>A season of posters</h3><p>Twelve of them.</p></article>
	</div>
	<ol data-dots ngTabList [(selectedTab)]="selected" aria-label="Choose a slide">
		<li role="none"><a ngTab value="work-1" href="/b-glue#work-1"><span class="visually-hidden">Slide 1</span></a></li>
		<li role="none"><a ngTab value="work-2" href="/b-glue#work-2"><span class="visually-hidden">Slide 2</span></a></li>
		<li role="none"><a ngTab value="work-3" href="/b-glue#work-3"><span class="visually-hidden">Slide 3</span></a></li>
	</ol>
</section>`,
})
export class BGlueCarousel {
  selected = signal<string | undefined>('work-1');
  onSlide(index: number) {
    if (typeof window !== 'undefined') log(window, { v: 'B+glue', index });
  }
}

/** Aria's documented panel shape: content inside ng-template ngTabContent. */
@Component({
  selector: 'app-b-content',
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work" ngTabs>
	<div data-track role="group" aria-label="Slides" tabindex="0">
		<article ngTabPanel value="work-1" id="work-1" class="box" data-surface="raised" data-border data-slide><ng-template ngTabContent><h3>A trail map</h3><p>Printed in two colors.</p></ng-template></article>
		<article ngTabPanel value="work-2" id="work-2" class="box" data-surface="raised" data-border data-slide><ng-template ngTabContent><h3>A field guide</h3><p>Three hundred pages.</p></ng-template></article>
		<article ngTabPanel value="work-3" id="work-3" class="box" data-surface="raised" data-border data-slide><ng-template ngTabContent><h3>A season of posters</h3><p>Twelve of them.</p></ng-template></article>
	</div>
	<ol data-dots ngTabList [(selectedTab)]="selected" aria-label="Choose a slide">
		<li role="none"><a ngTab value="work-1" href="/b-content#work-1"><span class="visually-hidden">Slide 1</span></a></li>
		<li role="none"><a ngTab value="work-2" href="/b-content#work-2"><span class="visually-hidden">Slide 2</span></a></li>
		<li role="none"><a ngTab value="work-3" href="/b-content#work-3"><span class="visually-hidden">Slide 3</span></a></li>
	</ol>
</section>`,
})
export class BContentCarousel {
  selected = signal<string | undefined>('work-1');
}

/** Same A and B, one route each, page wrapper shared. */
@Component({
  selector: 'app-page-a',
  imports: [ACarousel],
  template: `<main class="container stack"><h1>A: ticket 25 row 29</h1><app-a /></main>`,
})
export class PageA {}

@Component({
  selector: 'app-page-b',
  imports: [BCarousel],
  template: `<main class="container stack"><h1>B: Aria Tabs</h1><app-b /></main>`,
})
export class PageB {}

@Component({
  selector: 'app-page-b-glue',
  imports: [BGlueCarousel],
  template: `<main class="container stack"><h1>B+glue: Aria Tabs plus package glue</h1><app-b-glue /></main>`,
})
export class PageBGlue {}

@Component({
  selector: 'app-page-b-content',
  imports: [BContentCarousel],
  template: `<main class="container stack"><h1>B with ngTabContent</h1><app-b-content /></main>`,
})
export class PageBContent {}

/** Both inside @defer (hydrate never): the server HTML is all there is. */
@Component({
  selector: 'app-page-never',
  imports: [ACarousel, BCarousel],
  template: `<main class="container stack"><h1>hydrate never</h1>
    <div data-variant="A">@defer (hydrate never) { <app-a path="/never" p="a-" /> }</div>
    <div data-variant="B">@defer (hydrate never) { <app-b path="/never" p="b-" /> }</div>
  </main>`,
})
export class PageNever {}
