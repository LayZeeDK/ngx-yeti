// Enter: data-once. enter.css gives a `.enter[data-once]` element (and, with
// data-stagger, each of its children) `animation: none`, so it simply sits
// there, visible, until this module says otherwise; without it that is where
// it stays, present but never animated, rather than stranded invisible.
//
// One IntersectionObserver for every .enter[data-once] already in the
// document: the first time an entry is near the viewport, removing its
// data-once attribute is the whole trick. That drops the `animation: none`
// rule out of the match, and the ordinary .enter rules underneath it apply
// exactly as if data-once had never been there. A CSS animation only plays
// when the style that names it changes, and this is that one change: it
// happens once, because the attribute is gone and nothing here ever puts it
// back, so scrolling away and back has nothing left to replay.
//
// rootMargin grows the root 10% of the viewport past its real bottom edge,
// so intersection starts a little before the element is actually on screen:
// the arrival is already under way by the time the reader's eye reaches it,
// rather than starting only once it has fully crossed the fold.
//
// Elements added after load are not picked up, as with toc.js and tabs.js:
// the observer is wired once, over what is on the page when this module
// runs.
const once = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (!entry.isIntersecting) continue;
		entry.target.removeAttribute('data-once');
		once.unobserve(entry.target);
	}
}, { rootMargin: '0px 0px 10% 0px' });

for (const el of document.querySelectorAll('.enter[data-once]')) once.observe(el);
