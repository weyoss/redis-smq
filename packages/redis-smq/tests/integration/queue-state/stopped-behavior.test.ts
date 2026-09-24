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
  EQueueOperationalState,
  EQueueType,
  errors,
  EStateTransitionReason,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the behavioral consequences of a STOPPED queue.
 *
 * STOPPED is the fully-offline queue state. Both directions of the
 * pipeline are blocked:
 *
 *   - **Producing is not allowed.** `producer.produce(msg)` targeting a
 *     stopped queue rejects with `QueueStoppedError`. The message is
 *     never enqueued.
 *
 *   - **Consuming is not allowed.** A consumer cannot register a
 *     handler for a stopped queue — the `_validateOperation` check that
 *     runs during `consume()` rejects with `QueueStoppedError`.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Behavior of a stopped queue', () => {
  // -------------------------------------------------------------------------
  // Producing
  // -------------------------------------------------------------------------

  describe('producing', () => {
    it('rejects a produce with QueueStoppedError', async () => {
      const queue = uniqueQueue('stopped-produce-rejected');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      // Confirm the state before the produce
      const queueManager = RedisSMQ.createQueueManager();
      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.STOPPED);

      const producer = await startProducer();

      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('produced-while-stopped'),
        ),
      ).rejects.toThrow(errors.QueueStoppedError);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      const total = await queueMessages.countMessages(queue);
      expect(total).toBe(0);
    });

    it('accepts the same produce after the queue is resumed', async () => {
      const queue = uniqueQueue('stopped-produce-resumed');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const producer = await startProducer();

      // First produce: rejected.
      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('produced-while-stopped'),
        ),
      ).rejects.toThrow(errors.QueueStoppedError);

      // Resume and try again with a fresh message.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const [messageId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('produced-after-resume'),
      );

      expect(typeof messageId).toBe('string');
      expect(messageId.length).toBeGreaterThan(0);

      // The message is in the queue. The stopped-period rejection did
      // not poison the producer for subsequent calls.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const total = await queueMessages.countMessages(queue);
      expect(total).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Consuming
  // -------------------------------------------------------------------------

  describe('consuming', () => {
    it('rejects a consumer registration with QueueStoppedError', async () => {
      const queue = uniqueQueue('stopped-consume-rejected');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueueStoppedError);

      // A rejected registration must leave no handler-set entry behind.
      expect(consumer.getQueues()).toEqual([]);
    });

    it('accepts the same registration after the queue is resumed', async () => {
      const queue = uniqueQueue('stopped-resume-consumer');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueueStoppedError);

      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).resolves.toBeUndefined();

      expect(
        consumer.getQueues().map((entry) => entry.queueParams),
      ).toContainEqual(queue);
    });

    it('delivers no messages after resume when none were produced during the stop', async () => {
      const queue = uniqueQueue('stopped-no-backlog');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      // Attempt a produce that will be rejected — establishing that
      // nothing reaches the pending list.
      const producer = await startProducer();
      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('rejected'),
        ),
      ).rejects.toThrow(errors.QueueStoppedError);

      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Register a consumer. It runs, polls, finds nothing.
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();

      // Settle window: give the consumer enough time to poll at least
      // once.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });
    });
  });
});
