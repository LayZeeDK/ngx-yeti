// Alert: a click on the close button fades the alert out and removes it.
// Delegated, so alerts added after load work too; safe on pages with none.
// The duration is the fast token, which reduced motion collapses.
document.addEventListener('click', (event) => {
	// The page's own listener ran first and asked for nothing to happen.
	if (event.defaultPrevented) return;
	const button = event.target?.closest?.('.alert > [data-close]');
	if (!button) return;
	const alert = button.parentElement;
	const parent = alert.parentElement;
	const held = alert.contains(document.activeElement);
	const duration = parseFloat(getComputedStyle(alert).getPropertyValue('--yeti-duration-fast')) || 0;
	alert.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' }).finished.then(() => {
		// Announced before the alert leaves the page, so a listener can still
		// read the element it is about: bubbles, so one listener on document
		// hears every alert, and composed, so it crosses out of a shadow root.
		alert.dispatchEvent(new CustomEvent('yeti:close', { bubbles: true, composed: true }));
		alert.remove();
		// The button that had focus has just gone, so put focus where the alert
		// was rather than letting it fall to the top of the document.
		// Only add tabindex if the parent isn't already focusable, and only
		// remove it again if we added it, so an author's own tabindex (a focus
		// trap, a scrollable region) survives untouched.
		if (held && parent) {
			const had = parent.getAttribute('tabindex');
			if (had === null) parent.setAttribute('tabindex', '-1');
			parent.focus({ preventScroll: true });
			if (had === null) parent.addEventListener('blur', () => parent.removeAttribute('tabindex'), { once: true });
		}
	});
});
