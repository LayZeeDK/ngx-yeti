/** Yeti's widths, from `2xs` to `2xl`. */
export const widths = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/** `none` followed by Yeti's widths. */
export const widthsOrNone = ['none', ...widths] as const;

/** Yeti's gaps: `none`, each step from `xs` to `3xl`, and each range. */
export const gaps = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'xs-sm',
  'xs-md',
  'xs-lg',
  'xs-xl',
  'xs-2xl',
  'xs-3xl',
  'sm-md',
  'sm-lg',
  'sm-xl',
  'sm-2xl',
  'sm-3xl',
  'md-lg',
  'md-xl',
  'md-2xl',
  'md-3xl',
  'lg-xl',
  'lg-2xl',
  'lg-3xl',
  'xl-2xl',
  'xl-3xl',
  '2xl-3xl',
] as const;
