/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EQueueType,
  type IConsumer,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the point-to-point delivery guarantee across
 * multiple consumers on a single queue.
 *
 * RedisSMQ's POINT_TO_POINT delivery model promises: for a given message,
 * exactly one consumer on the message's destination queue receives it. The
 * other consumers on the same queue do not see it — not now, not later,
 * not as a duplicate.
 *
 * That promise is the foundation of the whole messaging model. If it
 * breaks, the consequences range from "a message is lost" (zero consumers
 * received it) to "a message is processed twice" (two consumers received
 * it, and only one ack wins, but both handlers ran).
 */

// ---------------------------------------------------------------------------
// Tracking helper
// ---------------------------------------------------------------------------

/**
 * A consumer paired with the messages its handler has observed.
 *
 * The array grows in the order messages are delivered. Because the handler
 * runs synchronously up to the point it calls `cb()`, `received` reflects
 * "messages RedisSMQ handed to this consumer", independent of whether
 * the ack landed yet.
 */
interface ITrackedConsumer {
  consumer: IConsumer;
  received: IMessageTransferable[];
}

/**
 * Register a consumer whose handler records every delivery into a
 * per-consumer array, then acknowledges the message.
 *
 * The ack is what makes the message "done" from RedisSMQ's point of
 * view. Without it, the message would be requeued after a timeout, which
 * would produce a second delivery (to *some* consumer) and defeat the
 * point of the test.
 */
async function createTrackedConsumer(
  queue: string | IQueueParams,
): Promise<ITrackedConsumer> {
  const received: IMessageTransferable[] = [];
  const consumer = await getConsumer({
    queue,
    messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
      // Record before ack — a crash between the two would leave the
      // delivery recorded but unacked, which is the honest signal.
      received.push(msg);
      cb();
    },
  });
  return { consumer, received };
}

/** Total number of handler invocations across a set of tracked consumers. */
function totalReceived(tracked: ITrackedConsumer[]): number {
  return tracked.reduce((sum, t) => sum + t.received.length, 0);
}

/** All message IDs seen across a set of tracked consumers, in order. */
function allReceivedIds(tracked: ITrackedConsumer[]): string[] {
  return tracked.flatMap((t) => t.received.map((m) => m.id));
}

/**
 * Start every consumer in a set and return when all are running.
 *
 * `Promise.all` here is safe — the consumers are independent, and starting
 * them concurrently (rather than sequentially) is both faster and a more
 * realistic simulation of the "many consumers race for one message"
 * scenario the test is designed to exercise.
 */
async function runAll(tracked: ITrackedConsumer[]): Promise<void> {
  await Promise.all(tracked.map((t) => t.consumer.run()));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Multiple consumers on the same queue', () => {
  // -------------------------------------------------------------------------
  // Point-to-point delivery
  // -------------------------------------------------------------------------

  describe('point-to-point delivery', () => {
    it('delivers a single message to exactly one consumer', async () => {
      const queue = uniqueQueue('one-message');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Three consumers is enough to make "deliver to the first consumer
      // only" coincidentally correct at most one time in three, so a
      // regression that always picks the first consumer can't hide.
      const tracked = await Promise.all([
        createTrackedConsumer(queue),
        createTrackedConsumer(queue),
        createTrackedConsumer(queue),
      ]);

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('only-once'),
      );

      await runAll(tracked);

      // Positive assertion: the message is eventually delivered.
      await waitFor(() => totalReceived(tracked) >= 1, {
        timeoutMs: 10_000,
        description: 'at least one consumer received the message',
      });

      // Negative assertion: no *second* consumer received it. The window
      // is short because RedisSMQ's atomic checkout leaves no room
      // for a legitimate second delivery — any second delivery is a bug,
      // and catching it 500ms after the first is more than enough time
      // for it to appear.
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(totalReceived(tracked)).toBe(1);

      // Exactly one consumer has a non-empty received array.
      const receivers = tracked.filter((t) => t.received.length > 0);
      expect(receivers).toHaveLength(1);
      expect(receivers[0].received).toHaveLength(1);
    });

    it('distributes many messages across consumers without duplication', async () => {
      const queue = uniqueQueue('many-messages');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const tracked = await Promise.all([
        createTrackedConsumer(queue),
        createTrackedConsumer(queue),
        createTrackedConsumer(queue),
      ]);

      const producer = await startProducer();

      // Produce nine messages. The exact per-consumer distribution is
      // unspecified — one consumer might process all nine, or the load
      // might split unevenly — so we assert on the total and on
      // uniqueness, not on fairness.
      const producedIds: string[] = [];
      for (let i = 0; i < 9; i += 1) {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ seq: i }),
        );
        producedIds.push(id);
      }

      await runAll(tracked);

      // Wait for all nine to be delivered. `totalReceived` counts handler
      // invocations, so if a message were somehow delivered twice and
      // another zero times, this wait would resolve at 9 while the set of
      // unique IDs was short by one — the assertions below catch that.
      await waitFor(() => totalReceived(tracked) >= 9, {
        timeoutMs: 15_000,
        description: 'all nine messages delivered',
      });

      // Settle window — catches a late duplicate delivery.
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Total handler invocations must be exactly nine. Not more (which
      // would mean a duplicate delivery), not fewer (which would mean a
      // lost message).
      expect(totalReceived(tracked)).toBe(9);

      // Every produced message ID was delivered exactly once.
      const receivedIds = allReceivedIds(tracked);
      expect(receivedIds.sort()).toEqual([...producedIds].sort());

      // The two checks above are complementary. The first says "no extra
      // deliveries"; the second says "every expected delivery happened and
      // no expected one is missing". Asserting both is what makes the
      // test pin "exactly once" rather than "at least once, at most once
      // in aggregate".
    });
  });

  // -------------------------------------------------------------------------
  // Isolation
  // -------------------------------------------------------------------------

  describe('isolation', () => {
    it('consumers on other queues do not receive messages from this queue', async () => {
      // Two queues, one consumer on each. Produce to the first queue only.
      // The consumer on the second queue must observe zero deliveries.
      //
      // This is a routing-isolation check: it catches a bug where a
      // consumer accidentally subscribes to more than the queue it was
      // registered on — for instance, if the registration key were the
      // namespace only, or if the runner's polling were misconfigured.
      const targetQueue = uniqueQueue('target');
      const bystanderQueue = uniqueQueue('bystander');
      await createQueue(targetQueue, EQueueType.FIFO_QUEUE);
      await createQueue(bystanderQueue, EQueueType.FIFO_QUEUE);

      const targetConsumer = await createTrackedConsumer(targetQueue);
      const bystanderConsumer = await createTrackedConsumer(bystanderQueue);

      const producer = await startProducer();
      const [targetMessageId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(targetQueue)
          .setBody('to-target'),
      );

      await Promise.all([
        targetConsumer.consumer.run(),
        bystanderConsumer.consumer.run(),
      ]);

      // Wait for the target consumer to receive its message, then a
      // settle window for any stray delivery on the bystander.
      await waitFor(() => targetConsumer.received.length === 1, {
        timeoutMs: 10_000,
        description: 'target consumer received its message',
      });
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Target consumer received exactly the produced message.
      expect(targetConsumer.received).toHaveLength(1);
      expect(targetConsumer.received[0].id).toBe(targetMessageId);

      // Bystander consumer received nothing. A single stray delivery here
      // would mean RedisSMQ routed a message to a queue it was not
      // addressed to.
      expect(bystanderConsumer.received).toHaveLength(0);
    });
  });
});
