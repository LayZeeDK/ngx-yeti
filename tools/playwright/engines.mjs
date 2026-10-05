/** @typedef {'chromium' | 'firefox' | 'webkit'} Engine */
/** @typedef {{ channel?: string, executablePath?: string }} LaunchOptions */
/** @typedef {{ name: string, engine: Engine, launchOptions?: LaunchOptions }} Browser */

/** @type {Map<string, Omit<Browser, 'name'>>} */
const known = new Map([
  ['chromium', { engine: 'chromium' }],
  ['firefox', { engine: 'firefox' }],
  ['webkit', { engine: 'webkit' }],
]);

/**
 * The browsers of every browser test run that no floor variable (FLOOR_*,
 * SAFARI) claims: the configs check those first. BROWSERS, a comma-separated
 * list such as `webkit` or `chromium,firefox`, wins over CI; with CI set, the
 * three current engines run; locally, Chromium runs. Names run in list order,
 * each once.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {Browser[]}
 */
export function engines(env = process.env) {
  const list =
    env['BROWSERS'] || (env['CI'] ? 'chromium,firefox,webkit' : 'chromium');
  const names = [...new Set(list.split(',').map((name) => name.trim()))];

  return names.map((name) => {
    const browser = known.get(name);

    if (!browser) {
      throw new Error(
        `BROWSERS=${list}: "${name}" is not one of ${[...known.keys()].join(', ')}`,
      );
    }

    return { name, ...browser };
  });
}
