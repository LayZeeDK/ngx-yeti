#!/usr/bin/env node
/**
 *   node tools/playwright-server/server.mjs        start, or resume the container
 *   node tools/playwright-server/server.mjs stop
 *
 * The Playwright server that the `remote-*` names of BROWSERS connect to,
 * in Playwright's Linux image. The container is replaced when its image,
 * address, network or forwarder differs from the current one: a Playwright
 * client connects only to a server of its own release.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwrightServerFile } from '../playwright/engines.mjs';

const require = createRequire(import.meta.url);
const { version } = require('playwright-core/package.json');
const playwrightCore = path.dirname(
  require.resolve('playwright-core/package.json'),
);
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const address = '127.0.0.1:3000';
const name = 'ngx-yeti-playwright-server';
// A network of its own: on Docker's default bridge, any other container
// could reach the SOCKS proxy that exposeNetwork opens inside the
// container, which listens on every interface with no authentication
// (upstream bug O15).
const network = name;
const label = 'dev.ngx-yeti.playwright-server';
const forwarder = fileURLToPath(new URL('container.mjs', import.meta.url));
const forwarderHash = createHash('sha256')
  .update(readFileSync(forwarder))
  .digest('hex')
  .slice(0, 12);
const setup = `${image} ${address} ${network} ${forwarderHash}`;
const endpointFile = fileURLToPath(playwrightServerFile);

/** @param {string[]} args */
function docker(args) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** @param {unknown} error */
function stderrOf(error) {
  return error instanceof Error &&
    'stderr' in error &&
    typeof error.stderr === 'string'
    ? error.stderr
    : '';
}

/** The container's state and labels, or null when there is none. */
function inspect() {
  try {
    const [state, setupLabel, token, attached] = docker([
      'container',
      'inspect',
      '--format',
      `{{.State.Status}}\t{{index .Config.Labels "${label}.setup"}}\t{{index .Config.Labels "${label}.token"}}\t{{with index .NetworkSettings.Networks "${network}"}}attached{{end}}`,
      name,
    ]).split('\t');

    return {
      state,
      setup: setupLabel,
      token,
      attached: attached === 'attached',
    };
  } catch (error) {
    if (/No such (container|object)/.test(stderrOf(error))) {
      return null;
    }

    throw error;
  }
}

/** Starts or resumes the server and returns its token. */
function start() {
  const existing = inspect();
  // A container still `created` may lack its files: a start was killed
  // between `docker create` and `docker cp`.
  const reuse =
    existing?.setup === setup &&
    existing.token !== '' &&
    existing.state !== 'created' &&
    existing.attached;
  const token = reuse ? existing.token : randomBytes(16).toString('hex');

  // A pruned network takes a stopped container's endpoint with it; create it
  // before a resume too, and accept a race with another start.
  try {
    docker(['network', 'create', network]);
  } catch (error) {
    if (!/already exists/.test(stderrOf(error))) {
      throw error;
    }
  }

  if (!reuse) {
    if (existing) {
      docker(['rm', '-f', name]);
    }

    try {
      docker(['image', 'inspect', image]);
    } catch {
      execFileSync('docker', ['pull', image], { stdio: 'inherit' });
    }

    docker([
      'create',
      '--name',
      name,
      '--label',
      `${label}.setup=${setup}`,
      '--label',
      `${label}.token=${token}`,
      '--init',
      '--ipc=host',
      '--network',
      network,
      '-p',
      `${address}:3000`,
      image,
      'node',
      '/container.mjs',
      token,
    ]);
  }

  try {
    if (!reuse) {
      docker(['cp', `${playwrightCore}/.`, `${name}:/playwright-core`]);
      docker(['cp', forwarder, `${name}:/container.mjs`]);
    }

    docker(['start', name]);
  } catch (error) {
    // After a start fails (a port conflict), Docker Desktop starts the
    // container without its published port from then on, restart included;
    // only a new container publishes it again.
    docker(['rm', '-f', name]);
    throw error;
  }

  return token;
}

/**
 * @param {string} text
 * @param {string} [token]
 */
function redact(text, token) {
  return token
    ? text.replaceAll(token, '<token>')
    : text.replaceAll(/(?<![0-9a-f])[0-9a-f]{32}(?![0-9a-f])/g, '<token>');
}

/** @param {string} token */
async function waitUntilReady(token) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const state = inspect()?.state;

    if (state !== 'running') {
      const { stdout = '', stderr = '' } = spawnSync('docker', ['logs', name], {
        encoding: 'utf8',
      });

      process.stderr.write(redact(stdout + stderr, token));
      docker(['rm', '-f', name]);
      throw new Error(`${name} is ${state ?? 'gone'}`);
    }

    try {
      // The pipe admits the token path only; any HTTP answer there means
      // run-server is up.
      await fetch(`http://${address}/${token}`, {
        signal: AbortSignal.timeout(2000),
      });

      return;
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${name} did not answer on ${address} in 120 s`);
}

/**
 * @param {unknown} error
 * @param {string} [token]
 */
function reason(error, token) {
  const lines = stderrOf(error)
    .split('\n')
    .filter((line) => line.trim());
  const message = error instanceof Error ? error.message : String(error);
  // Docker's last line names the failed command; the port line, when there
  // is one, says why.
  const text =
    lines.find((line) => /port is already allocated/.test(line)) ??
    lines.at(-1) ??
    message.split('\n')[0];

  return redact(text, token);
}

/** @type {string | undefined} */
let token;

try {
  const [command, ...rest] = process.argv.slice(2);

  if (rest.length > 0 || (command !== undefined && command !== 'stop')) {
    throw new Error('usage: server.mjs [stop]');
  }

  rmSync(endpointFile, { force: true });

  if (command === 'stop') {
    if (inspect()?.state === 'running') {
      docker(['stop', name]);
      console.log(`${name} stopped`);
    } else {
      console.log(`${name} is not running`);
    }
  } else {
    token = start();
    const endpoint = `ws://${address}/${token}`;

    await waitUntilReady(token);
    mkdirSync(path.dirname(endpointFile), { recursive: true });
    writeFileSync(endpointFile, endpoint + '\n');
    console.log(`${name}: Playwright ${version} at ${endpoint}`);
  }
} catch (error) {
  const dockerDown = /ENOENT|docker daemon|error during connect|pipe\/docker/i;
  const text = reason(error, token);

  console.error(
    dockerDown.test(text) ? 'Docker Desktop must be running' : text,
  );
  process.exit(1);
}
