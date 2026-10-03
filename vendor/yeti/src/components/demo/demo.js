// Demo frames. A framed demo carries its example twice, once escaped into the
// iframe's srcdoc and once as code under the box, and an author writing one
// by hand has to keep the two in step. The docs generator does that for the
// site; this module does it for everyone else: the author writes the code
// once, in the pre, and the frame is built from it. Without the module the
// code still shows and the box stays empty, so nothing depends on it.
//
// The framed document is a whole Yeti page: the host page's own Yeti
// stylesheet, found by its file name, unless the figure names another with
// data-stylesheet, and yeti.js from the folder beside it, so an example that
// needs a module has it. A host page in someone else's colors points at a
// plain yeti.css that way; host yeti.js next to it.
//
// It also gives each box a grip on its end edge, a separator a mouse, a
// finger or the keyboard can move, because the browser's own resize corner
// is invisible in Safari and does nothing for touch or keys. Without the
// module the box keeps that native corner.
// Safe on pages with no demo, and demos added later are filled as they land.

// The resize logic, kept apart from the page so a Node test can call it.
// Widths are CSS pixels of the box's content box, the size the width tokens
// and the stop label measure.

// A drag moves the box's end edge with the pointer: rightward in a
// left-to-right page, leftward in a right-to-left one, never past the box's
// own min and max.
function widthFromDrag(startPx, dx, rtl, minPx, maxPx) {
	return Math.min(maxPx, Math.max(minPx, startPx + (rtl ? -dx : dx)));
}

// A key steps to the next stop strictly beyond the current width, up
// (direction 1) or down (-1); past the last stop that fits, the box goes to
// its max or min. A width a hair off a stop counts as on it.
function stepWidth(currentPx, direction, stopsPx, minPx, maxPx) {
	const beyond = direction > 0
		? stopsPx.filter((stop) => stop > currentPx + 0.5)
		: stopsPx.filter((stop) => stop < currentPx - 0.5);
	const next = beyond.length ? (direction > 0 ? Math.min(...beyond) : Math.max(...beyond)) : (direction > 0 ? maxPx : minPx);
	return Math.min(maxPx, Math.max(minPx, next));
}

// The stop a width is at, named exactly as the bar's label names it: the
// largest stop at or below the width, and xs for anything below sm.
function stopName(px, stops) {
	const floor = stops.find((stop) => stop.name === 'sm')?.px ?? 0;
	let name = 'xs';
	for (const stop of stops) if (stop.px >= floor && px >= stop.px) name = stop.name;
	return name;
}

const stylesheetFor = (figure) => figure.dataset.stylesheet
	|| document.querySelector('link[rel="stylesheet"][href$="yeti.css"]')?.href
	|| '';

function fill(figure) {
	const box = figure.querySelector(':scope > [data-preview]');
	const code = figure.querySelector(':scope > details > pre > code, :scope > details > pre');
	if (!box || !code) return;
	let frame = box.querySelector(':scope > iframe');
	// An empty box asks for its frame to be made; the marker's value names it.
	if (!frame && box.childElementCount === 0) {
		frame = document.createElement('iframe');
		frame.title = `${box.dataset.preview || 'Example'}, live`;
		box.append(frame);
	}
	// A frame the author already filled, or a box holding direct markup, is left alone.
	if (!frame || frame.hasAttribute('srcdoc')) return;
	const href = stylesheetFor(figure);
	if (!href) return;
	// Relative paths in the example resolve beside the stylesheet, as the
	// generator arranges, so a picture the docs host is found from any page.
	// The stylesheet may itself be a relative path, so it is resolved first.
	const base = new URL('.', new URL(href, document.baseURI)).href;
	frame.srcdoc = `<base href="${base}"><link rel="stylesheet" href="${href}"><script type="module" src="${base}yeti.js"></script><body style="margin:0;padding:var(--yeti-space-md)">${code.textContent.trim()}`;
}

// The width stops, in rem: the width tokens' defaults, the same thresholds
// the bar's label flips at.
const stopsRem = [['2xs', 12], ['xs', 16], ['sm', 24], ['md', 32], ['lg', 48], ['xl', 64], ['2xl', 80]];
const stops = () => {
	const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	return stopsRem.map(([name, size]) => ({ name, px: size * rem }));
};
// The box is content-box, so its computed inline size is the content width.
const contentWidth = (box) => parseFloat(getComputedStyle(box).inlineSize);
// The box's own min and max, read by asking for nothing and for everything,
// so they are whatever the stylesheet says, caps and container included.
function limits(box) {
	const authored = box.style.inlineSize;
	box.style.inlineSize = '0px';
	const min = contentWidth(box);
	box.style.inlineSize = '100000px';
	const max = contentWidth(box);
	box.style.inlineSize = authored;
	return { min, max };
}

function grip(figure) {
	const box = figure.querySelector(':scope > [data-preview]');
	if (!box || figure.querySelector(':scope > [role="separator"]')) return;
	const handle = document.createElement('div');
	handle.setAttribute('role', 'separator');
	handle.setAttribute('aria-orientation', 'vertical');
	handle.setAttribute('aria-label', `Resize ${box.dataset.preview || 'example'}`);
	handle.tabIndex = 0;
	box.after(handle);
	let bounds = limits(box);
	const rtl = () => getComputedStyle(box).direction === 'rtl';
	// The values in pixels, and the box's outer edge for the stylesheet to
	// put the grip on, kept current however the box's size changes.
	const update = () => {
		const now = contentWidth(box);
		handle.setAttribute('aria-valuemin', Math.round(bounds.min));
		handle.setAttribute('aria-valuemax', Math.round(bounds.max));
		handle.setAttribute('aria-valuenow', Math.round(now));
		handle.setAttribute('aria-valuetext', `${stopName(now, stops())}, ${Math.round(now)} pixels`);
		// The box's end edge from the figure's inline start, and its middle
		// from the figure's top; the figure is the grip's containing block.
		const edge = rtl() ? figure.clientWidth - box.offsetLeft : box.offsetLeft + box.offsetWidth;
		handle.style.setProperty('--_yeti-demo-edge', `${edge}px`);
		handle.style.setProperty('--_yeti-demo-middle', `${box.offsetTop + box.offsetHeight / 2}px`);
	};
	const set = (px) => {
		box.style.inlineSize = `${px}px`;
		update();
	};
	new ResizeObserver(update).observe(box);
	// The container changing width moves the max.
	new ResizeObserver(() => { bounds = limits(box); update(); }).observe(figure);

	handle.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		handle.focus();
		bounds = limits(box);
		const start = contentWidth(box);
		const from = event.clientX;
		const backwards = rtl();
		// The grip captures the pointer, so a frame under it cannot take the
		// drag. The frame's pointer-events are left alone: turning them off for
		// the drag left Chromium sending the wheel to the page, not the frame,
		// for a while after.
		const move = (e) => set(widthFromDrag(start, e.clientX - from, backwards, bounds.min, bounds.max));
		handle.addEventListener('pointermove', move);
		handle.addEventListener('lostpointercapture', () => {
			handle.removeEventListener('pointermove', move);
		}, { once: true });
		handle.setPointerCapture(event.pointerId);
	});

	handle.addEventListener('keydown', (event) => {
		const { key } = event;
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
		event.preventDefault();
		bounds = limits(box);
		if (key === 'Home') return set(bounds.min);
		if (key === 'End') return set(bounds.max);
		const direction = (key === 'ArrowRight' ? 1 : -1) * (rtl() ? -1 : 1);
		set(stepWidth(contentWidth(box), direction, stops().map((stop) => stop.px), bounds.min, bounds.max));
	});
}

const enhance = (figure) => {
	fill(figure);
	grip(figure);
};
const enhanceAll = (root) => root.querySelectorAll?.('.demo').forEach(enhance);
enhanceAll(document);
new MutationObserver((records) => {
	for (const record of records) for (const node of record.addedNodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue;
		if (node.matches('.demo')) enhance(node);
		enhanceAll(node);
	}
}).observe(document.body, { childList: true, subtree: true });
