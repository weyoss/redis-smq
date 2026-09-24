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
  type IMessageTransferable,
  type IProducer,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the producer's PUB/SUB target resolution.
 *
 * When a producer publishes a message to a PUB_SUB queue, RedisSMQ
 * resolves the queue's registered consumer groups — the *targets* —
 * and produces one copy of the message per target. Each copy is an
 * independent message with its own ID, stored in its own group's
 * pending list, and consumed independently by that group's consumers.
 *
 * The resolution happens inside the producer's `PubSubTargetResolver`,
 * which caches the group set per queue and keeps it up to date by
 * subscribing to `queue.consumerGroupCreated` and
 * `queue.consumerGroupDeleted` events. The resolver's caching and
 * buffering logic is covered in `resolver-load-buffering.test.ts`;
 * its failure path is in `producing/producer-resolver-failure.test.ts`.
 */

// ---------------------------------------------------------------------------
// White-box resolver access
// ---------------------------------------------------------------------------

/**
 * The subset of the resolver's surface the dynamic-addition test
 * needs.
 *
 * The interface is deliberately narrow: only `resolveTargets` is
 * declared, which returns the resolver's current view of a queue's
 * target set. A future change to the resolver's internals that
 * breaks this accessor fails to compile here, and the failure names
 * the specific field that changed.
 */
interface IResolverInternals {
  resolveTargets(queue: IQueueParams): {
    isPubSub: boolean;
    targets: string[];
  };
}

/**
 * Access a producer's `pubSubTargetResolver` via the private field.
 *
 * The cast through `unknown` is required because the field is
 * protected. The same pattern is used in
 * `producer-resolver-failure.test.ts` and
 * `resolver-load-buffering.test.ts`; see those files for the general
 * rationale.
 */
function getResolver(producer: IProducer): IResolverInternals {
  const resolver = (
    producer as unknown as { pubSubTargetResolver: IResolverInternals }
  ).pubSubTargetResolver;
  if (!resolver) {
    throw new Error(
      'Producer does not expose a pubSubTargetResolver. ' +
        'The internal shape of the producer has changed; this test needs updating.',
    );
  }
  return resolver;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The fan-out test's shared setup.
 *
 *   1. Save each consumer group on the queue (so the producer's
 *      resolver includes them at startup).
 *   2. Start a producer (its resolver reads the group set).
 *   3. Create one consumer per group, registered on that group's
 *      explicit target (`{ queueParams, groupId }`).
 *   4. Wait for all group registrations to appear in Redis.
 *   5. Subscribe to each consumer's ack *before* producing — the
 *      subscribe-before-trigger contract.
 *   6. Produce a single message; the resolver fans out one copy per
 *      group.
 *   7. Run the consumers so they pick up their copies.
 *   8. Await every ack.
 *   9. Shut the consumers down.
 *
 * The return value is a record of the message each group's consumer
 * received, keyed by group ID.
 */
async function runFanOut(
  queue: IQueueParams,
  groupIds: string[],
): Promise<Record<string, IMessageTransferable>> {
  // 1. Save each group. The producer's resolver reads the group set
  //    at startup, so the groups must exist before `startProducer`.
  const consumerGroups = RedisSMQ.createConsumerGroupsManager();
  for (const groupId of groupIds) {
    await consumerGroups.saveConsumerGroup(queue, groupId);
  }

  // 2. Start the producer with the current group set already in Redis.
  const producer = await startProducer();

  // 3. Create one consumer per group, registered on the group's
  //    explicit target. No consumer is run yet.
  const receivedByGroup: Record<string, IMessageTransferable> = {};
  const consumers = await Promise.all(
    groupIds.map(async (groupId) => {
      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId },
        (msg: IMessageTransferable, cb: ICallback) => {
          receivedByGroup[groupId] = msg;
          cb();
        },
      );
      return { groupId, consumer };
    }),
  );

  // 4. Wait for the group registrations to be observable in Redis.
  //    This is a confirmation that `saveConsumerGroup` propagated —
  //    it does not wait for the consumers themselves, which are not
  //    running yet.
  await waitFor(
    async () => {
      const groups =
        await RedisSMQ.createConsumerGroupsManager().getConsumerGroups(queue);
      return groupIds.every((groupId) => groups.includes(groupId));
    },
    {
      timeoutMs: 5000,
      description: 'all groups registered on the queue',
    },
  );

  // 5. Subscribe to every consumer's ack before producing.
  const ackWaiters = consumers.map(({ consumer, groupId }) =>
    untilMessageAcknowledged(consumer, undefined, {
      timeoutMs: 5000,
      description: `group ${groupId} acknowledged a message`,
    }),
  );

  // 6. Produce a single message.
  await producer.produce(
    RedisSMQ.newProducibleMessage().setQueue(queue).setBody('fan-out-body'),
  );

  // 7. Run the consumers. Each polls its group's pending list and
  //    picks up the copy RedisSMQ produced for it.
  await Promise.all(consumers.map(({ consumer }) => consumer.run()));

  // 8. Await every ack.
  await Promise.all(ackWaiters);

  // 9. Shut the consumers down so no live registrations linger.
  await Promise.all(consumers.map(({ consumer }) => consumer.shutdown()));

  return receivedByGroup;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — producer targeting', () => {
  // -------------------------------------------------------------------------
  // Single group
  // -------------------------------------------------------------------------

  it('produces one copy when the queue has one group', async () => {
    // The minimal case. A PUB_SUB queue with one group produces one
    // copy, and that group's consumer receives it.
    const queue = uniqueQueue('target-single');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const received = await runFanOut(queue, ['group-a']);

    expect(Object.keys(received)).toEqual(['group-a']);
    expect(received['group-a'].body).toBe('fan-out-body');
  });

  // -------------------------------------------------------------------------
  // Multiple groups
  // -------------------------------------------------------------------------

  it('produces one copy per group when the queue has two groups', async () => {
    const queue = uniqueQueue('target-two');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const received = await runFanOut(queue, ['group-a', 'group-b']);

    expect(Object.keys(received).sort()).toEqual(['group-a', 'group-b']);
    expect(received['group-a'].body).toBe('fan-out-body');
    expect(received['group-b'].body).toBe('fan-out-body');
  });

  it('produces one copy per group when the queue has three groups', async () => {
    const queue = uniqueQueue('target-three');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const received = await runFanOut(queue, ['group-a', 'group-b', 'group-c']);

    expect(Object.keys(received).sort()).toEqual([
      'group-a',
      'group-b',
      'group-c',
    ]);
    expect(received['group-a'].body).toBe('fan-out-body');
    expect(received['group-b'].body).toBe('fan-out-body');
    expect(received['group-c'].body).toBe('fan-out-body');
  });

  // -------------------------------------------------------------------------
  // Dynamic group addition
  // -------------------------------------------------------------------------

  it('targets a group added after the producer started', async () => {
    const queue = uniqueQueue('target-dynamic-add');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    // Register group-a and create its consumer *before* the producer
    // starts, so the resolver's initial load includes it.
    const consumerGroups = RedisSMQ.createConsumerGroupsManager();
    await consumerGroups.saveConsumerGroup(queue, 'group-a');

    const producer = await startProducer();

    const receivedByGroup: Record<string, IMessageTransferable> = {};

    const consumerA = createBareConsumer();
    await consumerA.consume(
      { queueParams: queue, groupId: 'group-a' },
      (msg: IMessageTransferable, cb: ICallback) => {
        receivedByGroup['group-a'] = msg;
        cb();
      },
    );
    await consumerA.run();

    // First produce: only group-a is targeted. If the resolver
    // somehow had group-b in its cache at this point, the produce
    // would fan out to a group with no consumer — a separate bug
    // that this first phase would catch by leaving an unmatched
    // pending message.
    const firstAckA = untilMessageAcknowledged(consumerA);
    await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('first'),
    );
    await firstAckA;

    expect(receivedByGroup['group-a'].body).toBe('first');

    // Register group-b. This triggers the
    // `queue.consumerGroupCreated` event that the resolver
    // subscribes to.
    await consumerGroups.saveConsumerGroup(queue, 'group-b');

    const consumerB = createBareConsumer();
    await consumerB.consume(
      { queueParams: queue, groupId: 'group-b' },
      (msg: IMessageTransferable, cb: ICallback) => {
        receivedByGroup['group-b'] = msg;
        cb();
      },
    );
    await consumerB.run();

    // Wait for the resolver's cache to reflect the new group. The
    // predicate reads `resolveTargets(queue).targets`, which is the
    // resolver's own view; if the event has not yet been processed,
    // the group is absent and the wait continues.
    const resolver = getResolver(producer);
    await waitFor(
      () => resolver.resolveTargets(queue).targets.includes('group-b'),
      {
        timeoutMs: 5000,
        description:
          "resolver's target set includes group-b after dynamic registration",
      },
    );

    // Second produce: both groups are now targets. Each consumer
    // receives its own copy.
    const secondAckA = untilMessageAcknowledged(consumerA);
    const secondAckB = untilMessageAcknowledged(consumerB);
    await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('second'),
    );
    await Promise.all([secondAckA, secondAckB]);

    expect(receivedByGroup['group-a'].body).toBe('second');
    expect(receivedByGroup['group-b'].body).toBe('second');

    await consumerA.shutdown();
    await consumerB.shutdown();
  });

  // -------------------------------------------------------------------------
  // POINT_TO_POINT is not affected
  // -------------------------------------------------------------------------

  it('produces exactly one copy to a POINT_TO_POINT queue', async () => {
    const queue = uniqueQueue('target-ptp');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    const producer = await startProducer();
    await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('ptp-body'),
    );

    // Exactly one message in the pending list.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(1);

    // The aggregate view agrees: one pending, no other states.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 1,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });
  });
});
