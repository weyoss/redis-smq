/**
 * Consumer factory for tests.
 *
 * Two entry points:
 *
 *   - getConsumer(args?)    — create a consumer and register a message
 *                             handler on a queue. Async, so a failed
 *                             consume() surfaces as a test failure rather
 *                             than a hang.
 *   - createBareConsumer()  — create a consumer with no handler registered.
 *                             For tests that need to register handlers
 *                             manually (multiplexed mode, ordering checks).
 *
 * Both track every consumer they create in a module-level registry. The
 * `afterEach` in `tests/setup/per-test.ts` calls `shutdownAllConsumers()`
 * to drain it, so a test that throws mid-assertion cannot leak a live
 * consumer into the next test.
 *
 * Consumers are NOT auto-run. The test decides when to call `.run()`. This
 * matters for tests that register handlers before `run()` to exercise the
 * register-then-run path (see consumer multiplexing tests).
 */

import type { ICallback } from 'redis-smq-common';
import {
  type IConsumer,
  type IConsumerOptions,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
  type TConsumerMessageHandler,
} from '../../../src/index.js';
import { getDefaultQueue } from './queue.js';

// ---------------------------------------------------------------------------
// Public API — types
// ---------------------------------------------------------------------------

export interface IConsumerArgs {
  /** Queue to consume from. Defaults to `getDefaultQueue()`. */
  queue?: string | IQueueParams;
  /**
   * Message handler. Defaults to auto-ack (`(_m, cb) => cb()`). Pass your
   * own to test error paths, timeouts, async handlers, etc.
   */
  messageHandler?: TConsumerMessageHandler;
  /** Options passed to `RedisSMQ.createConsumer()`. */
  options?: IConsumerOptions;
}

// ---------------------------------------------------------------------------
// Public API — factory
// ---------------------------------------------------------------------------

/**
 * Create a consumer and register a message handler on a queue.
 *
 * The returned consumer is registered in the live-consumer registry and
 * will be shut down automatically by the per-test teardown. Tests that
 * need to assert on a specific shutdown point should still call
 * `consumer.shutdown()` explicitly; the teardown is idempotent.
 */
export async function getConsumer(
  args: IConsumerArgs = {},
): Promise<IConsumer> {
  const consumer = createBareConsumer(args.options);

  const queue = args.queue ?? getDefaultQueue();
  const handler: TConsumerMessageHandler =
    args.messageHandler ??
    ((_msg: IMessageTransferable, cb: ICallback) => cb());

  // Async consume: a failure here (queue paused, duplicate handler, etc.)
  // must fail the test, not hang it.
  await consumer.consume(queue, handler);

  return consumer;
}

/**
 * Create a consumer with no message handler registered.
 *
 * Use when the test needs full control over registration order — e.g.
 * registering before `run()` to exercise the register-then-run path, or
 * registering on multiple queues at specific moments. The consumer is
 * still tracked in the registry and will be shut down by teardown.
 */
export function createBareConsumer(options?: IConsumerOptions): IConsumer {
  const consumer = RedisSMQ.createConsumer(options);
  track(consumer);
  return consumer;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Consumers created via this factory since the last drain. `per-test.ts`'s
 * `afterEach` calls `shutdownAllConsumers()`, which shuts each one down and
 * clears the set. Using a Set means a consumer registered twice (unlikely
 * but possible if a helper reuses one) is drained once.
 */
const liveConsumers = new Set<IConsumer>();

function track(consumer: IConsumer): void {
  liveConsumers.add(consumer);
}

/**
 * Shut down every tracked consumer. Idempotent — a consumer already shut
 * down by its test yields an error which we swallow. Re-entrant — the set
 * is cleared before awaiting, so a `shutdown` that triggers more cleanup
 * cannot re-enter this function.
 */
export async function shutdownAllConsumers(): Promise<void> {
  const consumers = [...liveConsumers];
  liveConsumers.clear();
  await Promise.all(consumers.map((c) => c.shutdown().catch(() => undefined)));
}

/**
 * Count of tracked consumers that have not yet been drained. Intended for
 * debugging a hang or for the rare test that asserts cleanup happened.
 * Do not use as a normal assertion — the registry is internal state.
 */
export function liveConsumerCount(): number {
  return liveConsumers.size;
}
