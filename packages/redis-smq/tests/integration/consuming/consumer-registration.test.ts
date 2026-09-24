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
import { EQueueType, errors } from '../../../src/index.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration test for consumer handler registration.
 *
 * A consumer's `consume(queue, handler)` registers a message handler for a
 * queue; `cancel(queue)` unregisters it. The consumer maintains an ordered
 * set of registered handlers, exposed via `getQueues()`, that is independent
 * of whether the consumer is running.
 *
 * This file covers the *consumer's* view of registration:
 *
 *   - The set starts empty.
 *   - Registering a queue adds it to the set and preserves order.
 *   - Registering the same queue twice rejects with
 *     `MessageHandlerAlreadyExistsError`.
 *   - `cancel` removes a queue from the set.
 *   - `cancel` on a queue that is not registered is a no-op — it does not
 *     throw.
 *   - Registering after cancel works.
 *   - Registration works the same before `run()` and after `run()`; the
 *     consumer does not freeze its handler set at startup.
 *
 * The *queue-manager's* view — which consumers are registered on a given
 * queue, as reported by `QueueManager.getConsumers(queue)` — is a different
 * contract, tested in `multiple-queues.test.ts` alongside the private
 * helpers that query it.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A handler that acknowledges every message. Used here purely as a value to
 * register — the handler body is never invoked in this file because no
 * consumer ever runs against a non-empty queue.
 *
 * The signature is the callback form `(msg, cb) => void`, which is one of
 * the two handler shapes RedisSMQ accepts (the other is
 * `async (msg) => Promise<void>` — see `handlers/`).
 */
const noopHandler = (_msg: unknown, cb: ICallback) => cb();

/**
 * Extract just the queue params from the consumer's registered-queue list.
 *
 * `getQueues()` returns richer entries (`{ queueParams, groupId }`); tests
 * in this file only care about which queues are registered and in what
 * order. Mapping to `queueParams` keeps the assertions tight and makes the
 * failure output readable when order drifts.
 */
function registeredQueues(consumer: ReturnType<typeof createBareConsumer>) {
  return consumer.getQueues().map((entry) => entry.queueParams);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Consumer registration', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with an empty handler set', () => {
    const consumer = createBareConsumer();

    expect(consumer.getQueues()).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Registration before run()
  // -------------------------------------------------------------------------

  describe('before run()', () => {
    it('adds a queue to the handler set when consume() is called', async () => {
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, noopHandler);

      expect(registeredQueues(consumer)).toEqual([queue]);
    });

    it('preserves the order in which queues were registered', async () => {
      const queues = [
        uniqueQueue('first'),
        uniqueQueue('second'),
        uniqueQueue('third'),
      ];
      for (const q of queues) await createQueue(q, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      // Register in the order [first, second, third] and assert the same
      // order comes back. If RedisSMQ used an unordered set
      // internally, `getQueues()` would return them in an unspecified
      // order and this assertion would be flaky — which is exactly the
      // kind of bug worth catching early.
      for (const q of queues) await consumer.consume(q, noopHandler);

      expect(registeredQueues(consumer)).toEqual(queues);
    });

    it('rejects registering the same queue twice with MessageHandlerAlreadyExistsError', async () => {
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, noopHandler);

      // Same queue, different handler — the duplicate check must be on the
      // queue identity, not on whether the handler function is the same.
      // A bug that compared handler references would let two different
      // handlers register on the same queue.
      await expect(consumer.consume(queue, (_msg, cb) => cb())).rejects.toThrow(
        errors.MessageHandlerAlreadyExistsError,
      );

      // The failed registration must not have corrupted the existing one.
      expect(registeredQueues(consumer)).toEqual([queue]);
    });

    it('accepts registration on FIFO, LIFO, and PRIORITY queues', async () => {
      // Registration is queue-type agnostic. A regression that only worked
      // for one type — say, an internal lookup that assumed FIFO's key
      // layout — would fail here.
      const fifo = uniqueQueue('fifo');
      const lifo = uniqueQueue('lifo');
      const priority = uniqueQueue('prio');
      await createQueue(fifo, EQueueType.FIFO_QUEUE);
      await createQueue(lifo, EQueueType.LIFO_QUEUE);
      await createQueue(priority, EQueueType.PRIORITY_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(fifo, noopHandler);
      await consumer.consume(lifo, noopHandler);
      await consumer.consume(priority, noopHandler);

      expect(registeredQueues(consumer)).toEqual([fifo, lifo, priority]);
    });
  });

  // -------------------------------------------------------------------------
  // cancel()
  // -------------------------------------------------------------------------

  describe('cancel()', () => {
    it('removes the queue from the handler set', async () => {
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, noopHandler);
      expect(registeredQueues(consumer)).toEqual([queue]);

      await consumer.cancel(queue);

      expect(registeredQueues(consumer)).toEqual([]);
    });

    it('is a no-op when the queue is not registered', async () => {
      // Cancel is idempotent. This matters for callers that tear down
      // defensively — for example, a test that cancels in `afterEach`
      // whether or not it registered anything. A `cancel` that threw on an
      // unknown queue would force every such caller to guard the call.
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();

      await expect(consumer.cancel(queue)).resolves.toBeUndefined();
      expect(registeredQueues(consumer)).toEqual([]);
    });

    it('can be called twice for the same queue', async () => {
      // Distinct from the previous test: this one confirms that cancel is
      // idempotent *after a successful cancel*, not just for a queue that
      // was never registered.
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, noopHandler);

      await consumer.cancel(queue);
      await expect(consumer.cancel(queue)).resolves.toBeUndefined();

      expect(registeredQueues(consumer)).toEqual([]);
    });

    it('leaves other registrations intact', async () => {
      const keep = uniqueQueue('keep');
      const drop = uniqueQueue('drop');
      await createQueue(keep, EQueueType.FIFO_QUEUE);
      await createQueue(drop, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(keep, noopHandler);
      await consumer.consume(drop, noopHandler);

      await consumer.cancel(drop);

      expect(registeredQueues(consumer)).toEqual([keep]);
    });

    it('allows re-registration of a cancelled queue', async () => {
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, noopHandler);
      await consumer.cancel(queue);
      await consumer.consume(queue, noopHandler);

      // Re-registration succeeds and the queue appears exactly once — the
      // cancel must have fully removed the previous entry, not merely
      // marked it inactive.
      expect(registeredQueues(consumer)).toEqual([queue]);
    });
  });

  // -------------------------------------------------------------------------
  // Registration after run()
  // -------------------------------------------------------------------------

  describe('after run()', () => {
    it('accepts new registrations while running', async () => {
      // A running consumer does not freeze its handler set. New queues
      // can be registered at any point and take effect immediately.
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await consumer.consume(queue, noopHandler);

      expect(registeredQueues(consumer)).toEqual([queue]);
    });

    it('still rejects duplicate registrations while running', async () => {
      // The duplicate check is the same before and after `run()` — a
      // regression that moved the check into the pre-run code path (or
      // bypassed it when the consumer is already running) would fail here.
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();
      await consumer.consume(queue, noopHandler);

      await expect(consumer.consume(queue, noopHandler)).rejects.toThrow(
        errors.MessageHandlerAlreadyExistsError,
      );

      expect(registeredQueues(consumer)).toEqual([queue]);
    });

    it('accepts cancel while running', async () => {
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();
      await consumer.consume(queue, noopHandler);

      await consumer.cancel(queue);

      expect(registeredQueues(consumer)).toEqual([]);
    });

    it('allows cancel-then-register while running', async () => {
      // The composite flow from the original test00015: cancel a running
      // queue, then re-register it. This is the pattern a caller uses to
      // swap handlers on a live consumer — cancel, then consume with a
      // different handler.
      const queue = uniqueQueue();
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();
      await consumer.consume(queue, noopHandler);

      await consumer.cancel(queue);
      await consumer.consume(queue, (_msg, cb) => cb());

      expect(registeredQueues(consumer)).toEqual([queue]);
    });
  });
});
