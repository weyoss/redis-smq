/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
  EQueueType,
  type IMessageTransferable,
  type IQueueParsedParams,
  type TRedisSMQEvent,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the consumer-side events on the RedisSMQ's
 * event bus.
 *
 * The bus is a distributed emitter: events published by a consumer in
 * one process are delivered to subscribers in any process connected
 * to the same Redis. A consumer emits the following events on the
 * bus:
 *
 *   Lifecycle events — fired as the consumer moves through its
 *   `Runnable` state machine:
 *
 *     - `consumer.goingUp`   — `run()` has started.
 *     - `consumer.up`        — `run()` has completed.
 *     - `consumer.goingDown` — `shutdown()` has started.
 *     - `consumer.down`      — `shutdown()` has completed.
 *
 *   Message events — fired during normal operation:
 *
 *     - `consumer.messageReceived`     — RedisSMQ has checked
 *                                        out a message and is about
 *                                        to hand it to the handler.
 *     - `consumer.messageAcknowledged` — the handler acked the
 *                                        message.
 *     - `consumer.messageDeadLettered` — the message reached the
 *                                        dead-letter list. Fires with
 *                                        a `deadLetterCause`.
 *     - `consumer.messageUnacknowledged` — the message was unacked.
 *                                        Fires with an
 *                                        `EMessageUnacknowledgementCause`.
 *     - `consumer.messageRequeued`     — the unack resolved to a
 *                                        requeue (retryDelay = 0).
 *     - `consumer.messageDelayed`      — the unack resolved to a delay
 *                                        (retryDelay > 0).
 *
 * THE LIFECYCLE EVENTS ALSO FIRE ON THE CONSUMER INSTANCE:
 *
 *   The consumer emits each lifecycle event on itself
 *   (`consumer.on`) *and* on the bus. The instance channel is what the
 *   suite's `untilConsumerDown` helper uses — specifically because a
 *   `consumer.down` event from a *different* consumer cannot satisfy
 *   an instance-scoped await, which matters in multi-consumer tests.
 *   The bus channel is the process-wide one a subscriber uses when it
 *   does not hold a reference to the specific consumer it wants to
 *   observe.
 *
 *   `consuming/` lifecycle tests cover the instance channel. This
 *   file covers the bus channel.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to a bus event before its trigger, capture its args, and
 * return both the capture buffer and a cleanup function.
 *
 * Same shape as the sibling events files.
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
 * Assert the queue argument RedisSMQ passes to a consumer event.
 *
 * The bus delivers the queue as `IQueueParsedParams`
 * (`{ queueParams, groupId }`). For a POINT_TO_POINT consumer — which
 * every message-event test in this file uses — the `groupId` is
 * `null`.
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

describe('consumer.* events', () => {
  // -------------------------------------------------------------------------
  // Lifecycle events
  // -------------------------------------------------------------------------

  describe('lifecycle events', () => {
    it('fires goingUp and up on the bus when the consumer starts', async () => {
      // Subscribe before `run()`. The consumer is constructed via
      // `createBareConsumer` so the test controls when `run()` is
      // called; the subscriptions go in between.
      const queue = uniqueQueue('events-lifecycle-up');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const goingUp = await setupCapture('consumer.goingUp');
      const up = await setupCapture('consumer.up');

      try {
        const consumer = createBareConsumer();
        await consumer.consume(
          queue,
          (_msg: IMessageTransferable, cb: ICallback) => cb(),
        );
        await consumer.run();

        await waitFor(
          () => goingUp.captured.length >= 1 && up.captured.length >= 1,
          {
            timeoutMs: 5000,
            description: 'consumer.goingUp and consumer.up arrived on the bus',
          },
        );

        expect(goingUp.captured.length).toBeGreaterThanOrEqual(1);
        expect(up.captured.length).toBeGreaterThanOrEqual(1);

        await consumer.shutdown();
      } finally {
        goingUp.cleanup();
        up.cleanup();
      }
    });

    it('fires goingDown and down on the bus when the consumer shuts down', async () => {
      const queue = uniqueQueue('events-lifecycle-down');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });
      await consumer.run();

      const goingDown = await setupCapture('consumer.goingDown');
      const down = await setupCapture('consumer.down');

      try {
        await consumer.shutdown();

        await waitFor(
          () => goingDown.captured.length >= 1 && down.captured.length >= 1,
          {
            timeoutMs: 5000,
            description:
              'consumer.goingDown and consumer.down arrived on the bus',
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
  // consumer.messageReceived
  // -------------------------------------------------------------------------

  describe('consumer.messageReceived', () => {
    it('fires with the message ID, queue, and consumer ID on checkout', async () => {
      const queue = uniqueQueue('events-received');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('received'),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageReceived',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageReceived fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId] = captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });

  // -------------------------------------------------------------------------
  // consumer.messageAcknowledged
  // -------------------------------------------------------------------------

  describe('consumer.messageAcknowledged', () => {
    it('fires with the message ID, queue, and consumer ID on ack', async () => {
      const queue = uniqueQueue('events-acked');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('acked'),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageAcknowledged',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageAcknowledged fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId] = captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });

  // -------------------------------------------------------------------------
  // consumer.messageDeadLettered
  // -------------------------------------------------------------------------

  describe('consumer.messageDeadLettered', () => {
    it('fires with the message ID, queue, consumer ID, and dead-letter cause', async () => {
      const queue = uniqueQueue('events-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('always fails')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('dead-letters')
          .setRetryThreshold(0),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageDeadLettered',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageDeadLettered fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId, eventCause] =
          captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
        expect(eventCause).toBe(
          EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
        );
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });

  // -------------------------------------------------------------------------
  // consumer.messageUnacknowledged
  // -------------------------------------------------------------------------

  describe('consumer.messageUnacknowledged', () => {
    it('fires with the message ID, queue, consumer ID, and unacknowledgement cause', async () => {
      const queue = uniqueQueue('events-unack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('always fails')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('unacks')
          .setRetryThreshold(0),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageUnacknowledged',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageUnacknowledged fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId, eventCause] =
          captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
        expect(eventCause).toBe(EMessageUnacknowledgementCause.UNACKNOWLEDGED);
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });

  // -------------------------------------------------------------------------
  // consumer.messageRequeued
  // -------------------------------------------------------------------------

  describe('consumer.messageRequeued', () => {
    it('fires with the message ID, queue, and consumer ID when the unack resolves to a requeue', async () => {
      const queue = uniqueQueue('events-requeued');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('always fails')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('requeues')
          .setRetryThreshold(3)
          .setRetryDelay(0),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageRequeued',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageRequeued fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId] = captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });

  // -------------------------------------------------------------------------
  // consumer.messageDelayed
  // -------------------------------------------------------------------------

  describe('consumer.messageDelayed', () => {
    it('fires with the message ID, queue, and consumer ID when the unack resolves to a delay', async () => {
      const queue = uniqueQueue('events-delayed');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('always fails')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('delays')
          .setRetryThreshold(3)
          .setRetryDelay(1000),
      );

      const { captured, cleanup } = await setupCapture(
        'consumer.messageDelayed',
      );

      try {
        await consumer.run();

        await waitFor(() => captured.length >= 1, {
          timeoutMs: 15_000,
          description: `consumer.messageDelayed fired for message ${id}`,
        });

        const [eventMessageId, eventQueue, eventConsumerId] = captured[0];

        expect(eventMessageId).toBe(id);
        expectEventQueue(eventQueue, queue);
        expect(eventConsumerId).toBe(consumer.getId());
      } finally {
        cleanup();
        await consumer.shutdown();
        await producer.shutdown();
      }
    });
  });
});
