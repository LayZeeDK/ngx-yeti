// dist/yeti.min.js. esbuild minifies the module bundle the way lightningcss
// minifies the stylesheet: smaller, never different. The target is esnext, so
// nothing is transpiled; Yeti's floor is Baseline 2025 and every browser at
// that floor reads the source as written. Names are shortened and whitespace
// goes, which is what a file called .min.js is expected to be, and the source
// map beside it is what keeps a stack trace pointing at code a person
// recognises: the map's one source is dist/yeti.js, the readable bundle.
//
// Neither this nor esbuild is anything a user needs. The source tree loads
// unbuilt and dist/yeti.js is the plain concatenation; this writes the one
// optional file beside them.
import { transformSync } from 'esbuild';

/**
 * Minifies a bundle. `source` is the exact text of the readable file the map
 * should point at, banner included, so every position in the map is a
 * position in that file. The banner itself is dropped from the output, since
 * esbuild would keep it on the first line ahead of the code; build() puts it
 * back on its own line and shifts the map by that line.
 * Returns { js, map }: the minified code with no trailing newline, and the
 * source map as an object with `sources` naming `sourcefile`.
 * Throws when esbuild cannot parse the source, with esbuild's message, which
 * names the line and column.
 */
export function minifyJs(source, { sourcefile = 'yeti.js' } = {}) {
	let result;
	try {
		result = transformSync(source, {
			minify: true,
			format: 'esm',
			target: 'esnext',
			charset: 'utf8',
			legalComments: 'none',
			sourcemap: 'external',
			sourcesContent: false,
			sourcefile,
		});
	} catch (e) {
		const first = e.errors?.[0];
		const where = first?.location ? ` at ${first.location.line}:${first.location.column}` : '';
		throw new Error(`${first?.text ?? e.message}${where}`);
	}
	const map = JSON.parse(result.map);
	return { js: result.code.trimEnd(), map };
}

/**
 * The map for a minified file whose first line is a banner the minifier never
 * saw: one empty generated line in front of every mapping, and the file names
 * filled in. `mappings` is a list of generated lines separated by semicolons,
 * so an empty first line is one leading semicolon.
 */
export function bannered(map, { file }) {
	return { ...map, file, mappings: `;${map.mappings}` };
}
