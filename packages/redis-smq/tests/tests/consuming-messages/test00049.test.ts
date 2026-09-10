/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RedisSMQ,
  Producer,
  ConsumerGroups,
  EQueueType,
  EQueueDeliveryModel,
} from '../../../index.js';

const QUEUE_NAME = 'load-race-test';
const QUEUE = { name: QUEUE_NAME, ns: 'default' };
const QUEUE_KEY = `${QUEUE_NAME}@default`;

describe('PubSubTargetResolver — events during initial load', () => {
  let producer: Producer;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resolver: any;

  beforeEach(async () => {
    await RedisSMQ.createQueueManager().save(
      QUEUE_NAME,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    await new ConsumerGroups().saveConsumerGroup(QUEUE_NAME, 'g1');

    producer = new Producer();
    await producer.run();

    // @ts-expect-error Property pubSubTargetResolver is protected
    resolver = producer.pubSubTargetResolver;
    // The real load has already completed by the time run() resolves, so
    // the cache reflects Redis truth: ['g1'] for QUEUE. Tests that need to
    // simulate a load-in-progress window reset the flag and buffer first.
  });

  afterEach(async () => {
    await producer.shutdown();
    await RedisSMQ.createQueueManager().delete(QUEUE_NAME);
  });

  it('does not lose a consumerGroupCreated event fired during the initial load', () => {
    // Arrange: pretend a fresh load is in progress.
    // The real load has already populated the cache with ['g1']; we clear
    // it to simulate the moment before the load's own read for QUEUE
    // completes, which is exactly the window the buffering protects.
    resolver.initialLoadInProgress = true;
    resolver.bufferedEvents = [];
    resolver.pubSubTargets[QUEUE_KEY] = undefined;

    // Act: a group is created on another process; the event arrives while
    // the resolver is loading.
    resolver.onConsumerGroupCreated(QUEUE, 'g2');

    // The event must be buffered, not dropped.
    expect(resolver.bufferedEvents).toHaveLength(1);
    expect(resolver.bufferedEvents[0]).toMatchObject({
      type: 'groupCreated',
      groupId: 'g2',
    });

    // Simulate the load's own read for QUEUE returning a stale snapshot
    // (taken before the writer's SADD landed in Redis).
    resolver.pubSubTargets[QUEUE_KEY] = ['g1'];

    // Simulate load completion: clear the flag, then replay.
    resolver.initialLoadInProgress = false;
    resolver.replayBufferedEvents();

    // Assert: the replayed event is reflected in the cache.
    expect(resolver.resolveTargets(QUEUE)).toEqual({
      isPubSub: true,
      targets: ['g1', 'g2'],
    });

    // And the buffer is empty afterwards.
    expect(resolver.bufferedEvents).toHaveLength(0);
  });

  it('does not lose a consumerGroupDeleted event fired during the initial load', () => {
    // Arrange: pretend a fresh load is in progress and the cache already
    // has both groups (as if the load's read returned the full set).
    resolver.initialLoadInProgress = true;
    resolver.bufferedEvents = [];
    resolver.pubSubTargets[QUEUE_KEY] = ['g1', 'g2'];

    // Act: g2 is deleted on another process; the event arrives while the
    // resolver is loading.
    resolver.onConsumerGroupDeleted(QUEUE, 'g2');

    expect(resolver.bufferedEvents).toHaveLength(1);
    expect(resolver.bufferedEvents[0]).toMatchObject({
      type: 'groupDeleted',
      groupId: 'g2',
    });

    // Simulate load completion.
    resolver.initialLoadInProgress = false;
    resolver.replayBufferedEvents();

    // Assert: g2 is gone, g1 remains.
    expect(resolver.resolveTargets(QUEUE)).toEqual({
      isPubSub: true,
      targets: ['g1'],
    });
    expect(resolver.bufferedEvents).toHaveLength(0);
  });
});
