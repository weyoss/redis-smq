/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EQueueType,
  type TRedisSMQEvent,
  RedisSMQ,
  type IEventBus,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the event bus's subscriber mechanics.
 *
 * The bus implements the `EventEmitter` interface — `on`, `once`,
 * `removeListener` — on top of a distributed Redis pub/sub channel.
 * Each method's semantics are the same as Node's in-process
 * `EventEmitter`, but they are implemented by RedisSMQ's
 * `RedisEmitter` rather than inherited from `node:events`. These
 * tests verify the three methods the rest of the suite depends on:
 *
 *   - `on`             — subscribe a persistent listener.
 *   - `removeListener` — remove exactly the listener that was
 *                        subscribed, leaving the others in place.
 *   - `once`           — subscribe a listener that fires on the
 *                        first matching event and is then removed
 *                        automatically.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe a capturing listener to a bus event.
 *
 * The `mode` parameter chooses between `bus.on` (persistent
 * subscription) and `bus.once` (single-fire subscription). The
 * captured-args array grows each time the listener fires; the caller
 * waits on `captured.length` to know when the event arrived.
 *
 * The `cleanup` function removes the listener via
 * `bus.removeListener`. For the `once` mode the listener has already
 * removed itself after its single fire; calling `removeListener`
 * again is a no-op for a listener that is not attached, so the
 * `finally` blocks in the tests are safe regardless of how many
 * times the listener fired.
 *
 * The `as TRedisSMQEvent[K]` cast follows the pattern documented in
 * `helpers/events/await-event.ts` — sound at runtime, unprovable to
 * the compiler because `K` is a generic parameter that collapses to
 * an intersection of handler shapes.
 */
function subscribeCapture<K extends keyof TRedisSMQEvent>(
  bus: IEventBus,
  event: K,
  mode: 'on' | 'once' = 'on',
): {
  captured: Array<Parameters<TRedisSMQEvent[K]>>;
  cleanup: () => void;
} {
  const captured: Array<Parameters<TRedisSMQEvent[K]>> = [];

  const handler = ((...args: Parameters<TRedisSMQEvent[K]>) => {
    captured.push(args);
  }) as TRedisSMQEvent[K];

  if (mode === 'once') {
    bus.once(event, handler);
  } else {
    bus.on(event, handler);
  }

  return {
    captured,
    cleanup: () => bus.removeListener(event, handler),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('event bus — subscriber isolation', () => {
  // -------------------------------------------------------------------------
  // Fan-out
  // -------------------------------------------------------------------------

  describe('fan-out', () => {
    it('delivers a single event to every subscriber', async () => {
      const queue = uniqueQueue('iso-fanout');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const bus = await getEventBus();

      const subscriberA = subscribeCapture(bus, 'producer.messagePublished');
      const subscriberB = subscribeCapture(bus, 'producer.messagePublished');

      try {
        const producer = await startProducer();
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('fan-out'),
        );

        // Wait for both subscribers to see the event. The `waitFor`
        // predicate requires both counts to be ≥ 1, so the wait
        // cannot resolve before *either* subscriber has fired.
        await waitFor(
          () =>
            subscriberA.captured.length >= 1 &&
            subscriberB.captured.length >= 1,
          {
            timeoutMs: 5000,
            description:
              'both subscribers received the producer.messagePublished event',
          },
        );

        // Both subscribers captured the same message ID. The ID is
        // the produce call's return value, which the payload's first
        // argument matches — see `producer-events.test.ts` for the
        // payload-shape contract.
        expect(subscriberA.captured[0][0]).toBe(id);
        expect(subscriberB.captured[0][0]).toBe(id);

        await producer.shutdown();
      } finally {
        subscriberA.cleanup();
        subscriberB.cleanup();
      }
    });
  });

  // -------------------------------------------------------------------------
  // removeListener
  // -------------------------------------------------------------------------

  describe('removeListener', () => {
    it('removes only the targeted listener, leaving others subscribed', async () => {
      const queue = uniqueQueue('iso-remove');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const bus = await getEventBus();

      const subscriberA = subscribeCapture(bus, 'producer.messagePublished');
      const subscriberB = subscribeCapture(bus, 'producer.messagePublished');

      try {
        const producer = await startProducer();

        // --- First produce: both subscribers fire ---
        const [idFirst] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('first'),
        );

        await waitFor(
          () =>
            subscriberA.captured.length >= 1 &&
            subscriberB.captured.length >= 1,
          {
            timeoutMs: 5000,
            description:
              'both subscribers received the first producer.messagePublished event',
          },
        );

        expect(subscriberA.captured[0][0]).toBe(idFirst);
        expect(subscriberB.captured[0][0]).toBe(idFirst);

        // --- Remove A only ---
        subscriberA.cleanup();

        // --- Second produce: only B fires ---
        const [idSecond] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('second'),
        );

        // Wait for B to see the second event. A, being removed, has no
        // way to signal that it *didn't* fire — the wait has to be on
        // B's arrival. Once B has the event, the test checks A's
        // count, which by then reflects the post-removal behavior.
        await waitFor(() => subscriberB.captured.length >= 2, {
          timeoutMs: 5000,
          description:
            'subscriber B received the second producer.messagePublished event',
        });

        expect(subscriberB.captured[1][0]).toBe(idSecond);

        // The load-bearing assertion: subscriber A did NOT receive
        // the second event. Its capture buffer is still at length 1 —
        // the first event — and does not contain the second ID.
        expect(subscriberA.captured).toHaveLength(1);
        expect(subscriberA.captured[0][0]).toBe(idFirst);
        expect(subscriberA.captured[0][0]).not.toBe(idSecond);

        await producer.shutdown();
      } finally {
        subscriberA.cleanup();
        subscriberB.cleanup();
      }
    });
  });

  // -------------------------------------------------------------------------
  // once
  // -------------------------------------------------------------------------

  describe('once', () => {
    it('fires the listener exactly once even when the event fires twice', async () => {
      const queue = uniqueQueue('iso-once');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const bus = await getEventBus();

      const persistentSubscriber = subscribeCapture(
        bus,
        'producer.messagePublished',
        'on',
      );
      const onceSubscriber = subscribeCapture(
        bus,
        'producer.messagePublished',
        'once',
      );

      try {
        const producer = await startProducer();

        // --- First produce: both subscribers fire ---
        const [idFirst] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('once-1'),
        );

        await waitFor(
          () =>
            persistentSubscriber.captured.length >= 1 &&
            onceSubscriber.captured.length >= 1,
          {
            timeoutMs: 5000,
            description:
              'both subscribers received the first producer.messagePublished event',
          },
        );

        expect(persistentSubscriber.captured[0][0]).toBe(idFirst);
        expect(onceSubscriber.captured[0][0]).toBe(idFirst);

        // --- Second produce: only the persistent subscriber fires ---
        const [idSecond] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('once-2'),
        );

        // Wait for the *persistent* subscriber to see the second
        // event. That is the signal that the second event fired; at
        // this point, the once subscriber's capture buffer has had
        // every chance to grow — if it hasn't, the `once` semantics
        // are what stopped it.
        await waitFor(() => persistentSubscriber.captured.length >= 2, {
          timeoutMs: 5000,
          description:
            'persistent subscriber received the second producer.messagePublished event',
        });

        expect(persistentSubscriber.captured[1][0]).toBe(idSecond);

        // The load-bearing assertion: the once subscriber captured
        // exactly one event, and it was the first — not the second,
        // not both. `once` detached after its single fire, so the
        // second event never reached it.
        expect(onceSubscriber.captured).toHaveLength(1);
        expect(onceSubscriber.captured[0][0]).toBe(idFirst);
        expect(onceSubscriber.captured[0][0]).not.toBe(idSecond);

        await producer.shutdown();
      } finally {
        persistentSubscriber.cleanup();
        onceSubscriber.cleanup();
      }
    });
  });
});
