import fs from 'node:fs';
import path from 'node:path';
import { checkSchema } from './schema-check.js';

export const KIND_DIRS = { layouts: 'layout', recipes: 'recipe', components: 'component', utilities: 'utility' };
export const KIND_TO_DIR = { layout: 'layouts', recipe: 'recipes', component: 'components', utility: 'utilities' };

export function loadSchema(schemaPath) {
	return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

export function loadVocabulary(file) {
	const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
	delete raw.$comment;
	return raw;
}

/** Loads every manifest under srcDir/{layouts,components,utilities}/<name>/ and cross-checks it. */
export function loadManifests(srcDir, schema, vocabulary = {}) {
	const entries = [];
	const errors = [];

	for (const [dirName, kind] of Object.entries(KIND_DIRS)) {
		const kindDir = path.join(srcDir, dirName);
		if (!fs.existsSync(kindDir)) continue;
		const folders = fs.readdirSync(kindDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name)
			.sort();

		for (const folder of folders) {
			const dir = path.join(kindDir, folder);
			const file = path.join(dir, 'manifest.json');
			const missing = ['manifest.json', `${folder}.css`, 'example.html'].filter((f) => !fs.existsSync(path.join(dir, f)));
			if (missing.length) {
				errors.push({ file: dir, message: `missing ${missing.join(', ')}` });
				continue;
			}

			let manifest;
			try {
				manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
			} catch (e) {
				errors.push({ file, message: `invalid JSON: ${e.message}` });
				continue;
			}

			const schemaErrors = checkSchema(schema, manifest);
			for (const e of schemaErrors) errors.push({ file, message: `${e.path}: ${e.message}` });
			if (schemaErrors.length) continue;

			if (manifest.name !== folder) errors.push({ file, message: `name "${manifest.name}" must equal folder name "${folder}"` });
			if (manifest.kind !== kind) errors.push({ file, message: `kind "${manifest.kind}" must be "${kind}" inside ${dirName}/` });
			if (manifest.class !== manifest.name) errors.push({ file, message: `class "${manifest.class}" must equal name "${manifest.name}"` });

			// Markers are the attributes descendants carry; an absent list means none,
			// so every consumer sees one shape.
			manifest.markers ??= [];
			for (const attr of manifest.attributes) resolveValues(attr, 'attribute', vocabulary, file, errors);
			for (const marker of manifest.markers) resolveValues(marker, 'marker', vocabulary, file, errors);

			// A component may ship more than one module; field ships the range's
			// fill and the form validator, each loaded on its own.
			for (const mod of manifest.js ?? []) {
				if (!fs.existsSync(path.join(dir, mod.module))) {
					errors.push({ file, message: `js.module "${mod.module}" does not exist` });
				}
			}

			entries.push({ dir, file, kind, name: manifest.name, manifest });
		}
	}
	return { entries, errors };
}

/** Resolves a vocabulary reference into values and checks the enum/values pairing. */
function resolveValues(attr, what, vocabulary, file, errors) {
	if (attr.vocabulary !== undefined) {
		if (attr.values) {
			errors.push({ file, message: `${what} ${attr.name}: vocabulary and values are mutually exclusive` });
			return;
		}
		if (!(attr.vocabulary in vocabulary)) {
			errors.push({ file, message: `${what} ${attr.name}: unknown vocabulary "${attr.vocabulary}"` });
			return;
		}
		attr.values = [...vocabulary[attr.vocabulary]];
	}
	if (attr.type === 'enum' && !attr.values) {
		errors.push({ file, message: `${what} ${attr.name}: enum type requires values` });
	} else if (attr.type !== 'enum' && attr.values) {
		errors.push({ file, message: `${what} ${attr.name}: values is only allowed for enum type` });
	} else if (attr.type === 'enum' && attr.default !== undefined && !attr.values.includes(attr.default)) {
		errors.push({ file, message: `${what} ${attr.name}: default "${attr.default}" is not one of its values` });
	}
}

/** Merges entries into one object keyed by name, rejecting duplicate names and classes. */
export function mergeManifests(entries) {
	const merged = {};
	const errors = [];
	const byName = new Map();
	const byClass = new Map();

	for (const entry of entries) {
		const { name, class: cls } = entry.manifest;
		if (byName.has(name)) {
			errors.push({ file: entry.file, message: `duplicate name "${name}" (also declared in ${byName.get(name)})` });
			continue;
		}
		if (byClass.has(cls)) {
			errors.push({ file: entry.file, message: `duplicate class "${cls}" (also declared in ${byClass.get(cls)})` });
			continue;
		}
		byName.set(name, entry.file);
		byClass.set(cls, entry.file);
		merged[name] = entry.manifest;
	}
	return { merged, errors };
}

export function loadAndMerge(srcDir, schema, vocabulary = {}) {
	const loaded = loadManifests(srcDir, schema, vocabulary);
	const { merged, errors } = mergeManifests(loaded.entries);
	return { entries: loaded.entries, merged, errors: [...loaded.errors, ...errors] };
}
