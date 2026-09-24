/**
 * Consume a single message from a queue.
 *
 * Creates a temporary consumer, waits for the next message on `queue` (up to
 * `timeoutMs`), acks it, shuts the consumer down, and returns the message.
 * Returns `null` if no message arrives within the timeout.
 *
 * Use for fire-and-check scenarios:
 *
 *   - Verifying that an exchange routed a message to a queue.
 *   - Confirming a scheduled message became pending.
 *   - Asserting that a crashed consumer's message was recovered and requeued.
 *
 * Not for:
 *   - Multi-message consumption. This helper stops at the first message.
 *   - Asserting a message does NOT arrive. The timeout returns `null` either
 *     way, so a bug that delivers a message slightly late still looks like
 *     success. For negative assertions, produce the message and read the
 *     queue's status directly (`assertions/message-status.ts`).
 *   - Timing-sensitive checks. The timeout is a "no message by now" bound,
 *     not a promise that the message arrived *at* any particular moment.
 *
 * Ack semantics:
 *   The handler invokes `cb()` to acknowledge the message before resolving.
 *   Whether that ack has durably flushed by the time `consumer.shutdown()`
 *   returns depends on batching — the default consumer options enable
 *   batching with `batchTimeoutMs: 1000`. If shutdown does not flush pending
 *   batches, a subsequent `consumeOnce` on the same queue could see the same
 *   message again. This matches the original helper's behavior; tests that
 *   need a strong ack guarantee should use `produceAndAcknowledgeMessage`
 *   from `scenarios/produce-consume.ts`.
 *
 * Consumer lifecycle:
 *   The consumer is created via `createBareConsumer` so it is registered in
 *   the factory registry. `consumeOnce` shuts it down at the end of the call
 *   — the registry entry is a safety net for the case where shutdown fails
 *   or the test crashes mid-await; the registry drain in `per-test.ts` will
 *   call `shutdown()` again (idempotent) and guarantee cleanup.
 */

import type { ICallback } from 'redis-smq-common';
import {
  type IMessageTransferable,
  type IQueueParams,
} from '../../../src/index.js';
import { createBareConsumer } from '../factories/consumer.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface IConsumeOnceOptions {
  /**
   * Milliseconds to wait for a message. Defaults to 2000.
   *
   * The timer starts once the consumer is running, not when this function is
   * called. Setup time (`consume` registration + `run`) does not count
   * against the caller's budget — which matters when the pool is cold or the
   * test harness is loading workers.
   */
  timeoutMs?: number;
}

export async function consumeOnce(
  queue: string | IQueueParams,
  options: IConsumeOnceOptions = {},
): Promise<IMessageTransferable | null> {
  const timeoutMs = options.timeoutMs ?? 2000;

  const consumer = createBareConsumer();

  // Deferred resolving to the message or to `null` on timeout. The Promise
  // contract makes the second resolve a no-op, so no explicit `settled`
  // flag is needed — whichever fires first (handler or timer) wins.
  let resolveResult!: (msg: IMessageTransferable | null) => void;
  const resultPromise = new Promise<IMessageTransferable | null>((resolve) => {
    resolveResult = resolve;
  });

  // Register the handler and start the consumer. If either fails (queue
  // paused or stopped, invalid handler path, pool exhausted), surface the
  // error immediately instead of waiting for the timeout to return `null`.
  try {
    await consumer.consume(
      queue,
      (msg: IMessageTransferable, cb: ICallback) => {
        cb();
        resolveResult(msg);
      },
    );
    await consumer.run();
  } catch (err) {
    await consumer.shutdown().catch(() => undefined);
    throw err;
  }

  // Start the timeout only after the consumer is running. If a message was
  // already delivered during `run()` (possible when the queue is non-empty
  // and delivery races the setup), `resolveResult` has already fired — this
  // timer is then redundant and its eventual callback is a no-op.
  const timer = setTimeout(() => {
    resolveResult(null);
  }, timeoutMs);

  try {
    return await resultPromise;
  } finally {
    clearTimeout(timer);
    // Swallow shutdown errors. If we have a message, a shutdown failure must
    // not hide it. If we timed out, a shutdown failure is not the caller's
    // concern — the registry drain in `per-test.ts` will retry idempotently.
    await consumer.shutdown().catch(() => undefined);
  }
}
