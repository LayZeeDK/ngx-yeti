#!/usr/bin/env node
// The stability page's promise, checked. Everything it freezes is read at a
// git ref and at HEAD: class names, attribute and marker names with their
// value lists, vocabularies, public token names, module file names and event
// names. Anything present at the ref and gone or changed at HEAD is a break;
// anything new is an addition, which the beta allows. Run it against the last
// tag before a release, and against develop before merging anything that
// touches a manifest:
//
//   node bin/frozen.js v7.0.0-beta.0
//
// Exit 1 on any break, so it can gate a release the way validate does.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const fileAt = (root, ref, file) => { try { return git(root, 'show', `${ref}:${file}`); } catch { return null; } };

/** Every frozen name at one ref, as sets and maps of sets. */
export function surfaceAt(root, ref) {
	const files = git(root, 'ls-tree', '-r', '--name-only', ref).split('\n').filter((p) => /^src\/[a-z]+\/[a-z-]+\/manifest\.json$/.test(p));
	const vocabulary = JSON.parse(fileAt(root, ref, 'schema/vocabulary.json') ?? '{}');
	const values = (a) => a.values ?? vocabulary[a.vocabulary] ?? [];
	const out = { classes: new Set(), attributes: new Map(), markers: new Map(), events: new Set(), modules: new Set(), vocabularies: new Map(), tokens: new Set() };
	for (const file of files) {
		const m = JSON.parse(fileAt(root, ref, file));
		out.classes.add(m.class);
		for (const a of m.attributes ?? []) out.attributes.set(`${m.class} ${a.name}`, new Set(values(a)));
		for (const k of m.markers ?? []) {
			out.markers.set(`${m.class} ${k.name}`, new Set(values(k)));
			// A marker on * is writable on the element itself, so it is also that
			// class's attribute: an attribute that becomes such a marker has not
			// gone anywhere a page could notice.
			if (k.on === '*') out.attributes.set(`${m.class} ${k.name}`, new Set(values(k)));
		}
		for (const j of m.js ?? []) {
			out.modules.add(j.module);
			for (const e of j.events ?? []) out.events.add(`${m.class} ${typeof e === 'string' ? e : e.name}`);
		}
	}
	for (const [name, list] of Object.entries(vocabulary)) out.vocabularies.set(name, new Set(list));
	for (const t of JSON.parse(fileAt(root, ref, 'src/tokens/tokens.json') ?? '[]')) out.tokens.add(t.name);
	return out;
}

/** Compares two surfaces. Returns { breaks, additions } as lists of one-line strings. */
export function compareSurfaces(before, after) {
	const breaks = [];
	const additions = [];
	const sets = (label, a, b) => {
		for (const x of a) if (!b.has(x)) breaks.push(`${label} ${x} is gone`);
		for (const x of b) if (!a.has(x)) additions.push(`${label} ${x}`);
	};
	const maps = (label, a, b) => {
		for (const [k, vs] of a) {
			if (!b.has(k)) { breaks.push(`${label} ${k} is gone`); continue; }
			sets(`${label} ${k} value`, vs, b.get(k));
		}
		for (const k of b.keys()) if (!a.has(k)) additions.push(`${label} ${k}`);
	};
	sets('class', before.classes, after.classes);
	maps('attribute', before.attributes, after.attributes);
	maps('marker', before.markers, after.markers);
	maps('vocabulary', before.vocabularies, after.vocabularies);
	sets('token', before.tokens, after.tokens);
	sets('module', before.modules, after.modules);
	sets('event', before.events, after.events);
	return { breaks, additions };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const ref = process.argv[2];
	if (!ref) { console.error('usage: node bin/frozen.js <git ref>'); process.exit(2); }
	const root = process.cwd();
	const { breaks, additions } = compareSurfaces(surfaceAt(root, ref), surfaceAt(root, 'HEAD'));
	for (const b of breaks) console.log(`break: ${b}`);
	for (const a of additions) console.log(`added: ${a}`);
	console.log(`frozen: ${breaks.length} break${breaks.length === 1 ? '' : 's'}, ${additions.length} addition${additions.length === 1 ? '' : 's'} since ${ref}`);
	process.exit(breaks.length ? 1 : 0);
}
