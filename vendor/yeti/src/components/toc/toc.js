// On-page nav: the link whose heading is topmost in view is the current one.
//
// One IntersectionObserver per toc rather than a scroll listener, because the
// browser does the measuring itself and hands over only the headings whose
// visibility actually changed; a scroll handler would run on every frame of
// every scroll to answer the same question.
//
// Without this module the list is a list of links and every one of them still
// works; what is lost is the mark following the reading position. Tocs added
// after load are not picked up, as with tabs.js: the observer is wired once.
for (const toc of document.querySelectorAll('.toc')) {
	const links = [...toc.querySelectorAll('a[href^="#"]')];
	const byHeading = new Map();
	for (const link of links) {
		// decodeURIComponent, because a heading id with a non-ASCII character
		// arrives percent-encoded in the href and getElementById wants the id.
		const heading = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
		if (heading) byHeading.set(heading, link);
	}
	if (!byHeading.size) continue;

	// Document order, not the order the links happen to be written in: a toc
	// that lists its links out of order should still mark the topmost heading.
	const headings = [...byHeading.keys()].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
	const visible = new Set();

	const update = () => {
		const heading = headings.find((h) => visible.has(h));
		// Between two headings nothing is in view. The last mark is still the
		// truest answer there, so it stays rather than flickering off.
		if (!heading) return;
		const link = byHeading.get(heading);
		if (link.getAttribute('aria-current') === 'true') return;
		for (const other of links) other.removeAttribute('aria-current');
		link.setAttribute('aria-current', 'true');
		toc.dispatchEvent(new CustomEvent('yeti:current', { bubbles: true, composed: true, detail: { link, heading } }));
	};

	// Default options on purpose: threshold 0 with no root margin is what makes
	// "topmost in view" mean "any part of the heading visible", which is the rule
	// the headings.find above assumes. A margin or a higher threshold would shift
	// the answer to a heading the reader can see but the observer cannot.
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) visible.add(entry.target);
			else visible.delete(entry.target);
		}
		update();
	});
	for (const heading of headings) observer.observe(heading);
}
