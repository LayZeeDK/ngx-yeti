// The part of the Storybook preview global that control.mjs reads inside
// page.evaluate callbacks.
declare var __STORYBOOK_PREVIEW__:
  { currentRender?: { phase?: string } } | undefined;
