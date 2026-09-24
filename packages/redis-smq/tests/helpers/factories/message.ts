/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * One-shot message production for tests.
 *
 * `produceOne(queue, body, options?)` creates a producer, produces a
 * single message with the given body, and returns the message's ID.
 * It is the shortest path from "I need a message in this queue" to
 * "here is its ID" — the shape that appears in nearly every test whose
 * subject is something other than the produce path itself.
 *
 * The producer is not shut down. It is registered in the producer
 * factory's registry and drained by the per-test teardown, exactly as
 * `startProducer`'s other callers expect. Shutting it down here would
 * break the case where a test wants to produce, inspect the producer's
 * state, and produce again — a shape a few tests rely on, and one that
 * a "clean up after myself" helper would silently break.
 *
 * WHY THIS HELPER EXISTS:
 *
 *   Four local copies of this function lived in four test files before
 *   extraction. Two were identical (`file-based-handler.test.ts`,
 *   `file-based-handler-errors.test.ts`), one was a subset
 *   (`consumer-reaction.test.ts`), and one hardcoded the body and took
 *   a `priority` argument instead (`delete-pending.test.ts`) — the
 *   same operation seen from four angles. The helper below is the
 *   union of the four: every field a call site actually varied is a
 *   named option.
 *
 *   A dead `produceMessage` export in `factories/producer.ts` also
 *   existed — an earlier attempt at the same helper, but without the
 *   options bag, and with no callers. It is replaced by this file.
 *
 * WHAT IT DOES NOT SUPPORT:
 *
 *   Only the two message fields the audit found varied across existing
 *   call sites — `retryThreshold` and `priority` — are in the options
 *   bag. A test that needs a TTL, a scheduled delay, a CRON
 *   expression, a repeat cycle, or an explicit consume timeout builds
 *   the message with `RedisSMQ.newProducibleMessage()` and calls
 *   `producer.produce()` directly; the scheduling and TTL test files
 *   already use that pattern.
 *
 *   Growing the options bag to cover every message field would make
 *   this a re-export of `ProducibleMessage` with an extra layer, which
 *   is the opposite of what a test helper should be.
 */

import {
  EMessagePriority,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { startProducer } from './producer.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options accepted by `produceOne`.
 *
 * Both fields are optional and independent; a call site that needs
 * neither can omit the argument entirely.
 */
export interface IProduceOneOptions {
  /**
   * The message's retry threshold. Omitted, RedisSMQ uses the
   * test-wide default (`3`, set by `applyTestDefaults`). Pass `0` for
   * "first failure is terminal" — the shape the dead-letter tests rely
   * on.
   */
  retryThreshold?: number;

  /**
   * The message's priority. Required when producing to a
   * `PRIORITY_QUEUE` — RedisSMQ rejects a priority-queue message
   * without one — and ignored otherwise (RedisSMQ rejects a
   * priority on a non-priority queue). See
   * `produce-with-failures.test.ts` for both rejection paths.
   */
  priority?: EMessagePriority;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produce one message to `queue` and return its ID.
 *
 * The `queue` argument accepts either a bare name or full queue
 * params. A bare name is prefixed with the current namespace, the same
 * convention `ProducibleMessage.setQueue` uses; call sites that need a
 * specific namespace pass the object form.
 *
 * The producer is created via `startProducer` and left in the factory
 * registry — see the file header for why it is not shut down here.
 */
export async function produceOne(
  queue: string | IQueueParams,
  body: unknown,
  options: IProduceOneOptions = {},
): Promise<string> {
  const producer = await startProducer();

  const msg = RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body);

  if (options.retryThreshold !== undefined) {
    msg.setRetryThreshold(options.retryThreshold);
  }
  if (options.priority !== undefined) {
    msg.setPriority(options.priority);
  }

  const [id] = await producer.produce(msg);
  return id;
}
