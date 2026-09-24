/**
 * Poll a predicate until it becomes true, or fail with a descriptive error.
 *
 * This is an *assertion* helper, not an event waiter. Prefer the awaiters in
 * `events/await-event.ts` when the state change you're waiting for emits an
 * event — they resolve the instant the event fires, rather than waiting for
 * the next poll tick.
 *
 * Use `waitFor` when:
 *   - The state change has no event (e.g. a queue metric reaching a value).
 *   - You need to observe convergence of an eventually-consistent system.
 *   - You're waiting on derived state you can only read (getProperties(),
 *     countMessagesByStatus()) rather than observe.
 *
 * Polling semantics:
 *   - The predicate is called immediately, then every `intervalMs` until it
 *     returns true or `timeoutMs` elapses.
 *   - Sleeping is bounded by the remaining time: the final sleep before the
 *     deadline is short, so the last predicate call lands as close to the
 *     deadline as the event loop allows.
 *   - If the predicate throws, polling stops and the error is re-thrown with
 *     the last observed error attached. A thrown predicate is treated as a
 *     real failure, not as "not yet true."
 *
 * Timeout errors:
 *   `WaitForTimeoutError` includes the timeout duration, the poll interval,
 *   the number of attempts, and any user-provided description. On failure,
 *   include enough context in `description` to identify what was awaited —
 *   "queue reached 5 acknowledged" beats "predicate did not become true".
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IWaitForOptions {
  /** Milliseconds to wait before giving up. Defaults to 2000. */
  timeoutMs?: number;
  /** Milliseconds between predicate calls. Defaults to 20. */
  intervalMs?: number;
  /**
   * Human-readable description of what is being awaited. Included verbatim
   * in the timeout error message. Strongly recommended when the predicate
   * expression isn't self-explanatory at the call site.
   */
  description?: string;
}

/**
 * Thrown when `waitFor` gives up. Distinct class so callers can catch it
 * specifically — e.g. when asserting that a state transition *does not*
 * happen within a window:
 *
 *   await expect(
 *     waitFor(() => isPaused(queue), { timeoutMs: 500 }),
 *   ).rejects.toThrow(WaitForTimeoutError);
 */
export class WaitForTimeoutError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    readonly timeoutMs: number,
    readonly intervalMs: number,
  ) {
    super(message);
    this.name = 'WaitForTimeoutError';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_INTERVAL_MS = 20;

/**
 * Resolve when `predicate` returns true; reject with `WaitForTimeoutError`
 * when `timeoutMs` elapses first.
 *
 * The predicate may be synchronous or asynchronous. Both forms are accepted
 * with a single signature — `() => boolean | Promise<boolean>` — rather than
 * a union of two call signatures, which TypeScript resolves less reliably.
 */
export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  options: IWaitForOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const description = options.description;

  const deadline = Date.now() + timeoutMs;
  let attempts = 0;

  // Poll loop. Structure chosen so that:
  //   - The predicate is tried before the first sleep (fast-path success).
  //   - The deadline is checked *after* each predicate call, so a predicate
  //     that becomes true on the very last tick still resolves rather than
  //     timing out spuriously.
  //   - Sleeps never push past the deadline; the final sleep is clamped to
  //     the remaining budget.
  for (;;) {
    attempts += 1;
    if (await predicate()) return;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    await sleep(Math.min(intervalMs, remaining));
  }

  const subject = description ?? 'predicate';
  throw new WaitForTimeoutError(
    `waitFor: ${subject} did not become true within ${timeoutMs}ms ` +
      `(${attempts} attempt${attempts === 1 ? '' : 's'}, ` +
      `interval ${intervalMs}ms)`,
    attempts,
    timeoutMs,
    intervalMs,
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
