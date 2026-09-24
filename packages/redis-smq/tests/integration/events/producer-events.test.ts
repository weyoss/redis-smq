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
  EQueueType,
  type IQueueParsedParams,
  type TRedisSMQEvent,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import {
  createBareProducer,
  startProducer,
} from '../../helpers/factories/producer.js';

/**
 * Integration tests for the producer-side events on RedisSMQ's
 * event bus.
 *
 * The bus is a distributed emitter: events published by a producer in
 * one process are delivered to subscribers in any process connected
 * to the same Redis. A producer emits the following events on the
 * bus:
 *
 *   Lifecycle events — fired as the producer moves through its
 *   `Runnable` state machine:
 *
 *     - `producer.goingUp`   — `run()` has started.
 *     - `producer.up`        — `run()` has completed; the producer is
 *                              fully operational.
 *     - `producer.goingDown` — `shutdown()` has started.
 *     - `producer.down`      — `shutdown()` has completed.
 *
 *   Message events — fired during normal operation:
 *
 *     - `producer.messagePublished` — a message was durably written
 *                                      to the queue's storage.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to a bus event before its trigger, capture its args, and
 * return both the capture buffer and a cleanup function.
 *
 * Same shape as the sibling events files. The subscription is
 * synchronous inside the helper, so the caller must invoke it before
 * the trigger.
 */
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
 * Assert the queue argument RedisSMQ passes to a producer event.
 */
function expectEventQueue(
  actual: IQueueParsedParams,
  expected: { ns: string; name: string },
): void {
  expect(actual).toEqual({
    queueParams: expected,
    groupId: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('producer.* events', () => {
  // -------------------------------------------------------------------------
  // Lifecycle events
  // -------------------------------------------------------------------------

  describe('lifecycle events', () => {
    it('fires goingUp and up on the bus when the producer starts', async () => {
      // Subscribe before the trigger — the run() call fires both
      // events synchronously with (or immediately after) the
      // transition.
      //
      // The producer is constructed via `createBareProducer` (not
      // `startProducer`) so the test controls when `run()` is called
      // and can install the bus subscriptions in between.
      const goingUp = await setupCapture('producer.goingUp');
      const up = await setupCapture('producer.up');

      try {
        const producer = createBareProducer();
        await producer.run();

        await waitFor(
          () => goingUp.captured.length >= 1 && up.captured.length >= 1,
          {
            timeoutMs: 5000,
            description: 'producer.goingUp and producer.up arrived on the bus',
          },
        );

        // Both events fired on the bus. The payload shape is not
        // asserted here — see the note below.
        expect(goingUp.captured.length).toBeGreaterThanOrEqual(1);
        expect(up.captured.length).toBeGreaterThanOrEqual(1);

        await producer.shutdown();
      } finally {
        goingUp.cleanup();
        up.cleanup();
      }
    });

    it('fires goingDown and down on the bus when the producer shuts down', async () => {
      const producer = await startProducer();

      const goingDown = await setupCapture('producer.goingDown');
      const down = await setupCapture('producer.down');

      try {
        await producer.shutdown();

        await waitFor(
          () => goingDown.captured.length >= 1 && down.captured.length >= 1,
          {
            timeoutMs: 5000,
            description:
              'producer.goingDown and producer.down arrived on the bus',
          },
        );

        expect(goingDown.captured.length).toBeGreaterThanOrEqual(1);
        expect(down.captured.length).toBeGreaterThanOrEqual(1);
      } finally {
        goingDown.cleanup();
        down.cleanup();
      }
    });
  });

  // -------------------------------------------------------------------------
  // producer.messagePublished
  // -------------------------------------------------------------------------

  describe('producer.messagePublished', () => {
    it('fires with the message ID, queue, and producer ID on a successful produce', async () => {
      const queue = uniqueQueue('events-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const producerId = producer.getId();

      const { captured, cleanup } = await setupCapture(
        'producer.messagePublished',
      );

      try {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody('published'),
        );

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 5000,
          description: `producer.messagePublished fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventProducerId] = captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventProducerId).toBe(producerId);
      } finally {
        cleanup();
        await producer.shutdown();
      }
    });

    it('fires once per produce call', async () => {
      const queue = uniqueQueue('events-published-count');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();

      const { captured, cleanup } = await setupCapture(
        'producer.messagePublished',
      );

      try {
        const ids: string[] = [];
        for (let i = 0; i < 3; i += 1) {
          const [id] = await producer.produce(
            RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ seq: i }),
          );
          ids.push(id);
        }

        await waitFor(() => captured.length === 3, {
          timeoutMs: 5000,
          description: 'producer.messagePublished fired three times',
        });

        const capturedIds = captured.map((args) => args[0]);
        expect(new Set(capturedIds)).toEqual(new Set(ids));

        for (const args of captured) {
          expect(args[2]).toBe(producer.getId());
        }
      } finally {
        cleanup();
        await producer.shutdown();
      }
    });
  });
});
