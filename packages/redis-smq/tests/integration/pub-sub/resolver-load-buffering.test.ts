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
  EQueueDeliveryModel,
  EQueueType,
  type IProducer,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the `PubSubTargetResolver`'s initial-load
 * buffering.
 *
 * The resolver is the producer-side component that caches, per PUB_SUB
 * queue, the set of consumer groups that messages should be delivered
 * to. It is populated on startup by reading the queues and their
 * groups from Redis, and it is kept up to date by subscribing to
 * `queue.consumerGroupCreated` and `queue.consumerGroupDeleted`
 * events.
 *
 * The buffering contract exists to close a specific race: an event can
 * fire while the resolver is still reading the initial state. Without
 * buffering, an event that arrives during the load would be applied
 * to a partially-populated cache and could be lost (if the entry
 * doesn't exist yet) or overwritten (if the load's own read for the
 * same queue completes afterwards with a stale snapshot).
 *
 * The resolver's implementation handles this by:
 *
 *   1. Setting `initialLoadInProgress = true` before the first read.
 *   2. Recording every group event in `bufferedEvents` while the flag
 *      is set.
 *   3. Clearing the flag once the load completes.
 *   4. Replaying the buffered events against the settled cache.
 *
 * The tests below verify the mechanism by poking at the resolver's
 * internals — there is no public API that exposes "an event arrived
 * during the load", and the window is too short to trigger reliably
 * from a real concurrent write.
 */

// ---------------------------------------------------------------------------
// White-box interface
// ---------------------------------------------------------------------------

/**
 * The subset of the resolver's surface this file needs.
 *
 * The interface is deliberately narrow: only the fields and methods
 * the tests exercise are declared. A future change to the resolver
 * that renames or removes one of them fails to compile here, and the
 * failure message names the specific accessor that changed.
 *
 * The resolver's public method `resolveTargets` returns a
 * `{ isPubSub, targets }` object. The tests use it to observe the
 * cache's settled state.
 */
interface IResolverInternals {
  initialLoadInProgress: boolean;
  bufferedEvents: Array<{ type: string }>;
  pubSubTargets: Record<string, string[] | undefined>;
  onConsumerGroupCreated(queue: IQueueParams, groupId: string): void;
  onConsumerGroupDeleted(queue: IQueueParams, groupId: string): void;
  replayBufferedEvents(): void;
  resolveTargets(queue: IQueueParams): {
    isPubSub: boolean;
    targets: string[];
  };
}

/**
 * Access a producer's `pubSubTargetResolver` via the private field.
 *
 * The `pubSubTargetResolver` is protected state — the producer's
 * public API does not expose it. The cast here is the same one used
 * in `producer-resolver-failure.test.ts`.
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
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — resolver initial-load buffering', () => {
  // -------------------------------------------------------------------------
  // groupCreated during the load
  // -------------------------------------------------------------------------

  it('buffers a consumerGroupCreated event that arrives during the load and replays it', async () => {
    const queue = uniqueQueue('resolver-buffer-created');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const groupA = 'group-a';
    const groupB = 'group-b';

    // Create the queue's initial group. The resolver's real load has
    // already run by the time the producer's `run()` resolves, so the
    // cache already knows about groupA.
    await RedisSMQ.createConsumerGroupsManager().saveConsumerGroup(
      queue,
      groupA,
    );

    const producer = RedisSMQ.createProducer();
    await producer.run();

    const resolver = getResolver(producer);

    // Sanity: the resolver's cache has the queue and its initial
    // group. Without this, the test would not be exercising the
    // buffering window against a realistic pre-state.
    const initial = resolver.resolveTargets(queue);
    expect(initial.isPubSub).toBe(true);
    expect(initial.targets).toContain(groupA);

    // Simulate the buffering window. The real load runs once per
    // producer start; the resolver's `initialLoadInProgress` flag is
    // false by the time `run()` resolves. The test re-enters the
    // buffering state to exercise the code path.
    resolver.initialLoadInProgress = true;
    resolver.bufferedEvents = [];

    // Act: a group is created on another process; the event arrives
    // while the resolver is (pretending to be) loading.
    resolver.onConsumerGroupCreated(queue, groupB);

    // The event was recorded, not applied.
    expect(resolver.bufferedEvents).toHaveLength(1);
    expect(resolver.bufferedEvents[0]).toMatchObject({
      type: 'groupCreated',
      groupId: groupB,
    });

    // Simulate the load's own read for the queue completing with a
    // stale snapshot — one that does not include groupB. Without the
    // buffering, this write would be the resolver's final state and
    // groupB would be lost.
    const queueKey = `${queue.name}@${queue.ns}`;
    resolver.pubSubTargets[queueKey] = [groupA];

    // Simulate the load completing: clear the flag, then replay.
    resolver.initialLoadInProgress = false;
    resolver.replayBufferedEvents();

    // The buffered event was applied. The cache now has both groups.
    const after = resolver.resolveTargets(queue);
    expect(after.isPubSub).toBe(true);
    expect(after.targets).toContain(groupA);
    expect(after.targets).toContain(groupB);

    // The buffer was drained.
    expect(resolver.bufferedEvents).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // groupDeleted during the load
  // -------------------------------------------------------------------------

  it('buffers a consumerGroupDeleted event that arrives during the load and replays it', async () => {
    const queue = uniqueQueue('resolver-buffer-deleted');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const groupA = 'group-a';
    const groupB = 'group-b';

    const consumerGroups = RedisSMQ.createConsumerGroupsManager();
    await consumerGroups.saveConsumerGroup(queue, groupA);
    await consumerGroups.saveConsumerGroup(queue, groupB);

    const producer = RedisSMQ.createProducer();
    await producer.run();

    const resolver = getResolver(producer);

    // Sanity: the resolver's cache has both groups.
    const initial = resolver.resolveTargets(queue);
    expect(initial.isPubSub).toBe(true);
    expect(initial.targets).toContain(groupA);
    expect(initial.targets).toContain(groupB);

    // Enter the buffering window.
    resolver.initialLoadInProgress = true;
    resolver.bufferedEvents = [];

    // Act: a group is deleted on another process.
    resolver.onConsumerGroupDeleted(queue, groupB);

    // The event was recorded.
    expect(resolver.bufferedEvents).toHaveLength(1);
    expect(resolver.bufferedEvents[0]).toMatchObject({
      type: 'groupDeleted',
      groupId: groupB,
    });

    // Simulate the load's read returning a stale snapshot that still
    // includes groupB — the state that would persist without the
    // replay.
    const queueKey = `${queue.name}@${queue.ns}`;
    resolver.pubSubTargets[queueKey] = [groupA, groupB];

    // Complete the load.
    resolver.initialLoadInProgress = false;
    resolver.replayBufferedEvents();

    // groupB is gone; groupA remains.
    const after = resolver.resolveTargets(queue);
    expect(after.isPubSub).toBe(true);
    expect(after.targets).toContain(groupA);
    expect(after.targets).not.toContain(groupB);

    // The buffer is drained.
    expect(resolver.bufferedEvents).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Multiple buffered events replay in order
  // -------------------------------------------------------------------------

  it('replays multiple buffered events in arrival order', async () => {
    const queue = uniqueQueue('resolver-buffer-multiple');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const producer = RedisSMQ.createProducer();
    await producer.run();

    const resolver = getResolver(producer);

    // Enter the buffering window.
    resolver.initialLoadInProgress = true;
    resolver.bufferedEvents = [];

    // Three events in a specific order.
    resolver.onConsumerGroupCreated(queue, 'churn-group');
    resolver.onConsumerGroupDeleted(queue, 'churn-group');
    resolver.onConsumerGroupCreated(queue, 'churn-group');

    // All three are buffered, in order.
    expect(resolver.bufferedEvents).toHaveLength(3);
    expect(resolver.bufferedEvents.map((e) => e.type)).toEqual([
      'groupCreated',
      'groupDeleted',
      'groupCreated',
    ]);

    // Simulate the load's read returning an empty snapshot — the
    // queue had no groups when the load's read ran, but the three
    // events describe what happened after.
    const queueKey = `${queue.name}@${queue.ns}`;
    resolver.pubSubTargets[queueKey] = [];

    // Complete the load.
    resolver.initialLoadInProgress = false;
    resolver.replayBufferedEvents();

    // The final state reflects the ordered replay: created, deleted,
    // created → present.
    const after = resolver.resolveTargets(queue);
    expect(after.isPubSub).toBe(true);
    expect(after.targets).toEqual(['churn-group']);

    // The buffer is drained.
    expect(resolver.bufferedEvents).toHaveLength(0);
  });
});
