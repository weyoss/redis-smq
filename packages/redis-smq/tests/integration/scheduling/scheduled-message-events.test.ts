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
  EQueueDeliveryModel,
  EQueueType,
  RedisSMQ,
  type TRedisSMQEvent,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { startScheduleWorker } from '../../helpers/workers/schedule-worker.js';

/**
 * Integration tests for the producer/scheduler event taxonomy around
 * scheduled messages.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupCapture<K extends keyof TRedisSMQEvent>(
  event: K,
): Promise<{
  captured: Array<Parameters<TRedisSMQEvent[K]>>;
  cleanup: () => void;
}> {
  const bus = await getEventBus();
  const captured: Array<Parameters<TRedisSMQEvent[K]>> = [];

  const handler = ((...args: Parameters<TRedisSMQEvent[K]>) => {
    captured.push(args);
  }) as TRedisSMQEvent[K];

  bus.on(event, handler);

  return {
    captured,
    cleanup: () => bus.removeListener(event, handler),
  };
}

/**
 * Settle window for a standalone negative assertion.
 *
 * Long enough for a spurious event to arrive if one were going to —
 * the bus round-trip is well under 100 ms on a healthy connection, and
 * 500 ms gives a 5× margin for a loaded CI. Short enough that it does
 * not meaningfully extend the test.
 */
const NEGATIVE_SETTLE_MS = 500;

function settleNegative(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, NEGATIVE_SETTLE_MS));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scheduled message firing events', () => {
  // -------------------------------------------------------------------------
  // Main contract: three events across produce time and fire time
  // -------------------------------------------------------------------------

  it('emits producer.messageScheduled at produce time and scheduler.messagePublished at fire time', async () => {
    const queue = uniqueQueue('sched-events-main');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producerPublished = await setupCapture('producer.messagePublished');
    const producerScheduled = await setupCapture('producer.messageScheduled');
    const schedulerPublished = await setupCapture('scheduler.messagePublished');

    try {
      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('fired')
          .setScheduledDelay(1500),
      );

      // ── Produce-time assertions ────────────────────────────────────
      // Wait for the positive event. Once it arrives, the produce-time
      // emit tick has passed, so the negative assertion below is safe
      // without a separate settle window — a spurious sibling event
      // from the same tick would have arrived with it.
      await waitFor(() => producerScheduled.captured.length >= 1, {
        timeoutMs: 5000,
        description: `producer.messageScheduled fired for scheduled message ${id}`,
      });

      expect(
        producerPublished.captured,
        'producer.messagePublished must not fire for a scheduled message',
      ).toHaveLength(0);

      expect(
        producerScheduled.captured,
        'producer.messageScheduled must fire exactly once at produce time',
      ).toHaveLength(1);

      // Scheduler has not run yet.
      expect(
        schedulerPublished.captured,
        'scheduler.messagePublished must not fire before the scheduler runs',
      ).toHaveLength(0);

      // Payload shape.
      const [scheduledId, scheduledQueue, scheduledProducerId] =
        producerScheduled.captured[0];

      expect(scheduledId).toBe(id);
      expect(scheduledQueue).toEqual({ queueParams: queue, groupId: null });
      expect(scheduledProducerId).toBe(producer.getId());

      // ── Fire-time assertions ──────────────────────────────────────
      // Start the scheduler and wait for the message to reach PENDING.
      // Plain delay → the scheduler moves the original, so the fired
      // ID equals the original ID.
      await startScheduleWorker(queue);
      await waitForMessageStatus(id, EMessagePropertyStatus.PENDING, {
        timeoutMs: 15_000,
        description: `scheduled message ${id} reached PENDING after firing`,
      });

      // Wait for the positive event again — the fire-time round-trip
      // has not necessarily completed just because the state write
      // landed. The state write and the emit happen in the same Lua
      // callback, but the event still has to round-trip through Redis
      // pub/sub.
      await waitFor(() => schedulerPublished.captured.length >= 1, {
        timeoutMs: 5000,
        description: `scheduler.messagePublished fired for fired message ${id}`,
      });

      expect(
        schedulerPublished.captured,
        'scheduler.messagePublished must fire exactly once at fire time',
      ).toHaveLength(1);

      // Neither producer event fires at fire time. Paired with the
      // positive waitFor above — the fire-time tick is over.
      expect(
        producerPublished.captured,
        'producer.messagePublished must not fire at fire time',
      ).toHaveLength(0);

      expect(
        producerScheduled.captured,
        'producer.messageScheduled must not re-fire at fire time',
      ).toHaveLength(1);

      // Payload shape for the scheduler event.
      const [firedId, firedQueue] = schedulerPublished.captured[0];

      expect(firedId).toBe(id);
      expect(firedQueue).toEqual({ queueParams: queue, groupId: null });

      await producer.shutdown();
    } finally {
      producerPublished.cleanup();
      producerScheduled.cleanup();
      schedulerPublished.cleanup();
    }
  });

  // -------------------------------------------------------------------------
  // Symmetric negative: non-scheduled produce
  // -------------------------------------------------------------------------

  it('does not emit producer.messageScheduled for a non-scheduled produce', async () => {
    const queue = uniqueQueue('sched-events-immediate');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producerPublished = await setupCapture('producer.messagePublished');
    const producerScheduled = await setupCapture('producer.messageScheduled');

    try {
      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('immediate'),
      );

      // Wait for the positive event — the produce-time tick is over
      // once it arrives.
      await waitFor(() => producerPublished.captured.length >= 1, {
        timeoutMs: 5000,
        description: `producer.messagePublished fired for non-scheduled message ${id}`,
      });

      expect(
        producerPublished.captured,
        'producer.messagePublished must fire exactly once for a non-scheduled message',
      ).toHaveLength(1);

      expect(
        producerScheduled.captured,
        'producer.messageScheduled must not fire for a non-scheduled message',
      ).toHaveLength(0);

      expect(producerPublished.captured[0][0]).toBe(id);
      expect(producerPublished.captured[0][1]).toEqual({
        queueParams: queue,
        groupId: null,
      });
      expect(producerPublished.captured[0][2]).toBe(producer.getId());

      await producer.shutdown();
    } finally {
      producerPublished.cleanup();
      producerScheduled.cleanup();
    }
  });

  // -------------------------------------------------------------------------
  // Dead-letter at fire time
  // -------------------------------------------------------------------------

  it('does not emit scheduler.messagePublished when a scheduled message dead-letters at fire time', async () => {
    const queue = uniqueQueue('sched-events-dl');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    // Create the group the message will target at produce time. The
    // scheduler later checks `SISMEMBER` against this set; deleting
    // the group before fire turns the firing into a dead-letter.
    await RedisSMQ.createConsumerGroupsManager().saveConsumerGroup(queue, 'g1');

    const producerPublished = await setupCapture('producer.messagePublished');
    const producerScheduled = await setupCapture('producer.messageScheduled');
    const schedulerPublished = await setupCapture('scheduler.messagePublished');

    try {
      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('will-deadletter')
          .setScheduledDelay(1500),
      );

      // ── Produce-time pre-state ──────────────────────────────────────
      await waitFor(() => producerScheduled.captured.length >= 1, {
        timeoutMs: 5000,
        description: `producer.messageScheduled fired for scheduled message ${id}`,
      });

      expect(producerScheduled.captured).toHaveLength(1);
      expect(producerPublished.captured).toHaveLength(0);

      // Payload carries the group. This is what the scheduler will
      // read back at fire time to decide publish-vs-dead-letter.
      expect(producerScheduled.captured[0][1]).toEqual({
        queueParams: queue,
        groupId: 'g1',
      });

      await producer.shutdown();

      // Delete the group *before* the schedule fires. The scheduler
      // will find it missing and dead-letter the message.
      await RedisSMQ.createConsumerGroupsManager().deleteConsumerGroup(
        queue,
        'g1',
      );

      // ── Fire-time: dead-letter, not publish ────────────────────────
      await startScheduleWorker(queue);
      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 15_000,
        description:
          `scheduled message ${id} dead-lettered after its ` +
          `consumer group was deleted`,
      });

      // Settle window — no positive event to wait on here, so give
      // any spurious `scheduler.messagePublished` a chance to arrive.
      await settleNegative();

      expect(
        schedulerPublished.captured,
        'scheduler.messagePublished must not fire for a dead-lettered scheduled message',
      ).toHaveLength(0);

      // Producer events are unchanged from the produce-time state.
      expect(producerPublished.captured).toHaveLength(0);
      expect(producerScheduled.captured).toHaveLength(1);
    } finally {
      producerPublished.cleanup();
      producerScheduled.cleanup();
      schedulerPublished.cleanup();
    }
  });
});
