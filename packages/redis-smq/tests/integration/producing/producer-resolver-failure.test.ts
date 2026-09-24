/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  EQueueDeliveryModel,
  EQueueType,
  errors,
  type IProducer,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration test for the producer's response to an internal
 * `PubSubTargetResolver` failure.
 *
 * Contract under test:
 *
 *   1. A resolver error tears the producer down. `producer.down` fires,
 *      and every state predicate reflects the down state.
 *   2. Subsequent `produce()` calls reject with
 *      `ProducerNotRunningError` for both PUB/SUB and POINT_TO_POINT
 *      destinations.
 *   3. A producer that has been torn down this way can be re-run, and
 *      the re-run producer has a *fresh* resolver with a working cache.
 */

// ---------------------------------------------------------------------------
// White-box access
// ---------------------------------------------------------------------------

interface IResolverInternals {
  isOperational(): boolean;
  emit(event: 'error', error: Error): boolean;
}

/**
 * Reach into a producer instance and return its `PubSubTargetResolver`.
 *
 * The cast is required because `pubSubTargetResolver` is private. The
 * function throws with a specific message if the internal shape has
 * changed, so a refactor that renames or removes the field produces a
 * clear failure at the access site rather than a TypeError deeper in the
 * test.
 */
function getResolver(producer: IProducer): IResolverInternals {
  const resolver = (
    producer as unknown as {
      pubSubTargetResolver: IResolverInternals;
    }
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
// Fixtures
// ---------------------------------------------------------------------------

let pubSubQueue: ReturnType<typeof uniqueQueue>;
let ptpQueue: ReturnType<typeof uniqueQueue>;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Producer — PubSubTargetResolver failure', () => {
  beforeEach(async () => {
    pubSubQueue = uniqueQueue('pubsub');
    await createQueue(
      pubSubQueue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    await RedisSMQ.createConsumerGroupsManager().saveConsumerGroup(
      pubSubQueue,
      'g1',
    );

    ptpQueue = uniqueQueue('ptp');
    await createQueue(
      ptpQueue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );
  });

  // -------------------------------------------------------------------------
  // Shutdown reaction
  // -------------------------------------------------------------------------

  it('shuts the producer down when the resolver reports an error', async () => {
    const producer = await startProducer();

    // Precondition: the producer is fully running and the resolver is
    // operational. Without these, a shutdown observed later could be
    // attributed to a state that was never established.
    expect(producer.isUp()).toBe(true);
    expect(producer.isOperational()).toBe(true);

    const resolver = getResolver(producer);
    expect(resolver.isOperational()).toBe(true);

    resolver.emit('error', new Error('simulated resolver failure'));

    // Wait on the *terminal* state, not on `!isRunning()`. See the file
    // header for why `isRunning()` is unreliable as a wait predicate.
    await waitFor(() => producer.isDown(), {
      timeoutMs: 5000,
      description: 'producer fully down after resolver error',
    });

    // The transition is committed. All predicates reflect it, and none
    // of them will flip back until `run()` is called.
    expect(producer.isUp()).toBe(false);
    expect(producer.isGoingUp()).toBe(false);
    expect(producer.isGoingDown()).toBe(false);
    expect(producer.isDown()).toBe(true);
    expect(producer.isOperational()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Produce rejection after the failure
  // -------------------------------------------------------------------------

  it('rejects produce() with ProducerNotRunningError for both destination types after the resolver failure', async () => {
    const producer = await startProducer();
    const resolver = getResolver(producer);

    resolver.emit('error', new Error('simulated resolver failure'));

    await waitFor(() => producer.isDown(), {
      timeoutMs: 5000,
      description: 'producer fully down after resolver error',
    });

    // PUB/SUB destination. The resolver that would have resolved this
    // message's consumer groups is the one that failed, so this is the
    // destination the failure most directly affects.
    const pubSubMsg = RedisSMQ.newProducibleMessage()
      .setQueue(pubSubQueue)
      .setBody('pubsub-destination');

    await expect(producer.produce(pubSubMsg)).rejects.toBeInstanceOf(
      errors.ProducerNotRunningError,
    );

    // POINT_TO_POINT destination. The resolver plays no role here, but
    // the producer is down, so the call must reject the same way. This
    // pins the contract that the resolver failure is a *producer*
    // failure, not a per-destination degradation.
    const ptpMsg = RedisSMQ.newProducibleMessage()
      .setQueue(ptpQueue)
      .setBody('ptp-destination');

    await expect(producer.produce(ptpMsg)).rejects.toBeInstanceOf(
      errors.ProducerNotRunningError,
    );
  });

  // -------------------------------------------------------------------------
  // Re-run after failure
  // -------------------------------------------------------------------------

  it('allows the producer to be re-run after a resolver failure and produce again', async () => {
    const producer = await startProducer();
    const resolver = getResolver(producer);

    resolver.emit('error', new Error('simulated resolver failure'));

    // Wait on the terminal state. `run()` refuses while the producer is
    // still in `goingDown`; only after `isDown()` becomes true is a
    // re-run legal.
    await waitFor(() => producer.isDown(), {
      timeoutMs: 5000,
      description: 'producer fully down after resolver error',
    });

    // Re-run. The producer should construct a *fresh* resolver — not
    // reattach to the failed one.
    await producer.run();

    expect(producer.isUp()).toBe(true);
    expect(producer.isOperational()).toBe(true);

    const newResolver = getResolver(producer);
    expect(newResolver).not.toBe(resolver);
    expect(newResolver.isOperational()).toBe(true);

    // End-to-end: a produce should actually work, not just resolve.
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(ptpQueue)
        .setBody({ hello: 'world' }),
    );

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
