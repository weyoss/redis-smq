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
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the `MessageState` fields RedisSMQ
 * populates as a message moves through its lifecycle.
 *
 * `MessageState` is the persistent record of what happened to a
 * message: when it was published, when processing began, how many times
 * it was checked out, when it was acknowledged or dead-lettered. It is
 * distinct from `EMessagePropertyStatus` — the state carries history,
 * the status is the current pipeline position. A message can have
 * `attempts: 3` with status `DEAD_LETTERED`, or `attempts: 1` with
 * status `ACKNOWLEDGED`; the two fields describe different things and
 * are asserted separately.
 *
 * TWO ACCESSORS:
 *
 *   - `messageManager.getMessageById(id)` returns the full transferable
 *     message: the producible-message fields, the destination, and the
 *     state nested under `messageState`.
 *
 *   - `messageManager.getMessageState(id)` returns just the state
 *     object, without the surrounding message.
 *
 *   The state values are identical between the two. The tests below use
 *   `getMessageById` (the richer accessor) but assert on the shape that
 *   both return, so a regression in one path is caught by the same
 *   expectation.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message state', () => {
  // -------------------------------------------------------------------------
  // Before any delivery
  // -------------------------------------------------------------------------

  describe('before delivery (PENDING)', () => {
    it('has publishedAt set and checkout timestamps null', async () => {
      const queue = uniqueQueue('state-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('initial-state'),
      );

      const message = await RedisSMQ.createMessageManager().getMessageById(id);

      // Published at produce time.
      expect(typeof message.messageState.publishedAt).toBe('number');
      expect(message.messageState.publishedAt).toBeGreaterThan(0);

      // Not yet checked out.
      expect(message.messageState.processingStartedAt).toBeNull();
      expect(message.messageState.lastProcessedAt).toBeNull();
      expect(message.messageState.attempts).toBe(0);

      // Not yet terminated in any way.
      expect(message.messageState.acknowledgedAt).toBeNull();
      expect(message.messageState.deadLetteredAt).toBeNull();
      expect(message.messageState.expired).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // After a single delivery
  // -------------------------------------------------------------------------

  describe('after a single delivery (ACKNOWLEDGED)', () => {
    it('sets processingStartedAt and lastProcessedAt to the same value', async () => {
      const queue = uniqueQueue('state-acked');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('single-delivery'),
      );

      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;

      const message = await RedisSMQ.createMessageManager().getMessageById(id);

      expect(message.messageState.processingStartedAt).toEqual(
        message.messageState.lastProcessedAt,
      );
      expect(message.messageState.processingStartedAt).toBeGreaterThan(0);

      // The ack timestamp is set and is at least as recent as the
      // checkout timestamp. RedisSMQ does not guarantee strict
      // ordering if the system clock is adjusted, but under normal
      // operation the ack happens after the checkout.
      expect(typeof message.messageState.acknowledgedAt).toBe('number');
      expect(message.messageState.acknowledgedAt).toBeGreaterThanOrEqual(
        message.messageState.processingStartedAt!,
      );

      // One checkout, one ack. The counter is RedisSMQ's record
      // of how many times the message was processed.
      expect(message.messageState.attempts).toBe(1);

      // Terminal state confirmation — status matches what the state
      // describes.
      expect(message.status).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
    });

    it('returns the same state via getMessageState and getMessageById', async () => {
      const queue = uniqueQueue('state-accessors');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('accessor-consistency'),
      );

      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;

      const manager = RedisSMQ.createMessageManager();
      const viaById = await manager.getMessageById(id);
      const viaState = await manager.getMessageState(id);

      // `viaState` is a `MessageState` or a plain object; the values
      // it carries should match the state embedded in the message
      // returned by `getMessageById`.
      expect(viaState.publishedAt).toBe(viaById.messageState.publishedAt);
      expect(viaState.processingStartedAt).toBe(
        viaById.messageState.processingStartedAt,
      );
      expect(viaState.lastProcessedAt).toBe(
        viaById.messageState.lastProcessedAt,
      );
      expect(viaState.acknowledgedAt).toBe(viaById.messageState.acknowledgedAt);
      expect(viaState.attempts).toBe(viaById.messageState.attempts);
    });
  });

  // -------------------------------------------------------------------------
  // After multiple deliveries
  // -------------------------------------------------------------------------

  describe('after multiple deliveries', () => {
    it('increments attempts with each checkout', async () => {
      const queue = uniqueQueue('state-multi');
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

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('multi-delivery')
          .setRetryThreshold(3)
          .setRetryDelay(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 15_000,
        description: `message ${id} acknowledged after one retry`,
      });

      const message = await RedisSMQ.createMessageManager().getMessageById(id);

      // Both views agree on the count.
      expect(callCount).toBe(2);
      expect(message.messageState.attempts).toBe(2);

      // The two checkout timestamps are set. Whether they are equal or
      // ordered depends on whether RedisSMQ updates both on every
      // checkout or only updates `processingStartedAt` on the first —
      // both are valid implementations. The test only requires that
      // both are non-null after a delivery.
      expect(typeof message.messageState.processingStartedAt).toBe('number');
      expect(typeof message.messageState.lastProcessedAt).toBe('number');

      // The final status is ACKNOWLEDGED — the second delivery
      // succeeded.
      expect(message.status).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
      expect(message.messageState.acknowledgedAt).not.toBeNull();
    });
  });
});
