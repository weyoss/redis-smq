/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for consumer shutdown while a message is in flight.
 *
 * A message is "in flight" from the moment RedisSMQ checks it out
 * (moves it from pending to processing) until the handler either
 * acknowledges it or RedisSMQ resolves it through the
 * unacknowledgement pipeline. If the consumer is shut down during that
 * window — a graceful `shutdown()`, not a crash — the message queue has to
 * decide what happens to the unacked message.
 *
 * That decision is delegated to the message's retry configuration, and
 * the two branches have *different completion semantics*:
 *
 *   - `retryThreshold: 0` → DEAD_LETTER. The unack script moves the
 *     message directly to `keyQueueDeadLetter`. The move is complete
 *     when `shutdown()` resolves; no other component is involved.
 *
 *   - `retryThreshold > 0`, `retryDelay: 0` → REQUEUE. The unack script
 *     moves the message to `keyQueueRequeued` (an intermediate list) and
 *     sets its status to `UNACK_REQUEUING`. A separate component —
 *     `RequeueImmediateWorker` — later moves it from requeued to
 *     pending. That worker lives inside a `WorkerCluster` owned by a
 *     *running* consumer.
 *
 * The asymmetry is the reason the requeue test starts a second consumer
 * before asserting. When the first consumer shuts down, its worker
 * cluster shuts down with it — nothing is left to poll the requeued
 * list. The message sits in `UNACK_REQUEUING` until some consumer on the
 * same queue comes up and its worker cluster takes the queue's worker
 * lock. Only then does the requeue complete and the message become
 * eligible for delivery.
 *
 * This is not a RedisSMQ bug — the design leaves work in a durable
 * queue that any running consumer can finish. But it's a subtlety a
 * test has to account for, and one the dead-letter branch hides because
 * its transition is synchronous.
 *
 * CONTRAST WITH CRASH RECOVERY:
 *
 *   This file tests the *graceful* shutdown path. A crash (SIGKILL,
 *   OOM) is a different mechanism: the process is gone, so there is no
 *   opportunity to run the unack pipeline. The message stays in
 *   `PROCESSING` until the consumer's heartbeat TTL expires, at which
 *   point the reap worker requeues it. That path is tested in
 *   `consumer-crash-recovery.test.ts`.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consumer shutdown mid-flight', () => {
  // -------------------------------------------------------------------------
  // DEAD_LETTER branch — retryThreshold: 0
  // -------------------------------------------------------------------------

  it('dead-letters the in-flight message when retryThreshold is 0', async () => {
    const queue = uniqueQueue('shutdown-dl');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { promise: handlerEntered, notify } = deferred();

    const consumer = await getConsumer({
      queue,
      messageHandler: (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _msg: IMessageTransferable,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _cb,
      ) => {
        // Do NOT call cb(). The message must remain unacked so it is
        // still in flight when shutdown runs. Signalling on entry tells
        // the test "the message is checked out, we can shut down now".
        notify();
      },
    });

    const producer = await startProducer();
    const [messageId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setRetryThreshold(0)
        .setBody('shutdown mid-flight'),
    );

    // Start the consumer and wait for the handler to be entered. When
    // `handlerEntered` resolves, the message is in `PROCESSING` state
    // and the handler has not acked.
    await consumer.run();
    await handlerEntered;

    // Tear down the consumer while the message is in flight. With
    // `retryThreshold: 0`, the unack resolves to DEAD_LETTER, and the
    // unack script moves the message directly to `keyQueueDeadLetter`.
    // No worker is involved, so the transition completes as part of
    // `shutdown()`.
    await consumer.shutdown();

    // The transition is synchronous with shutdown, but the state write
    // and the list move are separate operations in the Lua script. Wait
    // for the settled state rather than reading immediately.
    await waitForMessageStatus(
      messageId,
      EMessagePropertyStatus.DEAD_LETTERED,
      {
        timeoutMs: 5000,
        description: `message ${messageId} dead-lettered after mid-flight shutdown`,
      },
    );

    // Queue accounting: the message left pending, entered dead-letter,
    // and did not slip into any other state (like ACKNOWLEDGED).
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(messageId);
  });

  // -------------------------------------------------------------------------
  // REQUEUE branch — retryThreshold > 0, retryDelay: 0
  // -------------------------------------------------------------------------

  it('requeues the in-flight message when retryThreshold allows retries', async () => {
    const queue = uniqueQueue('shutdown-requeue');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { promise: handlerEntered, notify } = deferred();

    const firstConsumer = await getConsumer({
      queue,
      messageHandler: (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _msg: IMessageTransferable,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _cb,
      ) => {
        // Enter, signal, do not ack.
        notify();
      },
    });

    const producer = await startProducer();
    const [messageId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setRetryThreshold(3)
        .setRetryDelay(0)
        .setBody('shutdown mid-flight'),
    );

    await firstConsumer.run();
    await handlerEntered;

    // Tear down the first consumer. This unacks the in-flight message:
    // it moves from `keyQueueProcessing` to `keyQueueRequeued` and its
    // status becomes `UNACK_REQUEUING`.
    //
    // The message does NOT reach `PENDING` from this alone. The unack
    // script writes to the intermediate list; the move from
    // `keyQueueRequeued` to `keyQueuePending` is done by
    // `RequeueImmediateWorker`, which lives in a `WorkerCluster` owned
    // by a running consumer. Since the first consumer is shutting down,
    // its worker cluster shuts down with it — nothing is left to poll
    // the requeued list.
    await firstConsumer.shutdown();

    // Start a fresh consumer on the same queue. Its worker cluster takes
    // the queue's worker lock, loads `RequeueImmediateWorker`, and the
    // worker moves the message from requeued to pending. The same
    // consumer's dequeue loop then delivers it, and the handler acks.
    //
    // Order matters: this consumer must be running before the assertion
    // waits on the ack, because the requeue is driven by this
    // consumer's worker cluster, not by the shutdown of the previous
    // one. Waiting for `PENDING` before starting the consumer would
    // time out — nothing would move the message.
    const secondConsumer = await getConsumer({
      queue,
      messageHandler: (_msg, cb) => cb(),
    });

    // Subscribe before run — the subscribe-before-trigger contract.
    const acked = untilMessageAcknowledged(secondConsumer, messageId, {
      timeoutMs: 20_000,
      description: `message ${messageId} redelivered to second consumer`,
    });

    await secondConsumer.run();
    await acked;

    await expectMessageStatus(messageId, EMessagePropertyStatus.ACKNOWLEDGED);

    // Final accounting: the message was delivered exactly once by the
    // second consumer, and the queue has nothing pending.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(1);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    expect(await deadLettered.countMessages(queue)).toBe(0);
  });
});
