import { replayShapedEvent } from './replay-event';

describe(replayShapedEvent, () => {
  it('returns the same event in the replay phase', () => {
    const event = new Event('click', { bubbles: true, cancelable: true });

    expect(replayShapedEvent(event)).toBe(event);
    expect(event.eventPhase).toBe(101);
    expect(event.type).toBe('click');
  });

  it('throws from preventDefault after cancelling the event', () => {
    const event = replayShapedEvent(new Event('click', { cancelable: true }));

    expect(() => {
      event.preventDefault();
    }).toThrow('`preventDefault` called during event replay.');
    expect(event.defaultPrevented).toBe(true);
  });

  it('throws from composedPath', () => {
    const event = replayShapedEvent(new Event('click'));

    expect(() => event.composedPath()).toThrow(
      '`composedPath` called during event replay.',
    );
  });

  it('keeps a state change made before preventDefault', () => {
    const target = new EventTarget();
    const state = { open: false };
    const errors: unknown[] = [];

    target.addEventListener('click', (event) => {
      state.open = true;

      try {
        event.preventDefault();
      } catch (error: unknown) {
        errors.push(error);
      }
    });
    target.dispatchEvent(replayShapedEvent(new Event('click')));

    expect(state.open).toBe(true);
    expect(errors).toHaveLength(1);
  });
});
