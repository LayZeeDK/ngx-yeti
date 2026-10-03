/** A colour in gamma-encoded sRGB. Every channel and `alpha` is in [0, 1]. */
export interface SrgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}

// CSS Color 4: 100% of an OKLCH chroma or an OKLab a or b axis is 0.4.
const oklabPercentScale = 0.4;

/**
 * Parses a colour as Chromium, Firefox, and WebKit serialize computed styles:
 * `rgb()` and `rgba()` (comma or space syntax), `oklch()`, `oklab()`, and
 * `color(srgb ...)` or `color(srgb-linear ...)`, each with an optional alpha,
 * plus `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa`.
 *
 * OKLCH and OKLab convert to sRGB through the matrices Björn Ottosson
 * published with OKLab. A colour outside the sRGB gamut is clipped per
 * channel, so its ratio is the ratio of the clipped colour, not of the colour
 * a browser that applies CSS Color 4 gamut mapping paints.
 */
export function parseColor(value: string): SrgbColor {
  const css = value.trim().toLowerCase();

  if (css.startsWith('#')) {
    return parseHex(css, value);
  }

  const [, name, channelPart, alphaPart] =
    /^([a-z]+)\(([^()/]*)(?:\/([^()/]*))?\)$/.exec(css) ?? [];

  if (name === undefined || channelPart === undefined) {
    throw new Error(`Unsupported colour: ${value}`);
  }

  const tokens = channelPart.split(/[\s,]+/).filter((token) => token !== '');
  const isRgb = name === 'rgb' || name === 'rgba';
  // Legacy `rgba(r, g, b, a)` carries the alpha as a fourth channel.
  const hasLegacyAlpha =
    isRgb && alphaPart === undefined && tokens.length === 4;
  const channelTokens = hasLegacyAlpha ? tokens.slice(0, 3) : tokens;
  const alphaToken = hasLegacyAlpha ? tokens.at(-1) : alphaPart?.trim();
  const alpha = alphaToken === undefined ? 1 : parsePercentable(alphaToken, 1);

  if (isRgb) {
    const [r, g, b] = threeChannels(channelTokens, value);

    return srgb(
      parsePercentable(r, 255) / 255,
      parsePercentable(g, 255) / 255,
      parsePercentable(b, 255) / 255,
      alpha,
    );
  }

  if (name === 'oklab') {
    const [l, a, b] = threeChannels(channelTokens, value);

    return fromOklab(
      parsePercentable(l, 1),
      parsePercentable(a, oklabPercentScale),
      parsePercentable(b, oklabPercentScale),
      alpha,
    );
  }

  if (name === 'oklch') {
    const [l, c, h] = threeChannels(channelTokens, value);
    const chroma = parsePercentable(c, oklabPercentScale);
    const hue = (parseHue(h) * Math.PI) / 180;

    return fromOklab(
      parsePercentable(l, 1),
      chroma * Math.cos(hue),
      chroma * Math.sin(hue),
      alpha,
    );
  }

  if (name === 'color') {
    const [space, ...rest] = channelTokens;
    const [r, g, b] = threeChannels(rest, value);

    if (space !== 'srgb' && space !== 'srgb-linear') {
      throw new Error(`Unsupported colour space: ${value}`);
    }

    const transfer =
      space === 'srgb-linear'
        ? encodeChannel
        : (channel: number): number => channel;
    const red = transfer(parsePercentable(r, 1));
    const green = transfer(parsePercentable(g, 1));
    const blue = transfer(parsePercentable(b, 1));

    return srgb(red, green, blue, alpha);
  }

  throw new Error(`Unsupported colour: ${value}`);
}

/** Composites `top` over `backdrop` with source-over in sRGB, as browsers paint. */
export function composite(
  top: SrgbColor | string,
  backdrop: SrgbColor | string,
): SrgbColor {
  const source = toColor(top);
  const destination = toColor(backdrop);
  const alpha = source.alpha + destination.alpha * (1 - source.alpha);

  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }

  const mix = (sourceChannel: number, destinationChannel: number): number =>
    (sourceChannel * source.alpha +
      destinationChannel * destination.alpha * (1 - source.alpha)) /
    alpha;

  return {
    r: mix(source.r, destination.r),
    g: mix(source.g, destination.g),
    b: mix(source.b, destination.b),
    alpha,
  };
}

/** WCAG 2.x relative luminance of an opaque colour. */
export function relativeLuminance(color: SrgbColor | string): number {
  const { r, g, b, alpha } = toColor(color);

  if (alpha < 1) {
    throw new Error(
      'Relative luminance needs an opaque colour; composite it over its backdrop first',
    );
  }

  return (
    0.2126 * decodeChannel(r) +
    0.7152 * decodeChannel(g) +
    0.0722 * decodeChannel(b)
  );
}

/**
 * WCAG 2.x contrast ratio, unrounded. A translucent foreground is composited
 * over the background first; the background must be opaque.
 */
export function contrastRatio(
  foreground: SrgbColor | string,
  background: SrgbColor | string,
): number {
  const backdrop = toColor(background);
  const first = relativeLuminance(composite(foreground, backdrop));
  const second = relativeLuminance(backdrop);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function toColor(color: SrgbColor | string): SrgbColor {
  return typeof color === 'string' ? parseColor(color) : color;
}

function threeChannels(
  tokens: readonly string[],
  value: string,
): readonly [string, string, string] {
  const [first, second, third, ...extra] = tokens;

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    extra.length > 0
  ) {
    throw new Error(`Expected 3 channels in ${value}`);
  }

  return [first, second, third];
}

function parseNumber(token: string): number {
  if (token === 'none') {
    return 0;
  }

  const number = Number(token);

  if (token === '' || !Number.isFinite(number)) {
    throw new Error(`Unsupported colour channel: ${token}`);
  }

  return number;
}

function parsePercentable(token: string, scale: number): number {
  return token.endsWith('%')
    ? (parseNumber(token.slice(0, -1)) / 100) * scale
    : parseNumber(token);
}

function parseHue(token: string): number {
  return token.endsWith('deg')
    ? parseNumber(token.slice(0, -3))
    : parseNumber(token);
}

function parseHex(css: string, value: string): SrgbColor {
  const digits = css.slice(1);

  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.test(digits)) {
    throw new Error(`Unsupported colour: ${value}`);
  }

  const full = digits.length <= 4 ? digits.replace(/./g, '$&$&') : digits;
  const channel = (index: number): number =>
    Number.parseInt(full.slice(index * 2, index * 2 + 2), 16) / 255;

  return srgb(
    channel(0),
    channel(1),
    channel(2),
    full.length === 8 ? channel(3) : 1,
  );
}

function fromOklab(
  lightness: number,
  a: number,
  b: number,
  alpha: number,
): SrgbColor {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return srgb(
    encodeChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encodeChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encodeChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha,
  );
}

function srgb(r: number, g: number, b: number, alpha: number): SrgbColor {
  return { r: clip(r), g: clip(g), b: clip(b), alpha: clip(alpha) };
}

function clip(channel: number): number {
  return Math.min(1, Math.max(0, channel));
}

function encodeChannel(linear: number): number {
  const channel = clip(linear);

  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function decodeChannel(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}
