const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

const tailwindStylesheet = /[\\/]styles-tailwind-c[12]\.css$/;

/**
 * Runs Tailwind on the two Tailwind global stylesheets only. Angular's
 * builder sends every stylesheet of every build configuration through the
 * plugins of .postcssrc.json, and `@tailwindcss/postcss` rewrites any sheet
 * that has an `@import`, so naming it there would change the stylesheet of
 * the development and production builds.
 *
 * @param {Parameters<typeof tailwind>[0]} options
 * @returns {import('postcss').Plugin}
 */
function tailwindForms(options) {
  const processor = postcss([tailwind(options)]);

  return {
    postcssPlugin: 'tailwind-forms',
    async Once(root, { result }) {
      const file = root.source?.input.file;

      if (!file || !tailwindStylesheet.test(file)) {
        return;
      }

      // Tailwind rewrites the root it is given in place.
      const { messages } = await processor.process(root, {
        from: file,
        to: result.opts.to,
        map: false,
      });

      // The files Tailwind read, which the builder watches.
      result.messages.push(...messages);
    },
  };
}

tailwindForms.postcss = true;

module.exports = tailwindForms;
