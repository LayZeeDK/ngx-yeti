#!/usr/bin/env node
// Checks a folder of built HTML against the manifest: every element carrying a
// framework class is validated the way an example or a guide snippet is, so a
// site using Yeti finds an attribute typo before a reader does.
//
// It takes a directory rather than reading src/, because the thing being
// checked is somebody else's output. foundationcss.com uses it that way, and
// it cannot depend on this package to get it: the site's deploy runs
// npm install on a server where this repo does not exist.
//
// Usage: node bin/validate-html.js <dir> [--manifest <path>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkFiles } from './lib/files.js';
import { parseHtml, walkElements, classList } from './lib/html.js';
import { validateHtmlString, formatError } from './validate.js';

/** Every element whose class names a component, which is what was checked. */
export function countYetiElements(html, merged) {
	const classes = new Set(Object.values(merged).map((m) => m.class));
	let count = 0;
	walkElements(parseHtml(html), (el) => { if (classList(el).some((c) => classes.has(c))) count += 1; });
	return count;
}

export function validateHtmlDir(dir, merged) {
	const errors = [];
	let files = 0;
	let elements = 0;
	for (const file of walkFiles(dir).filter((f) => f.endsWith('.html'))) {
		const html = fs.readFileSync(file, 'utf8');
		files += 1;
		elements += countYetiElements(html, merged);
		errors.push(...validateHtmlString(html, merged, file));
	}
	return { files, elements, errors };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const args = process.argv.slice(2);
	const flag = args.indexOf('--manifest');
	const manifestPath = flag === -1
		? path.join(process.cwd(), 'dist', 'yeti.manifest.json')
		: args[flag + 1];
	// Everything that is not the flag or its value; the first survivor is the directory.
	const dir = args.filter((_, i) => flag === -1 || (i !== flag && i !== flag + 1))[0];
	if (!dir) {
		console.error('usage: node bin/validate-html.js <dir> [--manifest <path>]');
		process.exit(2);
	}
	if (!fs.existsSync(manifestPath)) {
		console.error(`validate-html: no manifest at ${manifestPath}; build first, or pass --manifest`);
		process.exit(2);
	}
	const merged = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).components;
	const { files, elements, errors } = validateHtmlDir(dir, merged);
	for (const error of errors) console.error(formatError(dir, error));
	if (errors.length) {
		console.error(`validate-html: ${errors.length} problem${errors.length === 1 ? '' : 's'} in ${files} files`);
		process.exit(1);
	}
	console.log(`validate-html: ok (${files} files, ${elements} Yeti elements)`);
}
