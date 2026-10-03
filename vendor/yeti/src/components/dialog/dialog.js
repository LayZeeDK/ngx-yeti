// Dialog: the browser opens it. A button carrying commandfor="<id>" and
// command="show-modal" calls showModal on that dialog itself, which is what
// makes the page behind it inert, holds focus inside, and closes on Escape.
// This module adds the two things the platform does not do yet. A click on
// the backdrop closes the dialog: closedby="any" would, but Safari lacks it
// and it is not Baseline. Focus returns to the button that opened it: the
// browser restores focus to whatever had it when the dialog opened, and in
// WebKit a clicked button never has it. Delegated, so dialogs added after
// load work too, and safe on a page with none.
// The opener is remembered per dialog rather than once for the page, so a
// dialog opened from inside another still returns focus to its own trigger.
const openers = new WeakMap();
// Whether the last press on each dialog began outside its box. A click whose
// press and release land on different elements is delivered to their common
// ancestor with the release's coordinates, so a drag that starts on text in
// the dialog and ends over the backdrop looks exactly like a backdrop click.
// Closing needs both ends outside.
const pressedOutside = new WeakMap();
const outside = (dialog, event) => {
	const box = dialog.getBoundingClientRect();
	return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
};

// A command event is dispatched on the dialog and does not bubble, so the
// document hears it only on the capture phase. An already open dialog is left
// alone: the browser ignores the command, and a second listener would only
// overwrite the opener with the wrong button.
document.addEventListener('command', (event) => {
	const dialog = event.target?.closest?.('dialog.dialog');
	if (!dialog || dialog.open || event.command !== 'show-modal' || !event.source) return;
	// The opener is recorded here, before the default action, because that is
	// what moves focus off the button; by the time the dialog is open the
	// button that was pressed is no longer knowable.
	openers.set(dialog, event.source);
	// The command event fires before the browser acts on it, and a listener may
	// still cancel it, so nothing is claimed here. The default action runs later
	// in the same task, which makes a task the earliest point at which the
	// dialog is known to be open. A microtask is too early for a trusted event:
	// its checkpoint is reached with the stack already empty, before the default
	// action, and the guard below would find the dialog still shut and say
	// nothing. Registering the close listener here too means a cancelled command
	// leaks nothing, since the listener only exists once the dialog really opened.
	setTimeout(() => {
		if (!dialog.open) return;
		dialog.addEventListener('close', () => {
			openers.get(dialog)?.focus?.({ preventScroll: true });
			openers.delete(dialog);
		}, { once: true });
		dialog.dispatchEvent(new CustomEvent('yeti:open', { bubbles: true, composed: true }));
	});
}, { capture: true });

document.addEventListener('pointerdown', (event) => {
	const dialog = event.target?.closest?.('dialog.dialog');
	if (dialog?.open) pressedOutside.set(dialog, outside(dialog, event));
}, { capture: true });

document.addEventListener('click', (event) => {
	// A click on the backdrop reports the dialog as its target but lands
	// outside the dialog's own box. A keyboard activation has no coordinates
	// at all, so it must not be mistaken for one.
	const dialog = event.target?.closest?.('dialog.dialog');
	if (!dialog || !dialog.open || event.detail === 0) return;
	if (outside(dialog, event) && pressedOutside.get(dialog)) dialog.close();
});

// close does not bubble, so the document hears it only on the capture phase.
// Every close passes through here, whether it came from Escape, a form
// button, the backdrop click above, or a script calling close() — so the
// event does not depend on how the dialog was opened, the way the focus
// return above does.
document.addEventListener('close', (event) => {
	const dialog = event.target?.closest?.('dialog.dialog');
	if (dialog) dialog.dispatchEvent(new CustomEvent('yeti:close', { bubbles: true, composed: true }));
}, { capture: true });
