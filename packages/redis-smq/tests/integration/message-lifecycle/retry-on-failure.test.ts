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
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the retry-on-failure path.
 *
 * When a handler reports a failure — via `cb(err)`, a throw, or a
 * rejected Promise — RedisSMQ consults the message's retry policy:
 *
 *   - If the attempts count is below `retryThreshold`, the message is
 *     requeued (immediately if `retryDelay` is 0, else after the delay).
 *     Another consumer delivery will follow.
 *
 *   - If the attempts count has reached `retryThreshold`, the message
 *     is dead-lettered.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Produce one message to `queue` with the given retry policy.
 *
 * Every test uses `retryDelay: 0` — the immediate-requeue branch. The
 * delayed branch is `retry-delay.test.ts`'s concern.
 */
async function produceWithRetryPolicy(
  queue: ReturnType<typeof uniqueQueue>,
  body: string,
  retryThreshold: number,
): Promise<string> {
  const producer = await startProducer();
  const [id] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody(body)
      .setRetryThreshold(retryThreshold)
      .setRetryDelay(0),
  );
  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Retry on failure', () => {
  // -------------------------------------------------------------------------
  // Within threshold
  // -------------------------------------------------------------------------

  describe('within threshold', () => {
    it('requeues the message and delivers it again when the first attempt fails', async () => {
      const queue = uniqueQueue('retry-once');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          callCount += 1;
          if (callCount === 1) {
            cb(new Error('first attempt fails'));
          } else {
            cb();
          }
        },
      });

      const id = await produceWithRetryPolicy(queue, 'retry-once', 3);

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 15_000,
        description: `message ${id} acknowledged after one retry`,
      });

      expect(callCount).toBe(2);

      // Terminal state confirmation: the message is in the acked list,
      // and nothing is pending or dead-lettered.
      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(1);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      expect(await deadLettered.countMessages(queue)).toBe(0);
    });

    it('requeues when the failure is reported asynchronously', async () => {
      const queue = uniqueQueue('retry-async');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          callCount += 1;
          if (callCount === 1) {
            // Fail on a later tick, after this function has returned.
            // The 300ms delay is long enough that RedisSMQ has
            // fully returned to the event loop; the delay is not
            // correlated with any framework timer.
            setTimeout(() => cb(new Error('async failure')), 300);
          } else {
            cb();
          }
        },
      });

      const id = await produceWithRetryPolicy(queue, 'retry-async', 3);

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 15_000,
        description: `message ${id} acknowledged after async failure and retry`,
      });

      expect(callCount).toBe(2);
    });

    it('attempts counter increments with each delivery', async () => {
      const queue = uniqueQueue('retry-attempts');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          callCount += 1;
          if (callCount === 1) {
            cb(new Error('first attempt fails'));
          } else {
            cb();
          }
        },
      });

      const id = await produceWithRetryPolicy(queue, 'retry-attempts', 3);

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 15_000,
        description: `message ${id} acknowledged after one retry`,
      });

      const state = await RedisSMQ.createMessageManager().getMessageState(id);

      // Both views of the fact agree.
      expect(callCount).toBe(2);
      expect(state.attempts).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Threshold reached
  // -------------------------------------------------------------------------

  describe('threshold reached', () => {
    it('dead-letters the message when the second attempt also fails', async () => {
      const queue = uniqueQueue('retry-exhausted');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          callCount += 1;
          cb(new Error('always fails'));
        },
      });

      const id = await produceWithRetryPolicy(queue, 'retry-exhausted', 3);

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 15_000,
        description: `message ${id} dead-lettered after exhausting retries`,
      });

      // RedisSMQ delivered the message three times: three failures
      // exhausted the threshold and the third dead-lettered.
      expect(callCount).toBe(3);

      // The message reached the dead-letter list, not the acknowledged
      // list, and nothing is pending.
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);

      expect(page.totalItems).toBe(1);
      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe(id);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(0);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });
  });
});
