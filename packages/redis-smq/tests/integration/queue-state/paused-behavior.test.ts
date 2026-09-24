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
  EQueueOperationalState,
  EQueueType,
  errors,
  EStateTransitionReason,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the behavioral consequences of a PAUSED queue.
 *
 * PAUSED is the queue state that reduces throughput to zero without
 * taking the queue fully offline. RedisSMQ's contract for the
 * state is asymmetric:
 *
 *   - **Producing is allowed.** New messages can be enqueued and land
 *     in the pending list as usual. A caller who needs to stop
 *     processing but continue collecting work uses PAUSED for exactly
 *     this reason.
 *
 *   - **Consuming is not allowed.** A consumer cannot register a
 *     handler for a paused queue — the `_validateOperation` check that
 *     runs during `consume()` rejects with `QueuePausedError`. And a
 *     consumer that was already registered when the queue was paused
 *     stops taking messages (covered in `consumer-reaction.test.ts`).
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Behavior of a paused queue', () => {
  // -------------------------------------------------------------------------
  // Producing
  // -------------------------------------------------------------------------

  describe('producing', () => {
    it('accepts messages and records them as pending', async () => {
      const queue = uniqueQueue('paused-produce');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Confirm the state before the produce, so a bug in the setup
      // would surface here rather than as a confusing produce failure.
      const queueManager = RedisSMQ.createQueueManager();
      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.PAUSED);

      const producer = await startProducer();
      const [messageId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('produced-while-paused'),
      );

      // The message exists and is in the pending state. Nothing has
      // consumed it — no consumer is running — so it sits in the list
      // waiting for the queue to resume.
      expect(typeof messageId).toBe('string');
      expect(messageId.length).toBeGreaterThan(0);

      await waitForMessageStatus(messageId, EMessagePropertyStatus.PENDING, {
        timeoutMs: 5000,
        description: `message ${messageId} reached PENDING`,
      });

      // The metrics reflect the message as pending, not scheduled or
      // dead-lettered.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 1,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });
    });

    it('preserves messages produced during the pause for delivery after resume', async () => {
      const queue = uniqueQueue('paused-produce-then-resume');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const producer = await startProducer();
      const [messageId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('produced-then-delivered'),
      );

      // Confirm the message is pending while the queue is paused.
      await waitForMessageStatus(messageId, EMessagePropertyStatus.PENDING, {
        timeoutMs: 5000,
        description: `message ${messageId} reached PENDING during pause`,
      });

      // Resume.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Register a consumer and run it. The message is delivered
      // normally; RedisSMQ does not treat it as "stale" or
      // "produced under different conditions."
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const acked = untilMessageAcknowledged(consumer, messageId);

      await consumer.run();
      await acked;

      await waitForMessageStatus(
        messageId,
        EMessagePropertyStatus.ACKNOWLEDGED,
        {
          timeoutMs: 5000,
          description: `message ${messageId} acknowledged after resume`,
        },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Consuming
  // -------------------------------------------------------------------------

  describe('consuming', () => {
    it('rejects a consumer registration with QueuePausedError', async () => {
      const queue = uniqueQueue('paused-consume-rejected');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueuePausedError);

      // A rejected registration must leave no trace in the consumer's
      // handler set. A regression that added the config before running
      // validation would leave the queue present in `getQueues()`.
      expect(consumer.getQueues()).toEqual([]);
    });

    it('accepts the same registration after the queue is resumed', async () => {
      const queue = uniqueQueue('paused-resume-consumer');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      // Pause, then attempt a registration that will be rejected.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueuePausedError);

      // Resume, then retry the registration with the same consumer.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // The same registration now succeeds. The handler set reflects
      // the newly-registered queue.
      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).resolves.toBeUndefined();

      expect(
        consumer.getQueues().map((entry) => entry.queueParams),
      ).toContainEqual(queue);
    });
  });
});
