// dist/yeti.min.css. lightningcss is the one dev dependency whose work
// reaches a user's browser, and it is here to make the stylesheet smaller,
// never different: the targets below are the last browsers of 2025, which is
// Yeti's Baseline 2025 floor, so the minifier finds nothing old enough to
// compile for and leaves light-dark(), @starting-style, nesting, range
// container queries and the colour functions exactly as they are written.
import { transform, Features } from 'lightningcss';

// lightningcss wants one semver component per byte of a 24-bit number.
const version = (major, minor = 0) => (major << 16) | (minor << 8);

// The last release of each engine in 2025. A feature that reached Baseline by
// the end of 2025 is in all of them, which is the whole of what Yeti uses
// unguarded, so this says "compile nothing" in the vocabulary lightningcss
// speaks. Raise these when the floor moves; never lower them.
export const BASELINE_2025 = {
	chrome: version(143),
	edge: version(143),
	firefox: version(145),
	safari: version(26, 2),
	ios_saf: version(26, 2),
};

// The targets already say it, and this says it again where a future version of
// lightningcss might change its mind about what a target needs. Features.Colors
// covers light-dark() and the oklch/color-mix fallbacks; the rest are the
// lowerings that would make the minified file read differently from the
// readable one beside it.
const NEVER_LOWER = Features.Colors | Features.Nesting | Features.Selectors | Features.MediaQueries | Features.LogicalProperties | Features.VendorPrefixes;

/** Minifies a stylesheet without transpiling it. Throws when lightningcss cannot parse it. */
export function minifyCss({ css, filename = 'yeti.css' }) {
	const { code, warnings } = transform({
		filename,
		code: Buffer.from(css),
		minify: true,
		targets: BASELINE_2025,
		exclude: NEVER_LOWER,
		// errorRecovery skips what it cannot parse and carries on, which would
		// ship a stylesheet quietly missing a rule. A build that stops is the
		// better failure.
		errorRecovery: false,
	});
	return { css: code.toString('utf8'), warnings: warnings ?? [] };
}
