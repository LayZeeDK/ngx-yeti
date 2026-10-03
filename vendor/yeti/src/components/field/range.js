// Range: the filled track and the value readout follow the thumb.
//
// CSS cannot read an input's value, so a range's coloured track has to be told
// how far along it is. Until now the field's docs handed the reader a line to
// paste; this is that line, shipped, and doing the part the pasted one got
// wrong.
//
// What it sets is a unitless share, 0 to 1, and nothing else. The thumb's
// centre does not travel the whole track: it stops half a thumb from each end,
// so a plain percentage and the thumb disagree by that much at the extremes —
// eleven pixels on the field page's own demo. Correcting it needs the thumb's
// width, which CSS knows in its own units and JavaScript would have to measure
// and re-measure on every resize. So the share goes out and field.css does the
// arithmetic, and nothing here reads layout.
//
// The readout is an output element the author puts in the field. Its text is
// the input's value; where it sits is field.css's business. Without the module
// the track simply sits at whatever --yeti-range-value says, which is what a
// page that never loads this keeps doing.
const share = (input) => {
	const min = Number(input.min === '' ? 0 : input.min);
	const max = Number(input.max === '' ? 100 : input.max);
	const span = max - min;
	if (!Number.isFinite(span) || span === 0) return 0;
	return Math.min(1, Math.max(0, (Number(input.value) - min) / span));
};

function sync(input) {
	const field = input.closest('.field');
	// On the field, not the input. Custom properties inherit, so the track
	// still reads it, and the readout beside the input can read it too — a
	// sibling cannot see a property set on the input itself.
	(field || input).style.setProperty('--yeti-range-value', String(share(input)));
	const output = field && field.querySelector(':scope > output');
	// Only the text. A screen reader already hears the value from the input
	// itself, which is why field.css hides this from the accessibility tree.
	if (output) output.textContent = input.value;
}

const syncAll = (root) => root.querySelectorAll?.('.field input[type="range"]').forEach(sync);
syncAll(document);

// Delegated, so a range added after load works too, and one listener covers a
// form of them. input rather than change: the track should follow the drag.
document.addEventListener('input', (event) => {
	const input = event.target?.closest?.('.field input[type="range"]');
	if (input) sync(input);
});

// A range that arrives later starts with its track already filled, rather than
// waiting for the first drag.
new MutationObserver((records) => {
	for (const record of records) for (const node of record.addedNodes) {
		if (node.nodeType !== Node.ELEMENT_NODE) continue;
		if (node.matches('.field input[type="range"]')) sync(node);
		syncAll(node);
	}
}).observe(document.documentElement, { childList: true, subtree: true });
