import fs from 'node:fs';
import path from 'node:path';
import { walkFiles } from './files.js';
import { stripComments } from './imports.js';
import { loadSchema } from './manifest.js';
import { loadCatalogue } from './tokens.js';
import { LAYER_STATEMENT } from './layers.js';

/** Blanks url(...) contents and quoted strings, preserving length, so a semicolon or colon
 *  inside a token's value (a data: URL, say) is never mistaken for a declaration or
 *  property-name boundary. Only property names are checked, so values may be replaced. */
export function sanitizeDeclarations(text) {
	return text
		.replace(/url\(([^)]*)\)/g, (m, inner) => `url(${' '.repeat(inner.length)})`)
		.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => ' '.repeat(m.length));
}

/** Every element a theme's yeti.theme rules may name: the HTML element set, less the
 *  obsolete ones. Lowercase; a selector's type names are compared lowercased. */
const HTML_ELEMENTS = new Set(`
	html head title base link meta style body article section nav aside h1 h2 h3 h4 h5 h6 hgroup
	header footer address p hr pre blockquote ol ul menu li dl dt dd figure figcaption main search div
	a em strong small s cite q dfn abbr ruby rt rp data time code var samp kbd sub sup i b u mark bdi bdo
	span br wbr ins del picture source img iframe embed object video audio track map area svg math
	table caption colgroup col tbody thead tfoot tr td th form label input button select datalist optgroup
	option textarea output progress meter fieldset legend details summary dialog script noscript template
	slot canvas
`.trim().split(/\s+/));
const PSEUDO_CLASSES = new Set(['hover', 'focus-visible', 'active', 'visited']);
const PSEUDO_ELEMENTS = new Set(['selection', 'marker', 'placeholder', 'first-line', 'first-letter']);
const COMPOUND = /^([a-z][a-z0-9-]*)((?::[a-z-]+)*)(?:::([a-z-]+))?$/i;

/** Splits a selector list on its top-level commas. */
function splitSelectorList(list) {
	const parts = [];
	let depth = 0;
	let part = '';
	for (const ch of list) {
		if (ch === '(') depth++;
		else if (ch === ')') depth--;
		if (ch === ',' && depth === 0) { parts.push(part.trim()); part = ''; } else part += ch;
	}
	parts.push(part.trim());
	return parts;
}

/** Why a yeti.theme selector list is refused, one message per offending selector; empty
 *  when every selector is built only from HTML type selectors, descendant and child
 *  combinators, the user-action pseudo-classes and the allowed pseudo-elements, or is
 *  one allowed pseudo-element alone. */
export function checkElementSelector(list) {
	const refused = (detail) => `theme element rules may only select bare HTML elements (${detail})`;
	const problems = [];
	for (const part of splitSelectorList(list)) {
		const found = refused(`found "${part}"`);
		// A lone allowed pseudo-element (::selection) is the idiomatic whole-page form.
		const lone = /^::([a-z-]+)$/i.exec(part);
		if (lone && PSEUDO_ELEMENTS.has(lone[1].toLowerCase())) continue;
		if (!part || /[.#[\]*+~|\\]/.test(part) || /:[\w-]+\(/.test(part)) { problems.push(found); continue; }
		const compounds = part.split(/\s*>\s*|\s+/);
		let problem = null;
		for (const [i, compound] of compounds.entries()) {
			const m = COMPOUND.exec(compound);
			const classes = m ? m[2].split(':').filter(Boolean).map((c) => c.toLowerCase()) : [];
			const element = m?.[3]?.toLowerCase();
			if (!m || classes.some((c) => !PSEUDO_CLASSES.has(c)) || (element && (!PSEUDO_ELEMENTS.has(element) || i < compounds.length - 1))) { problem = found; break; }
			if (!HTML_ELEMENTS.has(m[1].toLowerCase())) { problem = refused(`"${m[1]}" is not an HTML element`); break; }
		}
		if (problem) problems.push(problem);
	}
	return problems;
}

/** Every file validateThemes checks: the shipped themes, and the starter theme a designer copies. */
export function themeFiles(root) {
	const themesDir = path.join(root, 'src', 'themes');
	const starter = path.join(root, 'src', 'starter', 'theme.css');
	return [
		...(fs.existsSync(themesDir) ? walkFiles(themesDir).filter((f) => f.endsWith('.css')) : []),
		...(fs.existsSync(starter) ? [starter] : []),
	];
}

/** A theme is :root blocks of --yeti-* public tokens, outside any layer, plus bare element
 *  rules inside @layer yeti.theme (which may nest @media and @supports). Nothing else. */
export function validateThemes(root, files = themeFiles(root)) {
	const catalogueFile = path.join(root, 'src', 'tokens', 'tokens.json');
	if (!files.length || !fs.existsSync(catalogueFile)) return [];
	const schema = loadSchema(path.join(root, 'schema', 'tokens.schema.json'));
	const { entries } = loadCatalogue(catalogueFile, schema);
	const publicNames = new Set(entries.filter((e) => e.public).map((e) => e.name));
	const notThemable = new Set(entries.filter((e) => e.theme === false).map((e) => e.name));
	const errors = [];
	for (const file of files) {
		const text = stripComments(fs.readFileSync(file, 'utf8'));
		const stack = [];
		let selector = '';
		let line = 1;
		let selectorLine = 1;
		let decls = '';
		// Anything at the top level yet: the layer statement may only come first.
		let started = false;
		const inDeclarations = () => ['root', 'rule'].includes(stack.at(-1)?.kind);
		for (const ch of text) {
			if (ch === ';' && stack.length === 0) {
				// A top-level statement. The one allowed is Yeti's own layer order,
				// first in the file, so a theme loaded before yeti.css still puts
				// its element rules in the right place.
				const statement = `${selector.trim()};`;
				if (/^@layer\b/.test(statement)) {
					if (started || statement.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ') !== LAYER_STATEMENT) {
						errors.push({ file, line: selectorLine, message: `the only @layer statement a theme may make is Yeti's own order, first in the file: ${LAYER_STATEMENT} (found "${statement}")` });
					}
				} else {
					errors.push({ file, line: selectorLine, message: `themes may only set --yeti-* tokens on :root (found "${statement}")` });
				}
				started = true;
				selector = '';
				continue;
			}
			if (ch === '{') {
				if (stack.length === 0) started = true;
				// A block opened inside a declaration block (nesting) has its prelude after the last ';'.
				const sel = (inDeclarations() ? decls.slice(decls.lastIndexOf(';') + 1) : selector).trim();
				const top = stack.at(-1)?.kind;
				if (top === 'rule') {
					errors.push({ file, line: selectorLine, message: `nest @media or @supports around the rule, not inside it; nested selectors are not allowed (found "${sel}")` });
					stack.push({ kind: 'other' });
				} else if (top === 'layer' || top === 'at') {
					if (/^@(media|supports)\b/.test(sel)) {
						stack.push({ kind: 'at' });
					} else {
						for (const message of checkElementSelector(sel)) errors.push({ file, line: selectorLine, message });
						stack.push({ kind: 'rule', line: selectorLine });
					}
				} else if (/^@media\s*\(\s*prefers-color-scheme:\s*(light|dark)\s*\)$/.test(sel) && !top) {
					stack.push({ kind: 'media' });
				} else if (sel === ':root' && (!top || top === 'media')) {
					stack.push({ kind: 'root', line: selectorLine });
				} else if (/^@layer\s+yeti\.theme$/.test(sel) && !top) {
					stack.push({ kind: 'layer' });
				} else if (/^@layer\b/.test(sel) && !top) {
					errors.push({ file, line: selectorLine, message: `themes may only open @layer yeti.theme (found "${sel}")` });
					stack.push({ kind: 'other' });
				} else {
					errors.push({ file, line: selectorLine, message: `themes may only set --yeti-* tokens on :root (found "${sel}")` });
					stack.push({ kind: 'other' });
				}
				selector = ''; decls = '';
			} else if (ch === '}') {
				const block = stack.pop();
				// Text left over at the end of a block that holds rules (a statement
				// such as @import, a stray declaration) is neither rule nor block.
				if (['layer', 'at', 'media'].includes(block?.kind) && selector.trim()) {
					errors.push({ file, line: selectorLine, message: `theme blocks may only hold rules (found "${selector.trim()}")` });
				}
				const declarations = sanitizeDeclarations(decls).split(';').map((d) => d.split(':')[0].trim()).filter(Boolean);
				if (block?.kind === 'root') {
					for (const prop of declarations) {
						if (!prop.startsWith('--yeti-')) errors.push({ file, line: block.line, message: `themes may only set --yeti-* tokens (found "${prop}")` });
						else if (!publicNames.has(prop)) errors.push({ file, line: block.line, message: `theme sets "${prop}", which is not a public token` });
						else if (notThemable.has(prop)) errors.push({ file, line: block.line, message: `theme sets "${prop}", which is a per-element input, not a theme value` });
					}
				} else if (block?.kind === 'rule') {
					for (const prop of declarations.filter((p) => p.startsWith('--'))) {
						errors.push({ file, line: block.line, message: `theme element rules may not set custom properties; set tokens on :root (found "${prop}")` });
					}
				}
				selector = ''; decls = '';
			} else {
				if (inDeclarations()) decls += ch; else selector += ch;
				if (ch === '\n') { line++; if (!selector.trim()) selectorLine = line; }
			}
		}
		// Text after the last block that never reached a ; or a { (a statement
		// missing its semicolon, a stray word) is caught here.
		if (selector.trim()) {
			errors.push({ file, line: selectorLine, message: `themes may only set --yeti-* tokens on :root (found "${selector.trim()}")` });
		}
	}
	return errors;
}
