// Form validation: the browser already knows what is wrong with a control and
// has a sentence for it in the reader's own language. This puts that sentence
// where the field already shows an error, marks the control the way the field
// already reads, and stops the submit.
//
// The submit is stopped for every invalid control in the form, whether or not
// it sits inside a .field. A form carrying novalidate has no bubble of its
// own, so a control the page left outside a field would otherwise submit an
// invalid form in silence. The field decides only where a message can go.
//
// It runs on submit, never before, so nothing is red while a person is still
// typing their first character; :user-invalid covers the field they have
// finished with, and this covers the one they never touched.
//
// A form that loads this should carry novalidate. Without it the browser's own
// bubble opens on the first invalid control and the submit event is never
// fired at all, so this would never run. The docs say so.
//
// Delegated on document, so a form added after load works too, and safe on a
// page with no form at all. No rules of its own, no async checks, and no
// message catalogue: everything it says comes from the platform.

// The slots this module filled. An author's own message is never overwritten,
// but the browser's own wording is rewritten as the reason changes: "fill in
// this field" becomes "include an @" once something has been typed. A slot the
// page fills in itself after the module has already written to it is treated as
// the module's own and overwritten on the next submit; that is accepted, since
// remembering it was written is what keeps the wording current.
const written = new WeakSet();

function mark(control) {
	control.setAttribute('aria-invalid', 'true');
	// The nearest field that has a slot, not simply the nearest field. A radio
	// or checkbox group is a fieldset.field wrapping one div.field per choice,
	// so the message belongs to the fieldset that carries the [data-error] and
	// not to the bare div around the input, which has none. A control with no
	// such field above it is still marked; there is just nowhere to write.
	const error = control.closest('.field:has(> [data-error])')?.querySelector(':scope > [data-error]');
	if (!error) return;
	if (written.has(error) || !error.textContent.trim()) {
		error.textContent = control.validationMessage;
		written.add(error);
	}
}

document.addEventListener('submit', (event) => {
	const form = event.target;
	if (!form?.matches?.('form')) return;
	// The page's own listener ran first and asked for nothing to happen.
	if (event.defaultPrevented) return;
	// validity rather than checkValidity(), which fires an invalid event of
	// its own on every control it touches; the only event this module should
	// be dispatching is its own. Every invalid control counts, field or no
	// field, so nothing invalid slips past under novalidate.
	const controls = [...form.elements].filter((el) => el.willValidate && !el.validity.valid);
	if (!controls.length) return;
	event.preventDefault();
	for (const control of controls) mark(control);
	// The first one, because that is where the reader has to start, and
	// focusing it is also what scrolls it into view.
	controls[0].focus();
	form.dispatchEvent(new CustomEvent('yeti:invalid', { bubbles: true, composed: true, detail: { controls } }));
});

// input for what is typed, change for what is picked. The mark goes the moment
// the control is valid again, rather than waiting for the next submit, because
// a red box that stays red after it has been fixed teaches a reader to ignore
// the color.
const clear = (event) => {
	const control = event.target;
	if (!control?.willValidate) return;
	// change fires only on the radio that became checked, but every radio of
	// the group was marked and the group's error shows while any one of them
	// still carries the mark, so the whole group is cleared together. A shared
	// name gives a RadioNodeList from form.elements; a name held by one control
	// gives that control, which has a nodeType where the list does not.
	const named = control.name && control.form ? control.form.elements[control.name] : null;
	const group = !named ? [control] : named.nodeType ? [named] : [...named];
	for (const member of group) {
		if (member.willValidate && member.validity.valid) member.removeAttribute('aria-invalid');
	}
};
document.addEventListener('input', clear);
document.addEventListener('change', clear);
