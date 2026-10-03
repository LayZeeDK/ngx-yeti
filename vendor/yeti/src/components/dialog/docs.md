## When to use it

A decision that has to be made before anything else happens: confirming something destructive, a short form the page cannot carry, a message that must be acknowledged. Anything the reader can come back to later belongs on the page rather than over it.

## How it works

A native `dialog`, opened as a modal. That one word is why the component exists in this shape: `showModal` makes everything behind the dialog inert, keeps focus inside it, closes it on Escape, and gives you a `::backdrop` to paint. None of that is Yeti's, and none of it needs ARIA.

Opening is native too. A `button` carrying `commandfor` with the dialog's id and `command="show-modal"` opens it modally, with no script. Closing needs none either if you use a form: a button inside `<form method="dialog">` closes the dialog on its own. `dialog.js` adds the two things the platform does not do yet: a click on the backdrop closes the dialog, and focus returns to the button that opened it when it closes.

```html
<button class="button" type="button" commandfor="share" command="show-modal">Share</button>

<dialog class="dialog" id="share" data-max="sm" aria-labelledby="share-title">
	<h2 id="share-title">Share this page</h2>
	<p>Anyone with the link can read it.</p>
	<footer>
		<form method="dialog"><button class="button" type="submit">Done</button></form>
	</footer>
</dialog>
```

## Accessibility

Name the dialog with `aria-labelledby` pointing at its heading, so it is announced as something rather than as an unnamed dialog. Because it is opened modally the page behind it is genuinely inert, not merely covered, so a screen reader cannot wander out of it. Focus returns to the opener on close, which is what keeps a keyboard reader's place.

Without the module the dialog still opens and Escape still closes it. What is lost is the backdrop click and, in Safari, the return of focus to the opener, because Safari does not focus a button when it is clicked. Load the module on any page where a keyboard reader will meet a dialog.
