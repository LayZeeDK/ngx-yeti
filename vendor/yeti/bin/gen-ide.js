#!/usr/bin/env node
// Editor completion from the manifest: VS Code custom data and JetBrains
// web-types, both plain JSON from the same traversal. Neither format can key
// a completion off a class, and Yeti's identity is a class, so every
// attribute is offered on every element; each description opens with the
// components that accept it so the list explains itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, loadAndMerge, loadVocabulary } from './lib/manifest.js';
import { readPackage } from './build.js';

/** Every distinct data-* name across attributes and markers, with who uses it.
 *  Editor completion cannot key off a class, so a name two components share
 *  offers every value any of them accepts: an enum already seen gets any new
 *  reader's values appended, in the order each was first seen, rather than
 *  keeping only the first reader's list. The first reader's own type and
 *  vocabulary name (used only to name the shared value set) stay put. */
export function collectAttributes(merged) {
	const map = new Map();
	for (const component of Object.values(merged)) {
		const own = component.attributes.map((a) => ({ ...a, on: null }));
		const markers = (component.markers ?? []).map((m) => ({ ...m, on: m.on ?? '> *' }));
		for (const attr of [...own, ...markers]) {
			const entry = map.get(attr.name);
			if (entry) {
				// A fresh array: entry.values (like attr.values) may still be the
				// manifest's own array, and mutating it in place would leak the
				// union back into that component's own declared values.
				if (attr.type === 'enum' && attr.values) {
					const values = entry.values ? [...entry.values] : [];
					for (const v of attr.values) if (!values.includes(v)) values.push(v);
					entry.values = values;
				}
				entry.uses.push({ component: component.name, on: attr.on, description: attr.description });
				continue;
			}
			map.set(attr.name, { type: attr.type, vocabulary: attr.vocabulary ?? null, values: attr.values ? [...attr.values] : null, uses: [{ component: component.name, on: attr.on, description: attr.description }] });
		}
	}
	return map;
}

// "rail, pill: Gap between items." for a root attribute; a marker names the
// element it lives on, since that is where the author will be typing. A name
// shared by components that mean different things by it gets one clause per
// meaning: data-gap is padding on a box and space between children on a
// stack, so the first component's sentence cannot stand for the other twenty.
function describe(entry) {
	const byDescription = new Map();
	for (const use of entry.uses) {
		const who = use.on === null ? use.component : `${use.component}, on a child (${use.on})`;
		byDescription.set(use.description, [...(byDescription.get(use.description) ?? []), who]);
	}
	// Every description is a whole sentence ending in a full stop, so a space
	// is the separator: a semicolon would read ".; " between clauses.
	return [...byDescription.entries()].map(([description, who]) => `${who.join(', ')}: ${description}`).join(' ');
}

// A named vocabulary and an attribute's own inline `values` both need a value
// set; an inline enum has no vocabulary name to share, so its set is keyed by
// the attribute's own name instead.
function valueSetName(name, entry) {
	return entry.vocabulary ? `yeti-${entry.vocabulary}` : `yeti-${name}`;
}

export function htmlData(merged, vocabulary) {
	const map = collectAttributes(merged);
	const sets = new Map();
	// entry.values already holds the resolved (and, for a shared name, merged)
	// list: reading the raw vocabulary by name here instead would give back
	// only the first reader's list on a name a later reader adds values to.
	for (const [name, entry] of map.entries()) {
		if (entry.values) sets.set(valueSetName(name, entry), entry.values.map((v) => ({ name: v })));
	}
	const valueSets = [...sets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, values]) => ({ name, values }));
	const globalAttributes = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, entry]) => {
		const out = { name, description: describe(entry) };
		if (entry.vocabulary || entry.values) out.valueSet = valueSetName(name, entry);
		return out;
	});
	return { version: 1.1, valueSets, globalAttributes };
}

export function webTypes(merged, vocabulary, pkg) {
	const map = collectAttributes(merged);
	const attributes = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, entry]) => {
		const out = { name, description: describe(entry) };
		if (entry.type === 'boolean') out.value = { kind: 'plain', type: 'boolean' };
		// Same reasoning as htmlData: entry.values is already the resolved,
		// merged list, so it is read the same way whether the first reader
		// named a vocabulary or gave inline values.
		else if (entry.values) {
			out.value = { kind: 'plain', type: 'string' };
			out.values = entry.values.map((v) => ({ name: v }));
		} else out.value = { kind: 'plain', type: entry.type === 'number' ? 'number' : 'string' };
		return out;
	});
	return {
		$schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
		name: pkg.name,
		version: pkg.version,
		'description-markup': 'markdown',
		contributions: { html: { attributes } },
	};
}

export function writeIde({ root, merged, vocabulary, pkg }) {
	const distDir = path.join(root, 'dist');
	fs.mkdirSync(distDir, { recursive: true });
	const outputs = [];
	const write = (rel, obj) => { fs.writeFileSync(path.join(distDir, rel), `${JSON.stringify(obj, null, 2)}\n`); outputs.push(rel); };
	write('yeti.html-data.json', htmlData(merged, vocabulary));
	write('yeti.web-types.json', webTypes(merged, vocabulary, pkg));
	return outputs;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const root = process.cwd();
	const schema = loadSchema(path.join(root, 'schema', 'manifest.schema.json'));
	const vocabulary = loadVocabulary(path.join(root, 'schema', 'vocabulary.json'));
	const { merged, errors } = loadAndMerge(path.join(root, 'src'), schema, vocabulary);
	if (errors.length) { for (const e of errors) console.error(`${e.file}: ${e.message}`); process.exit(1); }
	const outputs = writeIde({ root, merged, vocabulary, pkg: readPackage(root) });
	console.log(`gen-ide: wrote ${outputs.join(', ')}`);
}
