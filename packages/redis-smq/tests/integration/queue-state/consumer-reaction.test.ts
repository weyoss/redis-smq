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
  EStateTransitionReason,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { produceOne } from '../../helpers/factories/message.js';

/**
 * Integration tests for a running consumer's reaction to its queue
 * being paused or stopped.
 *
 * When a queue transitions to `PAUSED`, `STOPPED`, or `LOCKED`, the
 * framework's `MessageHandlerRunner` — which owns the live handler
 * instances for a consumer — reacts by stopping the handler attached
 * to that queue. The consumer instance itself survives; only the
 * per-queue handler is shut down.
 *
 * The observable consequences are:
 *
 *   - `consumer.getQueuesWithStatus()` reports the queue's status as
 *     `'stopped'` rather than `'active'`.
 *
 *   - The handler's `goingDown` chain calls `_unsubscribeConsumer`,
 *     which removes the consumer's registration from Redis. The
 *     `queueManager.getConsumers(queue)` view reflects this.
 *
 *   - The consumer's *configuration* survives. `consumer.getQueues()`
 *     still returns the queue, because the runner's registry keeps the
 *     config entry. This is what allows the handler to restart when the
 *     queue returns to `ACTIVE`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for RedisSMQ's state-change propagation.
 *
 * The chain is: state write → event publish → runner reacts → handler
 * `goingDown` (which includes a Redis call to deregister the consumer).
 * On a quiet machine this is a few hundred milliseconds; the timeout
 * is generous for a loaded CI.
 */
const STATE_PROPAGATION_TIMEOUT_MS = 10_000;

/**
 * Interval to wait before asserting a negative claim — that nothing
 * has happened. The window gives a hypothetical mis-behavior enough
 * time to surface, then the assertion checks that it did not.
 */
const NEGATIVE_ASSERTION_SETTLE_MS = 2_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait until the consumer reports every one of its queues in the
 * given status.
 *
 * The consumer's status view is in-memory and flips at the point the
 * handler instance stops being operational. It is the cheaper of the
 * two views the tests consult — `getConsumers()` requires a Redis
 * round-trip — so it is the natural wait predicate.
 */
async function waitForConsumerStatus(
  consumer: Awaited<ReturnType<typeof getConsumer>>,
  status: 'active' | 'stopped',
): Promise<void> {
  await waitFor(
    () => consumer.getQueuesWithStatus().every((q) => q.status === status),
    {
      timeoutMs: STATE_PROPAGATION_TIMEOUT_MS,
      description: `consumer reports every queue as '${status}'`,
    },
  );
}

/**
 * Wait until the queue manager's Redis-side view of the queue no
 * longer includes the consumer.
 *
 * This is the second view of the same fact the consumer's in-memory
 * status reports. It is polled rather than read once because the
 * Redis write that removes the registration happens at the end of the
 * handler's `goingDown` chain, which may complete slightly after the
 * in-memory status flips.
 */
async function waitForConsumerDeregistration(
  queue: ReturnType<typeof uniqueQueue>,
  consumerId: string,
): Promise<void> {
  const queueManager = RedisSMQ.createQueueManager();
  await waitFor(
    async () =>
      !Object.keys(await queueManager.getConsumers(queue)).includes(consumerId),
    {
      timeoutMs: STATE_PROPAGATION_TIMEOUT_MS,
      description: 'consumer deregistered from Redis',
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consumer reaction to queue state changes', () => {
  // -------------------------------------------------------------------------
  // Pause
  // -------------------------------------------------------------------------

  describe('pausing the queue', () => {
    it('stops the running handler and deregisters the consumer from Redis', async () => {
      const queue = uniqueQueue('reaction-pause');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();

      // Pre-state: the handler is running. Establishing this baseline
      // is what makes the post-pause assertions meaningful — a
      // regression in the consumer's startup would otherwise leave the
      // test observing an already-stopped consumer.
      await waitForConsumerStatus(consumer, 'active');

      const queueManager = RedisSMQ.createQueueManager();
      expect(Object.keys(await queueManager.getConsumers(queue))).toContain(
        consumer.getId(),
      );

      // Pause the queue.
      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Wait for the in-memory status to flip. This is the primary
      // contract of the test.
      await waitForConsumerStatus(consumer, 'stopped');

      // Confirm the Redis-side view. Polling rather than reading once
      // because the deregistration is the last step of the handler's
      // `goingDown` chain and may lag the in-memory flip by a few
      // milliseconds.
      await waitForConsumerDeregistration(queue, consumer.getId());

      // The consumer's *configuration* survives. `getQueues()` reads
      // from the runner's registry, which retains the config entry so
      // the handler can restart on resume. Asserting this here pins
      // the distinction between "registered in Redis" (gone) and
      // "still configured" (present).
      expect(
        consumer.getQueues().map((entry) => entry.queueParams),
      ).toContainEqual(queue);
    });

    it('does not deliver a message produced after the pause', async () => {
      const queue = uniqueQueue('reaction-pause-no-delivery');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let handlerCalls = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          handlerCalls += 1;
          cb();
        },
      });

      await consumer.run();
      await waitForConsumerStatus(consumer, 'active');

      // Pause the queue and wait for the handler to stop.
      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });
      await waitForConsumerStatus(consumer, 'stopped');

      // Produce a message. It sits in the pending list; RedisSMQ
      // does not deliver it while the queue is paused.
      const id = await produceOne(queue, 'produced-during-pause');

      // Settle window: the handler for this queue is offline, but give
      // a hypothetical mis-delivery enough time to surface.
      await new Promise((resolve) =>
        setTimeout(resolve, NEGATIVE_ASSERTION_SETTLE_MS),
      );

      // The primary negative assertion.
      expect(
        handlerCalls,
        'handler was invoked while the queue was paused',
      ).toBe(0);

      // The state-level confirmation: the message did not reach
      // ACKNOWLEDGED, the state a successful delivery produces.
      const finalStatus =
        await RedisSMQ.createMessageManager().getMessageStatus(id);
      expect(
        finalStatus,
        'message reached ACKNOWLEDGED without the handler being called',
      ).not.toBe(EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });

  // -------------------------------------------------------------------------
  // Stop
  // -------------------------------------------------------------------------

  describe('stopping the queue', () => {
    it('stops the running handler and deregisters the consumer from Redis', async () => {
      const queue = uniqueQueue('reaction-stop');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();
      await waitForConsumerStatus(consumer, 'active');

      const queueManager = RedisSMQ.createQueueManager();
      expect(Object.keys(await queueManager.getConsumers(queue))).toContain(
        consumer.getId(),
      );

      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      await waitForConsumerStatus(consumer, 'stopped');
      await waitForConsumerDeregistration(queue, consumer.getId());

      expect(
        consumer.getQueues().map((entry) => entry.queueParams),
      ).toContainEqual(queue);
    });
  });

  // -------------------------------------------------------------------------
  // Resume
  // -------------------------------------------------------------------------

  describe('resuming the queue', () => {
    it('restarts the handler and delivers a backlog produced during the pause', async () => {
      const queue = uniqueQueue('reaction-resume');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();
      await waitForConsumerStatus(consumer, 'active');

      // Pause and wait for the handler to stop.
      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });
      await waitForConsumerStatus(consumer, 'stopped');

      // Produce two messages. They accumulate in the pending list
      // because no handler is running to consume them.
      const id1 = await produceOne(queue, 'backlog-1');
      const id2 = await produceOne(queue, 'backlog-2');

      await waitForMessageStatus(id1, EMessagePropertyStatus.PENDING, {
        timeoutMs: 5000,
        description: `message ${id1} reached PENDING`,
      });
      await waitForMessageStatus(id2, EMessagePropertyStatus.PENDING, {
        timeoutMs: 5000,
        description: `message ${id2} reached PENDING`,
      });

      // Subscribe to the ack events BEFORE resuming. The handler
      // restarts on the state change and may deliver the messages
      // immediately, so the awaiters must be in place.
      const acked1 = untilMessageAcknowledged(consumer, id1);
      const acked2 = untilMessageAcknowledged(consumer, id2);

      // Resume.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Wait for the handler to restart. The runner creates a fresh
      // handler instance; the consumer's view of the queue status
      // returns to 'active'.
      await waitForConsumerStatus(consumer, 'active');

      // The backlog is delivered. Both messages reach ACKNOWLEDGED.
      await Promise.all([acked1, acked2]);

      await waitForMessageStatus(id1, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 5000,
        description: `message ${id1} acknowledged after resume`,
      });
      await waitForMessageStatus(id2, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 5000,
        description: `message ${id2} acknowledged after resume`,
      });

      // The pending list is empty — both messages were consumed.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });
    it('restarts the handler on every resume across repeated stop/resume cycles', async () => {
      // A single stop/resume cycle would pass even if the runner
      // removed the handler configuration on some later interaction —
      // for example, a regression that treated a second stop as a
      // permanent failure and cleaned up the config. Looping the cycle
      // forces the config to survive N−1 additional stops and still
      // produce a working handler on the final resume. The end-to-end
      // produce after the last cycle proves the surviving config is
      // functional, not merely present in the registry.
      const queue = uniqueQueue('reaction-multi-cycle');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();
      await waitForConsumerStatus(consumer, 'active');

      const stateManager = RedisSMQ.createQueueStateManager();
      const CYCLES = 3;

      for (let cycle = 0; cycle < CYCLES; cycle += 1) {
        // Stop. The handler instance is torn down; the config must
        // remain so the next resume has something to start.
        await stateManager.stop(queue, {
          reason: EStateTransitionReason.SCHEDULED,
          description: `multi-cycle stop ${cycle}`,
        });

        await waitForConsumerStatus(consumer, 'stopped');

        // The strongest assertion available at each cycle: the runner's
        // registry still holds the config. A regression that dropped it
        // after any stop would fail here on that cycle's iteration,
        // and the diagnostic names which one.
        expect(
          consumer.getQueues().map((entry) => entry.queueParams),
          `handler configuration was lost after stop ${cycle}`,
        ).toContainEqual(queue);

        // Resume. The runner's `queue.stateChanged` subscription must
        // start a fresh handler instance from the surviving config.
        await stateManager.resume(queue, {
          reason: EStateTransitionReason.MANUAL,
          description: `multi-cycle resume ${cycle}`,
        });

        await waitForConsumerStatus(consumer, 'active');
      }

      // End-to-end proof: a message produced after the final cycle is
      // consumed by the handler that started on the final resume. The
      // config survived all three cycles and is still functional — not
      // merely present in the registry.
      const id = await produceOne(queue, { after: 'multi-cycle' });

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 10_000,
        description: `message ${id} acknowledged after ${CYCLES} stop/resume cycles`,
      });
    });
  });
});
