/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { RequeueDelayedWorker } from '../../../src/core/consumer/workers/requeue-delayed.worker.js';
import { RequeueImmediateWorker } from '../../../src/core/consumer/workers/requeue-immediate.worker.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { redisConfig, testConfig } from '../../helpers/config/test-config.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for `RequeueDelayedWorker`.
 *
 * The worker reads `keyQueueDelayed` — the sorted set where
 * `RequeueImmediateWorker` parks messages whose retry policy calls for
 * a delay — and moves each message whose score is in the past to
 * `keyQueuePending`. The score is `now + retryDelay` at the time the
 * immediate worker placed the message, so the delayed worker's
 * eligibility check is effectively "has the configured delay
 * elapsed?".
 *
 * The message's status transitions from `UNACK_DELAYING` (where the
 * immediate worker left it) to `PENDING` (where the delayed worker
 * places it) — the same terminal status a caller would see after any
 * successful requeue.
 *
 * THE TWO WORKERS ARE SEPARATE CONTRACTS:
 *
 *   `RequeueImmediateWorker` (covered in `requeue-immediate.test.ts`)
 *   is responsible for the `UNACK_REQUEUING → UNACK_DELAYING`
 *   transition — routing a failed message to either pending or the
 *   delayed set based on the retry policy.
 *
 *   This worker is responsible for the *next* transition:
 *   `UNACK_DELAYING → PENDING`, once the delay has elapsed. The two
 *   are split into separate files so a failure names which worker's
 *   contract regressed.
 *
 *   Reaching the state this worker consumes from therefore requires
 *   driving the message through the immediate worker first, which the
 *   setup helper below does. The setup is deliberately the same shape
 *   as `requeue-immediate.test.ts`'s setup — same consumer-shutdown
 *   path, same immediate worker construction — so a reader who has
 *   opened one file can see exactly what the other is adding.
 *
 * WHY THE WORKER IS RUN BEFORE THE DELAY ELAPSES:
 *
 *   The delayed worker runs as a background process once started, not
 *   as a single-shot operation. Its early ticks will find the
 *   message's score still in the future and leave it alone; a
 *   subsequent tick — after the delay has elapsed — picks the message
 *   up and moves it.
 *
 *   Starting the worker *before* the delay elapses, then polling for
 *   the transition, is the correct pattern: the test doesn't need to
 *   know the worker's internal tick cadence, and the wall time is
 *   bounded by the delay plus one tick rather than the delay plus a
 *   fixed worst-case guess.
 *
 *   An earlier draft considered sleeping for the delay *before*
 *   starting the worker, then running it once. That is a valid
 *   alternative but produces a longer wall time on healthy runs (the
 *   sleep cannot resolve early even if the message were ready) and
 *   duplicates the "wait for a scheduled time" behavior that
 *   `waitForMessageStatus` already provides via its own polling.
 *
 * WHY THE NEGATIVE TEST USES A LONG DELAY:
 *
 *   The "does not move a message whose delay has not elapsed" test
 *   needs a delay that is provably longer than the test's own settle
 *   window. If the delay were short enough to elapse during the
 *   window, the message would legitimately move and the negative
 *   assertion would fail spuriously.
 *
 *   15 seconds is comfortably past the 2-second settle window with
 *   room for a loaded CI's clock drift. The alternative — a
 *   shorter delay with a correspondingly shorter window — trades
 *   safety for a couple of seconds of wall time and is not worth the
 *   flakiness risk.
 *
 * WHY THE STATE POLLING REPLACES FIXED DELAYS:
 *
 *   The original version (as `workers/test00001.test.ts`) used
 *   `bluebird.delay(10000)` after starting the worker. That wait was
 *   calibrated for a healthy run and would either waste time or fail
 *   for the wrong reason depending on the environment.
 *   `waitForMessageStatus` resolves the instant the transition lands
 *   and fails with a specific "did not reach PENDING" message on
 *   timeout — the same pattern the immediate worker's file uses.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The retry delay used by the positive test.
 *
 * Long enough that the immediate worker's `UNACK_DELAYING` transition
 * is unambiguous (the message cannot slip through to pending during
 * the setup), short enough that the delayed worker picks it up within
 * a couple of seconds of the worker starting.
 */
const RETRY_DELAY_MS = 1500;

/**
 * The retry delay used by the negative test.
 *
 * Comfortably longer than the negative test's settle window. See the
 * file header for the reasoning.
 */
const LONG_RETRY_DELAY_MS = 15_000;

/**
 * Settle window for the negative test.
 *
 * Long enough for the delayed worker to have run several ticks (so a
 * regression that moved eligible-looking messages without checking
 * the score would have fired by now), short enough that the test
 * remains quick.
 */
const NEGATIVE_SETTLE_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Drive a message to the `UNACK_REQUEUING` state and return its ID.
 *
 * Same setup as `requeue-immediate.test.ts` — register a consumer
 * whose handler signals on entry and does not ack, produce a message
 * with the retry policy the test is exercising, run the consumer,
 * wait for the handler to be entered, then shut the consumer down.
 * RedisSMQ's shutdown chain runs the unack pipeline, which
 * writes `UNACK_REQUEUING` and parks the message in
 * `keyQueueRequeued`.
 */
async function driveToUnackRequeuing(
  queue: IQueueParams,
  retryDelay: number,
): Promise<string> {
  const { promise: handlerEntered, notify } = deferred();

  const consumer = await getConsumer({
    queue,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    messageHandler: (_msg: IMessageTransferable, _cb: ICallback) => {
      notify();
    },
  });

  const producer = await startProducer();
  const [id] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('will-be-requeued')
      .setRetryDelay(retryDelay),
  );
  await producer.shutdown();

  await consumer.run();
  await handlerEntered;
  await consumer.shutdown();

  await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_REQUEUING, {
    timeoutMs: 10_000,
    description: `setup: message ${id} reached UNACK_REQUEUING`,
  });

  return id;
}

/**
 * Construct a `RequeueImmediateWorker` with the test config.
 *
 * Used by `driveToUnackDelaying` to perform the
 * `UNACK_REQUEUING → UNACK_DELAYING` transition that this file's
 * worker consumes from. The construction mirrors the one in
 * `requeue-immediate.test.ts` — see that file's header for the
 * reasoning about the options.
 */
function makeImmediateWorker(queue: IQueueParams): RequeueImmediateWorker {
  return new RequeueImmediateWorker({
    config: testConfig,
    redisConfig,
    queueParsedParams: { queueParams: queue, groupId: null },
    loggerContext: { namespaces: [`test:${queue.ns}/${queue.name}`] },
    consumerId: randomUUID(),
  });
}

/**
 * Construct a `RequeueDelayedWorker` with the test config.
 *
 * Same options shape as `makeImmediateWorker` — the two workers share
 * RedisSMQ's base class and take the same constructor argument.
 */
function makeDelayedWorker(queue: IQueueParams): RequeueDelayedWorker {
  return new RequeueDelayedWorker({
    config: testConfig,
    redisConfig,
    queueParsedParams: { queueParams: queue, groupId: null },
    loggerContext: { namespaces: [`test:${queue.ns}/${queue.name}`] },
    consumerId: randomUUID(),
  });
}

/**
 * Drive a message all the way to `UNACK_DELAYING` and return its ID.
 *
 * Composes the two setup phases:
 *
 *   1. `driveToUnackRequeuing` — consumer shutdown produces the
 *      `UNACK_REQUEUING` state.
 *   2. The immediate worker's `run` — moves the message to
 *      `keyQueueDelayed` with a score of `now + retryDelay` and sets
 *      the status to `UNACK_DELAYING`.
 *
 * The immediate worker is shut down after the transition lands, so it
 * is not running while the test's own assertions run — the state the
 * test observes is exactly the state the delayed worker will consume
 * from.
 */
async function driveToUnackDelaying(
  queue: IQueueParams,
  retryDelay: number,
): Promise<string> {
  const id = await driveToUnackRequeuing(queue, retryDelay);

  const immediateWorker = makeImmediateWorker(queue);
  await immediateWorker.run();

  await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_DELAYING, {
    timeoutMs: 10_000,
    description: `setup: message ${id} reached UNACK_DELAYING`,
  });

  await immediateWorker.shutdown();

  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RequeueDelayedWorker', () => {
  // -------------------------------------------------------------------------
  // Positive: the delay elapses and the message moves
  // -------------------------------------------------------------------------

  it('moves a delayed message to pending once its retry delay elapses', async () => {
    // The core positive contract: a message that the immediate worker
    // parked in the delayed set becomes pending once its score is in
    // the past.
    //
    // The setup drives the message to `UNACK_DELAYING` (via the
    // consumer-shutdown path and the immediate worker) — the state
    // this worker consumes from.
    const queue = uniqueQueue('requeue-delayed-positive');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id = await driveToUnackDelaying(queue, RETRY_DELAY_MS);

    // Pre-state: the message is in `UNACK_DELAYING`, not pending.
    // Confirms the setup reached the state the delayed worker expects.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // Start the delayed worker. Its early ticks will find the
    // message's score still in the future; once the delay elapses,
    // a subsequent tick moves the message to pending.
    const worker = makeDelayedWorker(queue);
    await worker.run();

    // Poll for the transition. The timeout accommodates the remaining
    // delay (up to `RETRY_DELAY_MS`, less whatever elapsed during
    // setup) plus the worker's tick latency plus a CI margin.
    await waitForMessageStatus(id, EMessagePropertyStatus.PENDING, {
      timeoutMs: RETRY_DELAY_MS + 10_000,
      description: `message ${id} should move to PENDING once its retry delay elapses`,
    });

    // Post-state: the message is in the pending list, and the
    // aggregate status view agrees.
    expect(await pending.countMessages(queue)).toBe(1);
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(pendingPage.items).toHaveLength(1);
    expect(pendingPage.items[0].id).toBe(id);

    await worker.shutdown();
  });

  // -------------------------------------------------------------------------
  // Negative: the delay has not elapsed, so nothing moves
  // -------------------------------------------------------------------------

  it('leaves a delayed message in place while its delay has not yet elapsed', async () => {
    // The complement of the positive test: a message whose score is
    // still in the future must stay in `UNACK_DELAYING`. A regression
    // that moved every message in the delayed set on every tick —
    // ignoring the score — would pass the positive test (the message
    // does eventually move) and fail this one.
    //
    // The message's retry delay is set well beyond the settle window
    // below, so the worker cannot legitimately move it during this
    // test. The assertion is a *negative* one: the state should still
    // be `UNACK_DELAYING` after several worker ticks have had a
    // chance to fire.
    const queue = uniqueQueue('requeue-delayed-negative');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id = await driveToUnackDelaying(queue, LONG_RETRY_DELAY_MS);

    const worker = makeDelayedWorker(queue);
    await worker.run();

    // Settle window: give the worker enough ticks to have fired a
    // hypothetical "move everything" regression. The window is well
    // short of the message's delay, so a healthy worker will not
    // touch the message.
    await new Promise((resolve) => setTimeout(resolve, NEGATIVE_SETTLE_MS));

    // One-shot assertion: read the state and confirm it has not
    // changed. `expectMessageStatus` (as opposed to
    // `waitForMessageStatus`) is correct here — polling for a state
    // that is not supposed to change would only make the test wait
    // for a timeout on failure instead of failing immediately.
    await expectMessageStatus(id, EMessagePropertyStatus.UNACK_DELAYING);

    // The pending list is empty — the message never left the delayed
    // set.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(pendingPage.totalItems).toBe(0);

    await worker.shutdown();
  });
});
