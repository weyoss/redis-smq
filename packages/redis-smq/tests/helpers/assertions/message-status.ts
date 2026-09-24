/**
 * Message-status assertions.
 *
 * Messages move through a well-defined lifecycle
 * (`EMessagePropertyStatus`) as RedisSMQ processes them: published →
 * pending → processing → acknowledged / unacknowledged → requeued / delayed
 * → dead-lettered, and so on. Most tests in `message-lifecycle/` and the
 * `workers/` folder spend their middle section waiting for a specific
 * transition to happen, then asserting it happened.
 *
 * Two helpers cover that:
 *
 *   - `waitForMessageStatus(id, expected)` — poll until the message reaches
 *     the expected status, then assert. Use this whenever the transition is
 *     asynchronous (which is almost always — it happens in a worker or a
 *     scheduled tick, not synchronously after the call that triggers it).
 *
 *   - `expectMessageStatus(id, expected)` — read the status once and assert.
 *     Use this when you have already established the transition via an event
 *     awaiter, or when the status should be stable at that point in the
 *     test.
 *
 * Both assert via Vitest's `expect`, so failures integrate with the
 * reporter the same way as any other assertion. Both include the actual
 * observed status in the failure message — critical for debugging, because
 * "expected UNACK_DELAYING, got UNACK_REQUEUING" tells you exactly where in
 * the pipeline the message is stuck, whereas "expected false to be true"
 * tells you nothing.
 */

import { expect } from 'vitest';
import { EMessagePropertyStatus, RedisSMQ } from '../../../src/index.js';
import { waitFor } from './wait-for.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IWaitForMessageStatusOptions {
  /** Milliseconds to wait before giving up. Defaults to 5000. */
  timeoutMs?: number;
  /** Milliseconds between polls. Defaults to 50 (see design notes). */
  intervalMs?: number;
  /** Extra context included in failure messages. */
  description?: string;
}

export interface IExpectMessageStatusOptions {
  /** Extra context included in failure messages. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Poll until the message reaches `expected`, then assert it did.
 *
 * The default timeout is 5000ms — long enough to absorb a worker tick
 * interval (typically ~5s in RedisSMQ) plus scheduling jitter, short
 * enough that a stuck message fails within a test-friendly window.
 * Tests that wait on a slower path (a scheduled delay, a heartbeat timeout
 * for crash recovery) should pass an explicit `timeoutMs`.
 *
 * The default poll interval is 50ms — noticeably slower than
 * `waitFor`'s 20ms because each poll is a Redis round-trip to fetch the
 * status. At 20ms you'd generate ~250 round-trips across a 5s wait for no
 * benefit; at 50ms the round-trip count halves and the resolution latency
 * (worst case, 50ms after the transition) is still well under any
 * meaningful timing assertion.
 *
 * Resolution note: on success, the last observed status is *also* read
 * once more and asserted. This is deliberate — `waitFor` returns as soon as
 * the predicate is true, but between the predicate and the final assertion
 * the message could transition again (e.g. a very fast pending →
 * processing → acknowledged chain). Reading once more and asserting the
 * status *matches* gives a clean, definitive failure if the state moved on.
 * If a state is transient by design, use `expectMessageStatus` at the exact
 * moment instead of this helper.
 */
export async function waitForMessageStatus(
  messageId: string,
  expected: EMessagePropertyStatus,
  options: IWaitForMessageStatusOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const intervalMs = options.intervalMs ?? 50;
  const description =
    options.description ??
    `message ${messageId} reaches ${EMessagePropertyStatus[expected]}`;

  const manager = RedisSMQ.createMessageManager();

  await waitFor(
    async () => {
      const status = await manager.getMessageStatus(messageId);
      return status === expected;
    },
    { timeoutMs, intervalMs, description },
  );

  // Read once more for a clean assertion on the settled state, and to
  // produce a useful diff if the status has moved on since the predicate
  // returned true.
  const finalStatus = await manager.getMessageStatus(messageId);
  expect(
    finalStatus,
    `${description}: status transitioned past ${EMessagePropertyStatus[expected]} ` +
      `before it could be asserted`,
  ).toBe(expected);
}

/**
 * Read the message's current status once and assert it matches `expected`.
 *
 * Use after an event awaiter has confirmed the transition, or when the
 * status is expected to be stable at the point of assertion. Do NOT use
 * this to assert on a transition that might still be in flight — use
 * `waitForMessageStatus` for that; otherwise the assertion races the
 * worker and flakes intermittently.
 *
 * On failure, the message includes:
 *   - the expected status name (via the `EMessagePropertyStatus` enum)
 *   - the actual status name
 *   - the message ID
 * which together identify what was expected, what was observed, and which
 * message was involved.
 */
export async function expectMessageStatus(
  messageId: string,
  expected: EMessagePropertyStatus,
  options: IExpectMessageStatusOptions = {},
): Promise<void> {
  const manager = RedisSMQ.createMessageManager();
  const actual = await manager.getMessageStatus(messageId);
  const description = options.description ?? `message ${messageId}`;

  expect(
    actual,
    `${description}: expected status ${EMessagePropertyStatus[expected]}, ` +
      `got ${EMessagePropertyStatus[actual]}`,
  ).toBe(expected);
}
