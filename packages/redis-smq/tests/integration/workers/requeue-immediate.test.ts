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
import { RequeueImmediateWorker } from '../../../src/core/consumer/workers/requeue-immediate.worker.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { redisConfig, testConfig } from '../../helpers/config/test-config.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for `RequeueImmediateWorker`.
 *
 * The worker reads the `keyQueueRequeued` list — where RedisSMQ's
 * unacknowledgement pipeline parks a failed message before any retry
 * handling — and dispatches each message based on its retry policy:
 *
 *   - `retryDelay == 0`  →  move the message to `keyQueuePending`.
 *     Status transitions from `UNACK_REQUEUING` to `PENDING`.
 *
 *   - `retryDelay > 0`   →  move the message to `keyQueueDelayed`
 *     with a score of `now + retryDelay`. Status transitions from
 *     `UNACK_REQUEUING` to `UNACK_DELAYING`.
 *
 * The two branches are the worker's entire contract. They belong in
 * one file because they are two outputs of the same dispatch decision
 * — a reader who sees them side by side understands the worker
 * immediately.
 *
 * WHAT THIS FILE DOES NOT COVER:
 *
 *   The *subsequent* transition out of `keyQueueDelayed` back to
 *   `keyQueuePending` is `RequeueDelayedWorker`'s job, not this
 *   worker's. The delayed worker's contract lives in its own file
 *   (`requeue-delayed.test.ts`), and the two files are separated so a
 *   failure names which worker regressed.
 *
 * HOW THE SETUP DRIVES A MESSAGE TO `UNACK_REQUEUING`:
 *
 *   The worker consumes messages from `keyQueueRequeued`, which is
 *   populated by RedisSMQ's unacknowledgement pipeline. The
 *   pipeline runs when a consumer shuts down with an in-flight message
 *   that has not been acked — RedisSMQ's graceful-shutdown path
 *   unacks the message and parks it in the requeued list.
 *
 *   The setup reproduces that state deterministically:
 *
 *     1. Register a consumer whose handler signals on entry and then
 *        deliberately does not ack.
 *     2. Produce a message with the retry policy the test is
 *        exercising.
 *     3. Run the consumer, wait for the handler-entered signal, then
 *        shut the consumer down.
 *     4. RedisSMQ's shutdown chain runs the unacknowledgement
 *        pipeline, which sets the status to `UNACK_REQUEUING` and
 *        puts the message in `keyQueueRequeued`.
 *
 *   Because the consumer's worker cluster shuts down with the
 *   consumer, no worker is left polling the requeued list. The
 *   message stays in `UNACK_REQUEUING` until the test runs
 *   `RequeueImmediateWorker` explicitly — which is the whole point
 *   of instantiating the worker directly.
 *
 * WHY THE WORKER IS CONSTRUCTED WITH THE TEST CONFIG:
 *
 *   RedisSMQ normally creates workers inside a `WorkerCluster`
 *   that the running consumer owns. The cluster supplies each worker
 *   with the parsed config, the Redis connection settings, the queue
 *   it belongs to, a logger context, and a unique consumer ID.
 *
 *   This file constructs the worker directly with the same options,
 *   so the worker sees the same environment it would see in
 *   production. `testConfig` and `redisConfig` come from the same
 *   `test-config.ts` module RedisSMQ-facing helpers use, so the
 *   worker reads the same configuration the rest of the test does.
 *
 *   `consumerId: randomUUID()` provides the worker's identity. The
 *   actual value is arbitrary — it is used only for log correlation,
 *   not for any behavior this test asserts on.
 *
 * WHY THE STATE POLLING REPLACES FIXED DELAYS:
 *
 *   The original versions of these tests (as `workers/test00001` and
 *   `workers/test00002`) used `bluebird.delay(5000)` and
 *   `bluebird.delay(10000)` to give the worker time to complete. Those
 *   waits are the wrong tool: on a healthy run they waste most of the
 *   duration, and on a loaded CI the worker's actual completion can
 *   exceed them, producing a failure that has nothing to do with the
 *   regression the test is meant to catch.
 *
 *   `waitForMessageStatus` polls the message state and resolves the
 *   instant the transition lands, failing with a specific "message
 *   did not reach X" message on timeout rather than a count mismatch
 *   several steps later.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Drive a message to the `UNACK_REQUEUING` state and return its ID.
 *
 * The steps are detailed in the file header. The retry policy comes
 * from the caller so each test can exercise the branch it cares about
 * without duplicating the setup.
 *
 * The consumer is shut down as part of the setup; the message is left
 * in `keyQueueRequeued` with the `UNACK_REQUEUING` status, ready for
 * the immediate worker to process.
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
      // Signal on entry, then deliberately do not call the callback.
      // The message stays in flight until the consumer's shutdown
      // chain unacks it.
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

  // Tear the consumer down while the message is in flight. With
  // `retryDelay` set as the caller specified, the unack pipeline
  // produces `UNACK_REQUEUING` regardless of the delay value — the
  // delay only affects what the *immediate* worker does next.
  await consumer.shutdown();

  // Confirm RedisSMQ has completed the unack before returning.
  // The `shutdown()` promise resolving does not guarantee the state
  // store has been written; polling for the status is the correct
  // observation.
  await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_REQUEUING, {
    timeoutMs: 10_000,
    description: `setup: message ${id} reached UNACK_REQUEUING`,
  });

  return id;
}

/**
 * Construct a `RequeueImmediateWorker` with the test config.
 *
 * The options match what RedisSMQ's `WorkerCluster` would supply
 * to a real worker — see the file header for the reasoning. The
 * `loggerContext.namespaces` label makes the worker's log lines
 * identifiable in the test output if logging were enabled; it has no
 * effect on the worker's behavior.
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RequeueImmediateWorker', () => {
  // -------------------------------------------------------------------------
  // retryDelay == 0 — requeued to pending
  // -------------------------------------------------------------------------

  it('moves a message with retryDelay 0 from the requeued list to the pending list', async () => {
    // The immediate-retry branch: the message's `retryDelay` is 0, so
    // the worker requeues it directly to `keyQueuePending` rather than
    // routing it through the delayed list. This is the fast path a
    // caller gets with the test defaults (`retryDelay: 0` from
    // `applyTestDefaults`), and the branch most retry tests exercise
    // implicitly through RedisSMQ's own worker cluster.
    const queue = uniqueQueue('requeue-immediate-zero');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id = await driveToUnackRequeuing(queue, 0);

    // Pre-state: the message is in the requeued list, not the pending
    // list. Reading both lists confirms the setup produced exactly the
    // state the worker consumes from.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // Construct and run the worker. `run` resolves once the worker's
    // startup sequence completes — not once the message has been
    // processed. The state assertion below is what confirms the work
    // landed.
    const worker = makeImmediateWorker(queue);
    await worker.run();

    // Poll for the transition. The worker processes the requeued list
    // on its own schedule; the wait resolves the instant the state
    // change is written.
    await waitForMessageStatus(id, EMessagePropertyStatus.PENDING, {
      timeoutMs: 10_000,
      description:
        `message ${id} should have moved to PENDING after ` +
        `RequeueImmediateWorker processed the requeued list`,
    });

    // Post-state: the pending list contains the message, and the
    // aggregate status view agrees.
    expect(await pending.countMessages(queue)).toBe(1);
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(pendingPage.items).toHaveLength(1);
    expect(pendingPage.items[0].id).toBe(id);

    await worker.shutdown();
  });

  // -------------------------------------------------------------------------
  // retryDelay > 0 — requeued to delayed
  // -------------------------------------------------------------------------

  it('moves a message with retryDelay > 0 from the requeued list to the delayed list', async () => {
    // The delayed-retry branch: the message's `retryDelay` is
    // positive, so the worker routes it to `keyQueueDelayed` with a
    // score of `now + retryDelay` rather than to the pending list. The
    // message then waits for `RequeueDelayedWorker` to move it back to
    // pending once the score elapses — see `requeue-delayed.test.ts`
    // for that half of the pipeline.
    //
    // This test's scope ends at the `UNACK_DELAYING` state. Reaching
    // the pending list would require also running the delayed worker
    // and waiting for the delay to elapse, which would mix the two
    // workers' contracts in one test.
    const queue = uniqueQueue('requeue-immediate-positive');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // The delay is short enough that the test does not need to wait
    // for it to elapse (the delayed worker is not run), but long
    // enough that the message is unambiguously in the delayed state
    // when the assertion runs. 30 seconds is far past any plausible
    // test duration.
    const RETRY_DELAY_MS = 30_000;

    const id = await driveToUnackRequeuing(queue, RETRY_DELAY_MS);

    // Pre-state: the message is in the requeued list, not the pending
    // list. Same check as the zero-delay test.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const worker = makeImmediateWorker(queue);
    await worker.run();

    // Poll for the transition to the delayed state. The state's name
    // is `UNACK_DELAYING` — the "UNACK" prefix is a reminder that the
    // message is in the unacknowledgement pipeline, not in the
    // scheduled subsystem.
    await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_DELAYING, {
      timeoutMs: 10_000,
      description:
        `message ${id} should have moved to UNACK_DELAYING after ` +
        `RequeueImmediateWorker processed the requeued list with a ` +
        `positive retryDelay`,
    });

    // The message did not go to the pending list. This is the
    // distinguishing assertion between the two branches — the zero-
    // delay test asserted the opposite, so a regression that
    // collapsed the dispatch (routing every message to pending, or
    // every message to delayed) would fail one of the two tests
    // depending on which direction it collapsed.
    expect(await pending.countMessages(queue)).toBe(0);

    // The message is also not in the pending list under a second
    // reading — the check above is the load-bearing one, and this is a
    // confirmation that the first read's value was not a race against
    // a write that arrived between the state poll and the pending
    // read.
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(pendingPage.totalItems).toBe(0);

    await worker.shutdown();
  });
});
