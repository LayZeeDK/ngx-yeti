import {
  composite,
  contrastRatio,
  parseColor,
  relativeLuminance,
} from './contrast';

const grey118 = 118 / 255;

describe(contrastRatio, () => {
  it('rates black on white at exactly 21', () => {
    expect(contrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBe(21);
    expect(contrastRatio('#fff', '#000')).toBe(21);
  });

  it('rates #767676 on white unrounded', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.542225, 6);
  });

  it('composites a translucent foreground over the background', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0.6)', 'rgb(255, 255, 255)')).toBe(
      contrastRatio('rgb(102, 102, 102)', 'rgb(255, 255, 255)'),
    );
  });

  it('rates text over a scrim composited over pure black and pure white', () => {
    const scrim = 'rgba(0, 0, 0, 0.6)';

    expect(contrastRatio('#fff', composite(scrim, '#fff'))).toBeCloseTo(
      5.741836,
      6,
    );
    expect(contrastRatio('#fff', composite(scrim, '#000'))).toBe(21);
  });

  it('refuses a translucent background', () => {
    expect(() => contrastRatio('#000', 'rgba(255, 255, 255, 0.5)')).toThrow(
      'Relative luminance needs an opaque colour',
    );
  });
});

describe(relativeLuminance, () => {
  it('weights the linear channels by the WCAG coefficients', () => {
    expect(relativeLuminance('rgb(255, 0, 0)')).toBe(0.2126);
    expect(relativeLuminance('rgb(0, 255, 0)')).toBe(0.7152);
    expect(relativeLuminance('rgb(0, 0, 255)')).toBe(0.0722);
  });

  it('linearizes below and above the 0.04045 threshold', () => {
    expect(relativeLuminance('rgb(10, 10, 10)')).toBeCloseTo(
      10 / 255 / 12.92,
      12,
    );
    expect(relativeLuminance('#767676')).toBeCloseTo(0.181164244, 9);
  });
});

describe(parseColor, () => {
  it.each([
    'rgb(118, 118, 118)',
    'rgb(118 118 118)',
    'rgba(118, 118, 118, 1)',
    'rgb(118 118 118 / 100%)',
    `color(srgb ${String(grey118)} ${String(grey118)} ${String(grey118)})`,
    '#767676',
    '#767676ff',
  ])('parses %s', (css) => {
    expect(parseColor(css)).toStrictEqual({
      r: grey118,
      g: grey118,
      b: grey118,
      alpha: 1,
    });
  });

  it.each([
    ['rgba(0, 0, 0, 0.5)', 0.5],
    ['rgb(0 0 0 / 25%)', 0.25],
    ['oklch(0.5 0.1 200 / 0.25)', 0.25],
    ['oklab(0.5 0.01 -0.02 / 0.75)', 0.75],
    ['color(srgb 1 0 0 / 0.4)', 0.4],
    ['#0008', 0x88 / 255],
  ])('reads the alpha of %s', (css, alpha) => {
    expect(parseColor(css).alpha).toBeCloseTo(alpha, 12);
  });

  it.each([
    // OKLab of sRGB red, green, and blue as Björn Ottosson published them.
    ['oklab(0.627955 0.224863 0.125846)', [1, 0, 0]],
    ['oklab(0.866440 -0.233888 0.179498)', [0, 1, 0]],
    ['oklab(0.452014 -0.032457 -0.311528)', [0, 0, 1]],
    // sRGB red as CSS Color 4 gives it in OKLCH.
    ['oklch(62.8% 0.2577 29.23)', [1, 0, 0]],
    ['oklch(1 0 none)', [1, 1, 1]],
    ['oklch(0 0 0deg)', [0, 0, 0]],
  ])('converts %s to sRGB', (css, [r, g, b]) => {
    const color = parseColor(css);

    expect(color.r).toBeCloseTo(r ?? Number.NaN, 3);
    expect(color.g).toBeCloseTo(g ?? Number.NaN, 3);
    expect(color.b).toBeCloseTo(b ?? Number.NaN, 3);
  });

  it('rates an oklch() pair like its sRGB equivalent', () => {
    expect(
      contrastRatio('oklch(62.8% 0.2577 29.23)', 'oklch(1 0 0)'),
    ).toBeCloseTo(contrastRatio('#f00', '#fff'), 3);
  });

  it('converts color(srgb-linear) through the sRGB transfer function', () => {
    expect(parseColor('color(srgb-linear 0.5 0 1)').r).toBeCloseTo(0.735357, 6);
  });

  it('clips a colour outside the sRGB gamut per channel', () => {
    const { r, g, b } = parseColor('oklch(0.9 0.4 150)');

    expect(r).toBe(0);
    expect(g).toBeCloseTo(1, 12);
    expect(b).toBe(0);
  });

  it.each([
    'hsl(0 0% 0%)',
    'color(display-p3 1 0 0)',
    'rgb(1 2)',
    'red',
    '#12',
  ])('rejects %s', (css) => {
    expect(() => parseColor(css)).toThrow(/Unsupported colour|Expected/);
  });
});

describe(composite, () => {
  it('composites with source-over in sRGB', () => {
    expect(composite('rgba(0, 0, 0, 0.5)', '#fff')).toStrictEqual({
      r: 0.5,
      g: 0.5,
      b: 0.5,
      alpha: 1,
    });
  });

  it('keeps a fully transparent result transparent', () => {
    expect(composite('rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)').alpha).toBe(0);
  });
});
