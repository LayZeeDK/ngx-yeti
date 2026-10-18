// @ts-check

/**
 * @param {unknown} value
 * @returns {value is { filename: string }}
 */
function isPackResult(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'filename' in value &&
    typeof value.filename === 'string'
  );
}

/**
 * npm 11 prints an array of results; npm 12 prints an object keyed by package
 * name.
 *
 * @param {string} stdout `npm pack --json` output
 * @returns {string[]}
 */
export function packedTarballNames(stdout) {
  /** @type {unknown} */
  let parsed;

  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`npm pack --json printed no JSON: ${stdout}`, {
      cause: error,
    });
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(
      `npm pack --json printed neither an array nor an object: ${stdout}`,
    );
  }

  /** @type {unknown[]} */
  const results = Array.isArray(parsed) ? parsed : Object.values(parsed);

  return results.map((result) => {
    if (!isPackResult(result)) {
      throw new Error(
        `npm pack --json printed a result without a filename: ${stdout}`,
      );
    }

    return result.filename;
  });
}
