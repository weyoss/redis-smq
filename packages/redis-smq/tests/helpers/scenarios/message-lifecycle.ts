/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Multi-step scenarios that drive messages into a specific terminal
 * state through a real consumer lifecycle.
 *
 * Three families of helper, each answering a "get N messages into
 * state X" question:
 *
 *   - `produceAndAck(queue, count)` — produce N messages, run a
 *     consumer whose handler acks, wait for every ack, return the
 *     produced IDs.
 *
 *   - `produceAndDeadLetter(queue, count)` — produce N messages with
 *     `retryThreshold: 0` (first failure is terminal), run a consumer
 *     whose handler always fails, wait for every dead-letter, return
 *     the produced IDs.
 *
 *   - `waitForXCount(queue, expected)` — poll a queue's message-state
 *     counts until they reach the expected values. Used by tests
 *     whose subject is a *background* operation (purge, delete) whose
 *     effect lands asynchronously; the caller polls for the settled
 *     state rather than reading immediately after the call.
 *
 * BOUNDARY WITH `factories/message.ts`:
 *
 *   A helper that produces messages and returns — no consumer, no
 *   wait — belongs in `factories/message.ts`. This file's helpers all
 *   involve the consumer lifecycle (or the polling that follows one);
 *   they compose `getConsumer`, `startProducer`, the event awaiters,
 *   and shutdown chains.
 *
 * WHY THE CONSUMER AND PRODUCER ARE BOTH SHUT DOWN BEFORE RETURNING:
 *
 *   Every scenario in this file leaves RedisSMQ in the state the
 *   caller's assertions expect: no live consumer polling the queue,
 *   no live producer holding a pool connection. A live consumer would
 *   race the caller's subsequent reads — a message the caller expects
 *   to be in the acked list could be re-delivered if the handler were
 *   still registered. A live producer costs a pool slot for no reason
 *   once the messages are produced.
 *
 *   Both shutdowns are performed in `finally` blocks. If a message
 *   never reaches the expected state, the awaiter rejects with a
 *   timeout; the shutdowns still run, so the failure does not leak a
 *   consumer into the next test.
 *
 * WHY THE BODY FACTORY IS A FUNCTION, NOT A VALUE:
 *
 *   Every produced message carries a distinct body by default —
 *   `{ seq: i }`, where `i` is the message's zero-based index in the
 *   batch. A distinct body makes the produced messages distinguishable
 *   in failure output ("message with body {seq:2} never reached
 *   ACKNOWLEDGED") and matches what the audit found the local copies
 *   doing (`{ seq: i }`, `acked-${i}`, `msg-${i}`, …).
 *
 *   Callers that need a specific body — a shape the assertions on the
 *   consumer side will inspect — pass their own factory. The default
 *   is deliberately minimal; the produced body is rarely the subject
 *   of the tests that use these helpers.
 */

import type { ICallback } from 'redis-smq-common';
import {
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../assertions/wait-for.js';
import {
  untilMessageAcknowledged,
  untilMessageDeadLettered,
} from '../events/await-event.js';
import { getConsumer } from '../factories/consumer.js';
import { startProducer } from '../factories/producer.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default timeout for the awaiters used by the produce-and-consume
 * scenarios.
 *
 * Long enough to absorb a worker tick plus scheduling jitter on a
 * loaded CI; short enough that a broken scenario fails within a
 * test-friendly window. The audit found the local copies using 10s
 * uniformly, which this preserves.
 */
const DEFAULT_AWAITER_TIMEOUT_MS = 10_000;

/**
 * Default timeout for the count pollers.
 *
 * The operations these pollers wait on — purge, delete — schedule a
 * background job that a worker picks up on its next tick and processes
 * in batches. On a healthy run the effect lands within a second or
 * two; on a loaded CI it can take longer. 15s matches the constant
 * the local copies used uniformly.
 */
const DEFAULT_COUNT_TIMEOUT_MS = 15_000;

/**
 * The default retry threshold for `produceAndDeadLetter`'s messages.
 *
 * Zero is RedisSMQ's "no retries" setting — the first failure is
 * terminal. That is the only value the dead-letter helper is useful
 * with; a message that retries before dead-lettering would take three
 * deliveries per message, and the helper's "wait for every
 * dead-letter" awaiter would still fire, but the caller's assertion
 * about the handler's call count would need to account for the retry
 * policy.
 *
 * Fixed rather than parameterized because the helper's name promises a
 * specific setup. A caller who wants a different retry threshold
 * builds the setup directly — the pattern is short enough at the call
 * site that a more general helper would not pay for itself.
 */
const DEAD_LETTER_RETRY_THRESHOLD = 0;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options accepted by `produceAndAck` and `produceAndDeadLetter`.
 */
export interface IProduceAndConsumeOptions {
  /**
   * Produce the message body for the message at index `index`.
   *
   * Defaults to `{ seq: index }`. Override when the test's assertions
   * on the consumer side inspect the body, or when a specific body
   * shape makes a failure message clearer.
   */
  bodyFactory?: (index: number) => unknown;

  /**
   * Milliseconds to wait for each message's terminal event before the
   * awaiter rejects. Defaults to `DEFAULT_AWAITER_TIMEOUT_MS`.
   */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Produce-and-acknowledge
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages, run a consumer whose handler acks every
 * message, wait for every ack, and return the produced message IDs in
 * production order.
 *
 * The order is deterministic: the producer is a single instance
 * issuing sequential `produce` calls, and the consumer processes the
 * FIFO queue in production order. A caller that needs the IDs in a
 * specific order (the size-limits tests do, to assert which records
 * survive an eviction) gets the order this returns without a separate
 * sort.
 *
 * The consumer and producer are both shut down before returning. See
 * the file header for why.
 */
export async function produceAndAck(
  queue: IQueueParams,
  count: number,
  options: IProduceAndConsumeOptions = {},
): Promise<string[]> {
  const bodyFactory = options.bodyFactory ?? defaultBodyFactory;
  const timeoutMs = options.timeoutMs ?? DEFAULT_AWAITER_TIMEOUT_MS;

  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const ids = await produceBatch(queue, count, bodyFactory);

  // Subscribe before run — the subscribe-before-trigger contract.
  // Every awaiter is installed before the consumer's first poll can
  // fire an ack event, so no ack is missed even if the whole batch is
  // delivered in a single poll cycle.
  const ackWaiters = ids.map((id) =>
    untilMessageAcknowledged(consumer, id, { timeoutMs }),
  );

  try {
    await consumer.run();
    await Promise.all(ackWaiters);
  } finally {
    await consumer.shutdown().catch(() => undefined);
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Produce-and-dead-letter
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages with `retryThreshold: 0`, run a consumer
 * whose handler always reports a failure, wait for every message to
 * reach the dead-letter list, and return the produced message IDs in
 * production order.
 *
 * The messages reach the dead-letter list on their first delivery —
 * `retryThreshold: 0` makes the first failure terminal. The consumer
 * therefore invokes the handler exactly `count` times, once per
 * message.
 *
 * The consumer and producer are both shut down before returning.
 */
export async function produceAndDeadLetter(
  queue: IQueueParams,
  count: number,
  options: IProduceAndConsumeOptions = {},
): Promise<string[]> {
  const bodyFactory = options.bodyFactory ?? defaultBodyFactory;
  const timeoutMs = options.timeoutMs ?? DEFAULT_AWAITER_TIMEOUT_MS;

  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
      cb(new Error('setup: always fails')),
  });

  const ids = await produceBatch(
    queue,
    count,
    bodyFactory,
    DEAD_LETTER_RETRY_THRESHOLD,
  );

  // Subscribe before run, same reasoning as `produceAndAck`.
  const dlWaiters = ids.map((id) =>
    untilMessageDeadLettered(consumer, id, undefined, { timeoutMs }),
  );

  try {
    await consumer.run();
    await Promise.all(dlWaiters);
  } finally {
    await consumer.shutdown().catch(() => undefined);
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Count pollers
// ---------------------------------------------------------------------------

/**
 * Poll until the queue's pending count equals `expected`.
 *
 * The default timeout is generous — the pollers are used after
 * background operations (purge, delete) whose effect lands
 * asynchronously. A caller that needs a different timeout passes one.
 */
export async function waitForPendingCount(
  queue: IQueueParams,
  expected: number,
  timeoutMs = DEFAULT_COUNT_TIMEOUT_MS,
): Promise<void> {
  const pending = RedisSMQ.createQueuePendingMessages();
  await waitFor(async () => (await pending.countMessages(queue)) === expected, {
    timeoutMs,
    description: `queue ${queue.ns}:${queue.name} pending count reached ${expected}`,
  });
}

/**
 * Poll until the queue's acknowledged count equals `expected`.
 *
 * Reads through the state-specific accessor — the same one the
 * framework's own `countMessages` uses. See the sibling pollers for
 * the timeout reasoning.
 */
export async function waitForAcknowledgedCount(
  queue: IQueueParams,
  expected: number,
  timeoutMs = DEFAULT_COUNT_TIMEOUT_MS,
): Promise<void> {
  const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
  await waitFor(
    async () => (await acknowledged.countMessages(queue)) === expected,
    {
      timeoutMs,
      description: `queue ${queue.ns}:${queue.name} acknowledged count reached ${expected}`,
    },
  );
}

/**
 * Poll until the queue's dead-lettered count equals `expected`.
 */
export async function waitForDeadLetteredCount(
  queue: IQueueParams,
  expected: number,
  timeoutMs = DEFAULT_COUNT_TIMEOUT_MS,
): Promise<void> {
  const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
  await waitFor(
    async () => (await deadLettered.countMessages(queue)) === expected,
    {
      timeoutMs,
      description: `queue ${queue.ns}:${queue.name} dead-lettered count reached ${expected}`,
    },
  );
}

/**
 * Poll until the queue's scheduled count equals `expected`.
 */
export async function waitForScheduledCount(
  queue: IQueueParams,
  expected: number,
  timeoutMs = DEFAULT_COUNT_TIMEOUT_MS,
): Promise<void> {
  const scheduled = RedisSMQ.createQueueScheduledMessages();
  await waitFor(
    async () => (await scheduled.countMessages(queue)) === expected,
    {
      timeoutMs,
      description: `queue ${queue.ns}:${queue.name} scheduled count reached ${expected}`,
    },
  );
}

/**
 * Poll until every message-state count for the queue is zero.
 *
 * Reads the aggregate view (`countMessagesByStatus` on
 * `QueuePublishedMessages`) rather than four separate accessors. The
 * four-bucket read is what the predicate needs, and it is a single
 * Redis round-trip rather than four — useful when the poll is running
 * at a short interval.
 *
 * The predicate requires *every* bucket to be zero in the same
 * snapshot. A regression that cleared pending but left acknowledged
 * non-empty fails with a message naming the queue and the timeout,
 * rather than with an assertion that a specific count was zero when
 * it was not.
 */
export async function waitForAllCountsZero(
  queue: IQueueParams,
  timeoutMs = DEFAULT_COUNT_TIMEOUT_MS,
): Promise<void> {
  const queueMessages = RedisSMQ.createQueuePublishedMessages();
  await waitFor(
    async () => {
      const counts = await queueMessages.countMessagesByStatus(queue);
      return (
        counts.pending === 0 &&
        counts.acknowledged === 0 &&
        counts.deadLettered === 0 &&
        counts.scheduled === 0
      );
    },
    {
      timeoutMs,
      description: `all message counts for queue ${queue.ns}:${queue.name} reached zero`,
    },
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * The default body factory. `{ seq: index }` is a small, unique,
 * inspectable object — distinct enough per message that a failure
 * message naming a body identifies the batch position.
 */
function defaultBodyFactory(index: number): unknown {
  return { seq: index };
}

/**
 * Produce `count` messages sequentially, return their IDs in
 * production order, and shut the producer down.
 *
 * Sequential production is deliberate: the callers of the
 * produce-and-consume scenarios rely on the returned IDs being in the
 * order the consumer will observe them, which is production order on a
 * FIFO queue. Concurrent production would make that order undefined.
 *
 * The producer is shut down in `finally` so a produce failure does not
 * leak a live producer into the next test.
 */
async function produceBatch(
  queue: IQueueParams,
  count: number,
  bodyFactory: (index: number) => unknown,
  retryThreshold?: number,
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];

  try {
    for (let i = 0; i < count; i += 1) {
      const msg = RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(bodyFactory(i));
      if (retryThreshold !== undefined) {
        msg.setRetryThreshold(retryThreshold);
      }
      const [id] = await producer.produce(msg);
      ids.push(id);
    }
  } finally {
    await producer.shutdown().catch(() => undefined);
  }

  return ids;
}
