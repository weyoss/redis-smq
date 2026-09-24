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
  EQueueDeliveryModel,
  EQueueType,
  errors,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { getGroupIds, waitForGroupIds } from '../../helpers/pub-sub/groups.js';

/**
 * Integration tests for the precondition that blocks consumer group
 * deletion.
 *
 * A consumer group can be deleted through the consumer-groups manager:
 *
 *   `consumerGroups.deleteConsumerGroup(queue, groupId)`
 *
 * The operation refuses if the group still has at least one registered
 * consumer. RedisSMQ reports the refusal with
 * `ConsumerGroupHasActiveConsumersError`.
 *
 * WHY THE PRECONDITION EXISTS:
 *
 *   A consumer group is a routing target — every message produced to a
 *   PUB_SUB queue is delivered once per group. Deleting a group while a
 *   consumer is still registered under it would leave the consumer
 *   polling a destination that no longer receives messages: a silent
 *   stop of the consumer's work with no error surfaced at the consumer
 *   site. The precondition forces the caller to shut the consumer down
 *   first, converting the silent failure into an explicit one.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IPubSubFixture {
  queue: IQueueParams;
  consumerGroups: ReturnType<typeof RedisSMQ.createConsumerGroupsManager>;
}

/**
 * Create a fresh PUB_SUB queue and return it along with a
 * consumer-groups manager handle.
 */
async function makeFixture(prefix: string): Promise<IPubSubFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue, EQueueType.FIFO_QUEUE, EQueueDeliveryModel.PUB_SUB);

  return {
    queue,
    consumerGroups: RedisSMQ.createConsumerGroupsManager(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — consumer group delete blockers', () => {
  // -------------------------------------------------------------------------
  // Blocked delete
  // -------------------------------------------------------------------------

  describe('with an active consumer', () => {
    it('rejects with ConsumerGroupHasActiveConsumersError', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'pubsub-delete-blocked',
      );

      const groupId = 'blocking-group';
      await consumerGroups.saveConsumerGroup(queue, groupId);

      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumer.run();

      // Wait for the consumer's registration to reach Redis. The
      // delete's precondition reads that registration, and the
      // `run()` promise resolving does not guarantee the write has
      // landed.
      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length > 0,
        {
          timeoutMs: 5000,
          description: 'consumer registered on the queue',
        },
      );

      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).rejects.toThrow(errors.ConsumerGroupHasActiveConsumersError);

      // The group survived the rejected delete. A regression where the
      // framework removed the group before checking the precondition —
      // leaving a registered consumer with no group to deliver to —
      // would be caught by this read.
      const groups = await getGroupIds(queue);
      expect(groups).toContain(groupId);
    });

    it('rejects when any consumer is registered, even if another has been shut down', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'pubsub-delete-partial',
      );

      const groupId = 'partial-blocking-group';
      await consumerGroups.saveConsumerGroup(queue, groupId);

      const consumerA = createBareConsumer();
      await consumerA.consume(
        { queueParams: queue, groupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumerA.run();

      const consumerB = createBareConsumer();
      await consumerB.consume(
        { queueParams: queue, groupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumerB.run();

      // Wait for both registrations.
      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length === 2,
        {
          timeoutMs: 5000,
          description: 'both consumers registered on the queue',
        },
      );

      // Shut one consumer down.
      await consumerA.shutdown();

      // Wait for its deregistration to reach Redis.
      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length === 1,
        {
          timeoutMs: 5000,
          description: 'one consumer deregistered',
        },
      );

      // The delete still refuses.
      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).rejects.toThrow(errors.ConsumerGroupHasActiveConsumersError);

      // The group is intact.
      expect(await getGroupIds(queue)).toContain(groupId);

      await consumerB.shutdown();
    });
  });

  // -------------------------------------------------------------------------
  // Successful delete after the blocker is resolved
  // -------------------------------------------------------------------------

  describe('after the blocker is resolved', () => {
    it('succeeds once the consumer is shut down', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'pubsub-delete-recovery',
      );

      const groupId = 'recovery-group';
      await consumerGroups.saveConsumerGroup(queue, groupId);

      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumer.run();

      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length > 0,
        {
          timeoutMs: 5000,
          description: 'consumer registered on the queue',
        },
      );

      // First attempt: blocked.
      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).rejects.toThrow(errors.ConsumerGroupHasActiveConsumersError);

      // Shut the consumer down and wait for its deregistration.
      await consumer.shutdown();

      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length === 0,
        {
          timeoutMs: 5000,
          description: 'consumer deregistered',
        },
      );

      // Second attempt: succeeds.
      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).resolves.toBeUndefined();

      // The group is gone from the queue's group list.
      await waitForGroupIds(
        queue,
        (groups) => !groups.includes(groupId),
        `group ${groupId} removed from the queue`,
      );

      expect(await getGroupIds(queue)).not.toContain(groupId);
    });

    it('succeeds once the consumer cancels the queue', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'pubsub-delete-cancel',
      );

      const groupId = 'cancel-recovery-group';
      await consumerGroups.saveConsumerGroup(queue, groupId);

      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumer.run();

      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length > 0,
        {
          timeoutMs: 5000,
          description: 'consumer registered on the queue',
        },
      );

      // First attempt: blocked.
      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).rejects.toThrow(errors.ConsumerGroupHasActiveConsumersError);

      // Cancel the queue instead of shutting the consumer down.
      await consumer.cancel(queue);

      await waitFor(
        async () =>
          Object.keys(await RedisSMQ.createQueueManager().getConsumers(queue))
            .length === 0,
        {
          timeoutMs: 5000,
          description: 'consumer deregistered after cancel',
        },
      );

      // Second attempt: succeeds.
      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).resolves.toBeUndefined();

      await waitForGroupIds(
        queue,
        (groups) => !groups.includes(groupId),
        `group ${groupId} removed after cancel`,
      );

      // The consumer itself is still alive — cancel removed its
      // handler for the queue, not the consumer. A regression where
      // cancel shut the consumer down would leave `isUp()` false.
      expect(consumer.isUp()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Deleting a group with no consumers
  // -------------------------------------------------------------------------

  describe('with no consumers', () => {
    it('succeeds immediately when the group has no registered consumers', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'pubsub-delete-empty',
      );

      const groupId = 'empty-group';
      await consumerGroups.saveConsumerGroup(queue, groupId);

      await expect(
        consumerGroups.deleteConsumerGroup(queue, groupId),
      ).resolves.toBeUndefined();

      await waitForGroupIds(
        queue,
        (groups) => !groups.includes(groupId),
        `group ${groupId} removed from the queue`,
      );

      expect(await getGroupIds(queue)).not.toContain(groupId);
    });
  });
});
