#!/usr/bin/env node
// Photographs a built site: start a disposable PHP server over it, then walk
// a set of paths at a set of widths and save one full-page screenshot each.
//
// It takes a directory rather than a dev command, for the same reason
// validate-html.js does: the thing being photographed is somebody else's
// build (foundationcss.com's dist/), and it cannot depend on this package to
// get it, because the site's deploy runs npm install on a server where this
// repo does not exist. foundation.test is the reader's URL and does not
// resolve from tooling, so this serves the folder over localhost instead.
// The same tool photographs the before and the after: it only cares about a
// folder of built HTML, not which framework built it.
//
// Usage: node bin/shots.js <dir> <outdir> [--paths a,b,c] [--widths 400,800,1400]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PORT = 8123;
// Tall enough that a normal page's first screenful is a fair sample before
// the full-page capture grows past it; short pages just show whitespace.
const VIEWPORT_HEIGHT = 900;
const DEFAULT_PATHS = ['/', '/yeti/', '/yeti/card/', '/yeti/grid/', '/inky/getting-started/', '/inky/playground/', '/proton/'];
const DEFAULT_WIDTHS = [400, 800, 1400];

/** A file-name-safe stem for a URL path: slashes become dashes, and the root gets a real name. */
export function slugify(urlPath) {
	const trimmed = urlPath.replace(/^\/+|\/+$/g, '');
	return trimmed === '' ? 'home' : trimmed.replace(/\//g, '-');
}

// Started detached from stdout: a boot message would need parsing per PHP
// version, and polling the socket it is about to own answers the only
// question that matters, which is whether it is ready yet.
async function startServer(dir) {
	const server = spawn('php', ['-S', `localhost:${PORT}`, '-t', dir], { stdio: 'ignore' });
	const deadline = Date.now() + 10_000;
	while (Date.now() < deadline) {
		try {
			await fetch(`http://localhost:${PORT}/`);
			return server;
		} catch {
			await new Promise((resolve) => { setTimeout(resolve, 100); });
		}
	}
	server.kill();
	throw new Error(`php dev server on port ${PORT} did not answer within 10s`);
}

export async function takeShots(dir, outdir, paths, widths) {
	fs.mkdirSync(outdir, { recursive: true });
	const server = await startServer(dir);
	// The server is disposable from here down, so every exit from this point,
	// success or thrown, must still stop it; a leaked php process would go on
	// holding the port for the next run.
	try {
		const browser = await chromium.launch();
		try {
			const page = await browser.newPage();
			let count = 0;
			for (const urlPath of paths) {
				for (const width of widths) {
					await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
					const response = await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: 'networkidle' });
					const status = response ? response.status() : 'no response';
					if (status !== 200) {
						console.log(`shots: ${urlPath} @${width} -> ${status}, skipped`);
						continue;
					}
					const file = path.join(outdir, `${slugify(urlPath)}-${width}.png`);
					await page.screenshot({ path: file, fullPage: true });
					console.log(`shots: ${urlPath} @${width} -> ${file}`);
					count += 1;
				}
			}
			console.log(`shots: ${count} screenshot${count === 1 ? '' : 's'} written`);
			return count;
		} finally {
			await browser.close();
		}
	} finally {
		server.kill();
	}
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const args = process.argv.slice(2);
	// Each list flag consumes itself and the value that follows it; whatever
	// is left, in order, is the positional dir and outdir.
	const consumed = new Set();
	const readList = (name, fallback, cast = (s) => s) => {
		const i = args.indexOf(name);
		if (i === -1) return fallback;
		consumed.add(i);
		consumed.add(i + 1);
		return args[i + 1].split(',').map(cast);
	};
	const paths = readList('--paths', DEFAULT_PATHS);
	const widths = readList('--widths', DEFAULT_WIDTHS, Number);
	const [dir, outdir] = args.filter((_, i) => !consumed.has(i));
	if (!dir || !outdir) {
		console.error('usage: node bin/shots.js <dir> <outdir> [--paths a,b,c] [--widths 400,800,1400]');
		process.exit(2);
	}
	takeShots(dir, outdir, paths, widths).catch((err) => {
		console.error(`shots: ${err.message}`);
		process.exit(1);
	});
}
