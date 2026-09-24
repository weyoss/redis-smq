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
import { ReapConsumersWorker } from '../../../src/core/consumer/workers/reap-consumers.worker.js';
import { RequeueImmediateWorker } from '../../../src/core/consumer/workers/requeue-immediate.worker.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { crashAConsumerConsumingAMessage } from '../../helpers/scenarios/crash-consumer.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { redisConfig, testConfig } from '../../helpers/config/test-config.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for `ReapConsumersWorker`.
 *
 * The worker detects consumers whose heartbeats have expired —
 * consumers that crashed or were killed without a graceful shutdown —
 * and unacks their in-flight messages. The unack runs the same
 * pipeline a graceful shutdown would: the message moves from
 * `PROCESSING` to `UNACK_REQUEUING`, and RedisSMQ's retry policy
 * takes over from there.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Construct a `ReapConsumersWorker` with the test config.
 *
 * Same option shape as the other manual worker constructions in this
 * folder — see `requeue-immediate.test.ts` for the reasoning about
 * each field.
 */
function makeReaperWorker(queue: IQueueParams): ReapConsumersWorker {
  return new ReapConsumersWorker({
    config: testConfig,
    redisConfig,
    queueParsedParams: { queueParams: queue, groupId: null },
    loggerContext: { namespaces: [`test:${queue.ns}/${queue.name}`] },
    consumerId: randomUUID(),
  });
}

/**
 * Construct a `RequeueImmediateWorker` with the test config.
 *
 * Used by the positive test to complete the recovery chain. Same
 * construction as `requeue-immediate.test.ts`.
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

describe('ReapConsumersWorker', () => {
  // -------------------------------------------------------------------------
  // Positive: crashed consumer's message is recovered
  // -------------------------------------------------------------------------

  it('recovers a crashed consumer\u2019s in-flight message, which reaches PENDING', async () => {
    // The end-to-end crash-recovery contract. The setup produces a
    // message under a consumer that is then SIGKILL'd, leaving the
    // message in `PROCESSING` under a dead consumer. The reaper
    // detects the dead consumer and unacks the message; the immediate
    // worker then moves it to pending. The final assertion is on the
    // pending state — the caller-visible "the message was recovered"
    // outcome.
    const queue = uniqueQueue('reap-crashed');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Crash a consumer with an in-flight message. When this resolves,
    // the child has been SIGKILL'd and its message is in `PROCESSING`
    // state under a consumer that no longer exists.
    await crashAConsumerConsumingAMessage({ queue });

    // Read the message ID from the queue's published list. The
    // crashed consumer produced exactly one message, so there is one
    // entry.
    const published = RedisSMQ.createQueuePublishedMessages();
    const page = await published.getMessages(queue, 0, 100);
    expect(
      page.totalItems,
      'the crashed consumer should have produced exactly one message',
    ).toBe(1);
    const id = page.items[0].id;

    // Pre-state: the message is `PROCESSING`, held by the dead
    // consumer. Without this assertion, a setup failure that left the
    // message pending — or a bug in the crash helper that let the
    // child shut down gracefully — would make the recovery assertions
    // below pass for the wrong reason.
    await expectMessageStatus(id, EMessagePropertyStatus.PROCESSING);

    // Run the reaper. Its `run()` starts a periodic tick that detects
    // dead consumers (heartbeat key expired) and unacks their
    // in-flight messages. The tick that lands *after* the heartbeat
    // expires is the one that performs the recovery.
    const reaper = makeReaperWorker(queue);
    await reaper.run();

    // Wait for the reaper's action. The timeout covers the heartbeat
    // TTL (3s by default) plus the reaper's own tick interval plus a
    // CI margin. On a healthy run the transition lands shortly after
    // the heartbeat expires.
    await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_REQUEUING, {
      timeoutMs: 25_000,
      description:
        `reaper should move message ${id} from PROCESSING to ` +
        `UNACK_REQUEUING after the dead consumer's heartbeat expires`,
    });

    // Complete the chain with the immediate worker. The message's
    // retry policy determines where it goes: with the test default
    // `retryDelay: 0`, straight to pending.
    const immediate = makeImmediateWorker(queue);
    await immediate.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.PENDING, {
      timeoutMs: 10_000,
      description:
        `message ${id} should reach PENDING after the recovery chain ` +
        `(reaper + immediate worker) completes`,
    });

    // Post-state: the message is in the pending list. This is the
    // caller-visible "the message was recovered and is ready for
    // delivery" outcome.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(1);
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(pendingPage.items).toHaveLength(1);
    expect(pendingPage.items[0].id).toBe(id);

    // The message is not in the processing state anymore, and not in
    // any of the other terminal states — the recovery moved it to
    // pending and left it there.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 1,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });

    await immediate.shutdown();
    await reaper.shutdown();
  });

  // -------------------------------------------------------------------------
  // Negative: live consumer's message is left alone
  // -------------------------------------------------------------------------

  it('does not touch a live consumer\u2019s in-flight message', async () => {
    // The complement of the positive test: a message in `PROCESSING`
    // state under a *live* consumer must not be reaped. The reaper's
    // job is to recover messages from dead consumers, not to steal
    // in-flight work from running ones.
    //
    // A regression that unacked every message in the processing
    // subsystem — ignoring the heartbeat check — would pass the
    // positive test and fail this one.
    //
    // The consumer is a live in-process one (not a fork), registered
    // with a handler that signals on entry and then deliberately does
    // not ack. The message stays in flight for as long as the test
    // needs, and the consumer's heartbeat keeps it "live" from the
    // reaper's perspective.
    const queue = uniqueQueue('reap-live');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Capture the handler's callback so the test can release it during
    // cleanup — a consumer whose handler never calls back would hang
    // on `shutdown()`.
    let capturedCb: ICallback | undefined;
    const { promise: handlerEntered, notify } = deferred();

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        capturedCb = cb;
        notify();
        // Deliberately do not call cb — hold the message in flight.
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('stays-in-flight'),
    );
    await producer.shutdown();

    await consumer.run();
    await handlerEntered;

    // Confirm the message is in `PROCESSING` before running the
    // reaper. Without this pre-state, the negative assertion after
    // the settle window would pass even if the setup had failed to
    // put the message in flight.
    await waitForMessageStatus(id, EMessagePropertyStatus.PROCESSING, {
      timeoutMs: 5000,
      description: `setup: message ${id} reached PROCESSING under a live consumer`,
    });

    // Run a reaper on this queue while the consumer is alive.
    const reaper = makeReaperWorker(queue);
    await reaper.run();

    // Settle window: give the reaper's tick time to fire at least
    // once. A regression that moved in-flight messages unconditionally
    // would have moved this one by now.
    //
    // The window is shorter than the heartbeat TTL — 3s default — so
    // the consumer is unambiguously alive when the assertion runs.
    // A longer window would let the consumer's heartbeat edge close
    // to expiry, muddying the "live consumer" premise.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // The message is still `PROCESSING`. `expectMessageStatus` (as
    // opposed to `waitForMessageStatus`) is the correct shape here:
    // the assertion is that the state has *not* changed, and polling
    // for a state that is not supposed to arrive would only make the
    // failure mode a timeout instead of an immediate "state is X,
    // expected Y" message.
    await expectMessageStatus(id, EMessagePropertyStatus.PROCESSING);

    // The message is not in the pending list — it never left the
    // processing subsystem.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // Cleanup: release the handler so the consumer can shut down,
    // then shut down both the consumer and the reaper.
    expect(capturedCb).toBeDefined();
    capturedCb!();
    await consumer.shutdown();
    await reaper.shutdown();
  });
});
