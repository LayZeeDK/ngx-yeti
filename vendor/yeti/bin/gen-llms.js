#!/usr/bin/env node
// The API as plain text for a language model. Two files: llms.txt lists
// every component with its attributes, values and defaults; llms-full.txt
// adds each docs fragment, accessibility notes, children and the token
// catalogue. Every string comes from the manifest or a docs fragment, so
// the file cannot say something the validator does not enforce.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, loadAndMerge, loadVocabulary } from './lib/manifest.js';
import { readPackage } from './build.js';

const KIND_ORDER = { layout: 0, recipe: 1, component: 2, utility: 3 };
const ordered = (merged) => Object.values(merged).sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || a.name.localeCompare(b.name));

function attributeLine(a) {
	if (a.type === 'enum') {
		const values = a.values.map((v) => (v === a.default ? `${v} (default)` : v)).join(' | ');
		return `- ${a.name}: ${values} — ${a.description}`;
	}
	return `- ${a.name} (${a.type}) — ${a.description}`;
}

function markerLine(m) {
	const on = m.on ?? '> *';
	if (m.type === 'enum') return `- ${m.name} on ${on}: ${m.values.join(' | ')} — ${m.description}`;
	return `- ${m.name} on ${on} (${m.type}) — ${m.description}`;
}

function preamble(pkg) {
	return [
		`# Yeti ${pkg.version}`,
		'',
		`Yeti is a plain-CSS framework. Three rules cover every component: identity is a class (\`class="card"\`), configuration is a \`data-*\` attribute with a fixed value list (\`data-gap="md"\`), and state is native or ARIA (\`open\`, \`aria-current\`), never a class. Layouts arrange, recipes compose layouts, components are styled things. Every attribute below is validated: a value not in its list is an error. Docs: ${pkg.homepage}`,
		'',
		'To begin a page, start from dist/starter/index.html, a complete and valid page (skip link, sticky nav, hero, card grid, prose, footer), and dist/starter/theme.css, the essential theme settings with their defaults, commented out. Copy both and delete what the page does not need.',
		'',
	];
}

function block(c) {
	const lines = [`## ${c.name} (${c.kind}, class="${c.class}")`, '', c.description];
	if (c.attributes.length) { lines.push('', 'Attributes:'); for (const a of c.attributes) lines.push(attributeLine(a)); }
	if (c.markers?.length) { lines.push('', 'On children:'); for (const m of c.markers) lines.push(markerLine(m)); }
	for (const mod of c.js ?? []) {
		lines.push('', `module: ${mod.module}${mod.optional ? ' (optional)' : ''}`);
		for (const e of mod.events ?? []) lines.push(`- event ${e.name}${e.detail ? ` with detail ${e.detail}` : ''} — ${e.description}`);
	}
	return lines;
}

export function renderCompact(merged, pkg) {
	const lines = preamble(pkg);
	for (const c of ordered(merged)) lines.push(...block(c), '');
	return `${lines.join('\n').trimEnd()}\n`;
}

export function renderFull(merged, tokens, docsByName, pkg) {
	const lines = preamble(pkg);
	for (const c of ordered(merged)) {
		lines.push(...block(c));
		const docs = (docsByName[c.name] ?? '').trim();
		if (docs) lines.push('', docs.replace(/^## /gm, '### '));
		if (c.children.length) { lines.push('', 'Children:'); for (const ch of c.children) lines.push(`- ${ch.selector}: at least ${ch.min}${ch.max === null ? '' : `, at most ${ch.max}`}. ${ch.description}`); }
		if (c.tokens.some((t) => t.public)) { lines.push('', 'Tokens:'); for (const t of c.tokens.filter((t) => t.public)) lines.push(`- ${t.name} — ${t.description}`); }
		const a = c.a11y;
		if (a.requiredAttributes.length || a.keyboard.length || a.notes) {
			// "contract", because a fragment may carry its own ### Accessibility prose
			// just above this: that is the reasoning, this is what the validator enforces.
			lines.push('', 'Accessibility contract:');
			if (a.requiredAttributes.length) lines.push(`Required: ${a.requiredAttributes.join(', ')}`);
			for (const k of a.keyboard) lines.push(`- ${k.key}: ${k.action}`);
			if (a.notes) lines.push(a.notes);
		}
		lines.push('');
	}
	lines.push('## Tokens', '', 'Every public custom property, with its group and default. A theme is a file that sets some of these after yeti.css.', '');
	for (const t of tokens) lines.push(`- ${t.name} (${t.group}): ${t.default} — ${t.description}`);
	return `${lines.join('\n').trimEnd()}\n`;
}

export function writeLlms({ root, merged, entries, pkg }) {
	const distDir = path.join(root, 'dist');
	const docsDir = path.join(root, 'docs');
	fs.mkdirSync(distDir, { recursive: true });
	fs.mkdirSync(docsDir, { recursive: true });
	const docsByName = {};
	for (const e of entries) {
		const f = path.join(e.dir, 'docs.md');
		docsByName[e.name] = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
	}
	const catalogueFile = path.join(root, 'src', 'tokens', 'tokens.json');
	const tokens = fs.existsSync(catalogueFile) ? JSON.parse(fs.readFileSync(catalogueFile, 'utf8')) : [];
	const files = { 'llms.txt': renderCompact(merged, pkg), 'llms-full.txt': renderFull(merged, tokens, docsByName, pkg) };
	for (const [name, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(distDir, name), content);
		fs.writeFileSync(path.join(docsDir, name), content);
	}
	return Object.keys(files);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const root = process.cwd();
	const schema = loadSchema(path.join(root, 'schema', 'manifest.schema.json'));
	const vocabulary = loadVocabulary(path.join(root, 'schema', 'vocabulary.json'));
	const { merged, entries, errors } = loadAndMerge(path.join(root, 'src'), schema, vocabulary);
	if (errors.length) { for (const e of errors) console.error(`${e.file}: ${e.message}`); process.exit(1); }
	console.log(`gen-llms: wrote ${writeLlms({ root, merged, entries, pkg: readPackage(root) }).join(', ')}`);
}
