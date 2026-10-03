// Angular's event_dispatch marks a replayed event with this phase.
const replayPhase = 101;

/**
 * Patches `event` the way Angular's event replay does: `eventPhase` is the
 * replay phase, `composedPath()` throws, and `preventDefault()` throws after
 * it runs. Dispatch the result to test that a handler changes state before
 * any `preventDefault()`.
 */
export function replayShapedEvent<T extends Event>(event: T): T {
  const preventDefault = event.preventDefault.bind(event);

  Object.defineProperties(event, {
    eventPhase: { value: replayPhase },
    preventDefault: {
      value: (): never => {
        preventDefault();

        throw new Error('`preventDefault` called during event replay.');
      },
    },
    composedPath: {
      value: (): never => {
        throw new Error('`composedPath` called during event replay.');
      },
    },
  });

  return event;
}
