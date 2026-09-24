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
import { expectMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { crashAConsumerConsumingAMessage } from '../../helpers/scenarios/crash-consumer.js';

/**
 * Integration tests for recovery from a consumer process crash.
 *
 * A consumer that dies mid-message — SIGKILL, OOM, container eviction —
 * leaves its in-flight message in the `PROCESSING` state with no live
 * owner. RedisSMQ recovers via this path:
 *
 *   1. The dead consumer stops sending heartbeats.
 *   2. Its heartbeat key expires after `heartbeatTTL`
 *      (`TEST_CONSUMER_OPTIONS.heartbeatTTL`, currently 3000ms).
 *   3. The reap worker observes the expired heartbeat, finds the
 *      consumer's in-flight messages, and requeues them to their origin
 *      queue in `PENDING` state.
 *   4. A live consumer on that queue picks the message up and delivers it.
 *
 * The contract these tests verify:
 *
 *   - An in-flight message survives a consumer crash. It is not lost, and
 *     it is eventually delivered to a live consumer.
 *   - The recovered message returns to *its origin* queue. A crash on one
 *     queue does not corrupt delivery on another.
 *   - The recovery is transparent — the message's ID is unchanged, and
 *     the eventual outcome is the same as if the crash had not happened.
 *
 * The crash is simulated by `crashAConsumerConsumingAMessage` from
 * `scenarios/crash-consumer.ts`. That helper forks a child process,
 * produces a message to a specified queue, starts a consumer whose handler
 * never acknowledges, and SIGKILLs the child once the message is in
 * flight. See the helper's docstring for the handshake protocol.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consumer crash recovery', () => {
  it('recovers an in-flight message after the consumer process dies', async () => {
    const queue = uniqueQueue('crash');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Kill a consumer mid-message. When this resolves, the child has been
    // SIGKILLed and its message is in `PROCESSING` state, owned by a
    // consumer that no longer exists.
    await crashAConsumerConsumingAMessage({ queue });

    // Read the message ID from the queue's view. The crashed consumer
    // produced exactly one message, so the queue has exactly one entry
    // and the ID is unambiguous. Capturing it here (rather than relying
    // on the ack event alone) lets the test assert on *which* message was
    // recovered, not merely that some message was.
    const published = RedisSMQ.createQueuePublishedMessages();
    const page = await published.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);

    const crashedMessageId = page.items[0].id;

    // Start a fresh consumer on the same queue. It will poll, find no
    // available message (the crashed one is still `PROCESSING` under a
    // dead consumer), and wait. Once the heartbeat expires and the reap
    // worker requeues the message, this consumer picks it up.
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb) => cb(),
    });

    // 20s is comfortably above `heartbeatTTL` (3s) plus the reap-worker
    // interval plus scheduling jitter. See the file header for how to
    // diagnose a timeout.
    const acked = untilMessageAcknowledged(consumer, crashedMessageId, {
      timeoutMs: 20_000,
      description: `crashed message ${crashedMessageId} recovered and acknowledged`,
    });

    await consumer.run();
    await acked;

    // The recovered message must reach the same end state as a message
    // that was never crashed on. Asserting the status (rather than only
    // the event) catches a bug where the ack event fires but the message
    // state was not actually updated — an unlikely but possible failure
    // if the ack pipeline and the state machine ever diverge.
    await expectMessageStatus(
      crashedMessageId,
      EMessagePropertyStatus.ACKNOWLEDGED,
    );

    // Queue accounting: nothing left pending, exactly one acknowledged.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(1);
  });

  it('recovers the message to its origin queue when other queues are active', async () => {
    // Two queues, two consumers, two messages — one normal, one crashed
    // mid-flight. The test verifies that the crash on one queue does not
    // affect delivery on the other, and that the recovered message
    // returns to the queue it was originally destined for.
    //
    // This covers a class of bug that the single-queue test cannot: a
    // recovery path that requeues messages to a default or "first" queue
    // instead of to their origin. With only one queue, that bug would be
    // invisible.
    const crashedQueue = uniqueQueue('crashed');
    const controlQueue = uniqueQueue('control');
    await createQueue(crashedQueue, EQueueType.FIFO_QUEUE);
    await createQueue(controlQueue, EQueueType.FIFO_QUEUE);

    // Track deliveries per queue so the assertions can attribute each
    // message to the correct consumer.
    const receivedOnCrashedQueue: string[] = [];
    const receivedOnControlQueue: string[] = [];

    const crashedQueueConsumer = await getConsumer({
      queue: crashedQueue,
      messageHandler: (msg: IMessageTransferable, cb) => {
        receivedOnCrashedQueue.push(msg.id);
        cb();
      },
    });

    const controlQueueConsumer = await getConsumer({
      queue: controlQueue,
      messageHandler: (msg: IMessageTransferable, cb) => {
        receivedOnControlQueue.push(msg.id);
        cb();
      },
    });

    // Produce a control message through a normal producer. This message
    // never touches the crash path — it exists so the test can assert
    // that the crash on one queue left delivery on the other untouched.
    const producer = await startProducer();
    const [controlMessageId] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(controlQueue).setBody('control'),
    );

    // Crash a consumer on the other queue. The crash helper produces its
    // own message and kills the child mid-processing.
    await crashAConsumerConsumingAMessage({ queue: crashedQueue });

    // Capture the crashed message ID from the queue's view — same
    // reasoning as the first test.
    const published = RedisSMQ.createQueuePublishedMessages();
    const crashedPage = await published.getMessages(crashedQueue, 0, 100);
    expect(crashedPage.totalItems).toBe(1);
    const crashedMessageId = crashedPage.items[0].id;

    // Subscribe before running, for both consumers.
    const crashedAcked = untilMessageAcknowledged(
      crashedQueueConsumer,
      crashedMessageId,
      { timeoutMs: 20_000, description: 'crashed message recovered' },
    );
    const controlAcked = untilMessageAcknowledged(
      controlQueueConsumer,
      controlMessageId,
      { timeoutMs: 20_000, description: 'control message delivered' },
    );

    await crashedQueueConsumer.run();
    await controlQueueConsumer.run();

    await Promise.all([crashedAcked, controlAcked]);

    // Each consumer received exactly one message. The counts are asserted
    // as well as the identities because a duplicate delivery on the
    // crashed queue (recovery + original both landing) would still let
    // the "one ID is present" assertion pass — but not the length check.
    expect(receivedOnCrashedQueue).toHaveLength(1);
    expect(receivedOnControlQueue).toHaveLength(1);

    // The recovered message returned to its origin queue, not to the
    // control queue and not to some default.
    expect(receivedOnCrashedQueue[0]).toBe(crashedMessageId);
    expect(receivedOnControlQueue[0]).toBe(controlMessageId);

    // Both messages reached the acknowledged state in their respective
    // queues.
    await expectMessageStatus(
      crashedMessageId,
      EMessagePropertyStatus.ACKNOWLEDGED,
    );
    await expectMessageStatus(
      controlMessageId,
      EMessagePropertyStatus.ACKNOWLEDGED,
    );
  });
});
