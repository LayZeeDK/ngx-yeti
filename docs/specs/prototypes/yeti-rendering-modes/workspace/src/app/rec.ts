// PROTOTYPE: a page-wide record the Playwright script reads, outside Angular's
// change detection, so a handler that ran is visible even if the view did not update.
export function rec(key: string, delta = 1): void {
  if (typeof window === 'undefined') {
    return;
  }

  const w = window as unknown as { __t?: Record<string, number> };
  w.__t ??= {};
  w.__t[key] = (w.__t[key] ?? 0) + delta;
}

export function mark(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const w = window as unknown as { __m?: Record<string, number> };
  w.__m ??= {};
  w.__m[key] ??= Math.round(performance.now());
}
