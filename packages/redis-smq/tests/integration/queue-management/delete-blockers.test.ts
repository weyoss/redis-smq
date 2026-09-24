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
  EExchangeQueuePolicy,
  EQueueType,
  errors,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { produceOne } from '../../helpers/factories/message.js';

/**
 * Integration tests for the preconditions that block a queue delete.
 *
 * `QueueManager.delete(queue)` refuses to run unless the queue is in a
 * state where deletion is safe. Four conditions block it, each with its
 * own error class:
 *
 *   - `QueueNotEmptyError` — the queue has messages in any state. A
 *     delete would orphan them; the caller must purge first.
 *
 *   - `QueueHasActiveConsumersError` — at least one consumer is
 *     registered on the queue. Deleting a queue out from under a
 *     running consumer would leave the consumer polling a nonexistent
 *     destination.
 *
 *   - `QueueHasBoundExchangesError` — at least one exchange has a
 *     binding that targets the queue. A binding to a deleted queue
 *     would leave the exchange publishing into the void.
 *
 *   - `QueueNotFoundError` — the queue does not exist. This is not a
 *     precondition in the same sense as the other three — it is a
 *     lookup failure — but it rejects with the same shape and is
 *     covered here for completeness.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for operations whose effects propagate asynchronously.
 *
 * The consumer deregistration on shutdown is the main one — the
 * shutdown chain includes a Redis round-trip, and the delete's
 * precondition check reads the Redis-side registration. Generous on CI.
 */
const PROPAGATION_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait until the queue manager reports no active consumers for the
 * queue.
 *
 * Used after a consumer is shut down, before a delete is attempted.
 * The consumer's shutdown chain includes `_unsubscribeConsumer`, which
 * removes the registration from Redis — the delete's precondition
 * reads that registration. Polling for the settled state removes the
 * race between the shutdown's return and the registration's
 * removal.
 */
async function waitForNoConsumers(queue: IQueueParams): Promise<void> {
  const queueManager = RedisSMQ.createQueueManager();
  await waitFor(
    async () =>
      Object.keys(await queueManager.getConsumers(queue)).length === 0,
    {
      timeoutMs: PROPAGATION_TIMEOUT_MS,
      description: 'queue has no registered consumers',
    },
  );
}

/**
 * Retry a queue delete until it succeeds, ignoring only
 * `QueueLockedError`.
 *
 * Used by tests that resolve a delete blocker via an operation which
 * leaves the queue temporarily LOCKED — most notably `purge`, whose
 * background job holds the lock until it completes. The delete is
 * retried on `QueueLockedError` (the transient condition) and any
 * other error propagates immediately (a different blocker, or a
 * genuine failure).
 *
 * This is more robust than polling for `operationalState !== LOCKED`
 * because it asserts exactly the contract the caller cares about —
 * "the delete eventually succeeds" — without needing to know which
 * state the queue returns to after unlock, or whether intermediate
 * states are observable.
 *
 * The 15-second timeout is generous: on a healthy run the lock
 * releases within a second or two of the purge job finishing its
 * pending-list work, and the retry succeeds almost immediately.
 */
async function waitForDeleteToSucceed(
  queueManager: ReturnType<typeof RedisSMQ.createQueueManager>,
  queue: IQueueParams,
): Promise<void> {
  await waitFor(
    async () => {
      try {
        await queueManager.delete(queue);
        return true;
      } catch (err) {
        if (err instanceof errors.QueueLockedError) return false;
        throw err;
      }
    },
    {
      timeoutMs: 15_000,
      intervalMs: 100,
      description:
        `queue ${queue.ns}:${queue.name} delete succeeded after ` +
        `the transient lock released`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue delete blockers', () => {
  // -------------------------------------------------------------------------
  // QueueNotEmptyError
  // -------------------------------------------------------------------------

  describe('QueueNotEmptyError', () => {
    it('rejects the delete when the queue contains a pending message', async () => {
      const queue = uniqueQueue('blocker-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceOne(queue, 'blocking-message');

      const queueManager = RedisSMQ.createQueueManager();

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueNotEmptyError,
      );

      // The queue is still present and readable — a rejected delete
      // must not have partially removed anything.
      const props = await queueManager.getProperties(queue);
      expect(props.queueType).toBe(EQueueType.FIFO_QUEUE);
    });

    it('rejects the delete when the queue contains only acknowledged messages', async () => {
      const queue = uniqueQueue('blocker-acknowledged');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const id = await produceOne(queue, 'will-be-acked');

      // Wait for the message to be acked, then shut the consumer down
      // so the not-empty check is the only blocker in play.
      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;
      await consumer.shutdown();
      await waitForNoConsumers(queue);

      const queueManager = RedisSMQ.createQueueManager();
      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueNotEmptyError,
      );
    });

    it('accepts the delete after the queue is purged', async () => {
      const queue = uniqueQueue('blocker-pending-purged');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceOne(queue, 'will-be-purged');

      const queueManager = RedisSMQ.createQueueManager();
      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueNotEmptyError,
      );

      await queueMessages.purge(queue);

      // Wait for the purge's pending-list work to complete. This does
      // NOT mean the lock has released — the purge job may still be
      // finishing other lists' bookkeeping — but it does mean the
      // pending blocker is no longer the reason a delete would fail.
      await waitFor(
        async () =>
          (await queueMessages.countMessagesByStatus(queue)).pending === 0,
        {
          timeoutMs: PROPAGATION_TIMEOUT_MS,
          description: 'queue pending count reached zero after purge',
        },
      );

      // Retry the delete until the lock releases.
      await waitForDeleteToSucceed(queueManager, queue);

      // The queue is gone.
      await expect(queueManager.getProperties(queue)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // QueueHasActiveConsumersError
  // -------------------------------------------------------------------------

  describe('QueueHasActiveConsumersError', () => {
    it('rejects the delete while a consumer is registered', async () => {
      const queue = uniqueQueue('blocker-consumer');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();

      // Wait for the consumer's registration to reach Redis — the
      // delete reads that registration, and the `run()` call
      // resolving does not guarantee the write has landed.
      const queueManager = RedisSMQ.createQueueManager();
      await waitFor(
        async () =>
          Object.keys(await queueManager.getConsumers(queue)).length > 0,
        {
          timeoutMs: PROPAGATION_TIMEOUT_MS,
          description: 'consumer registered in Redis',
        },
      );

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueHasActiveConsumersError,
      );

      // The queue is still present.
      const props = await queueManager.getProperties(queue);
      expect(props.queueType).toBe(EQueueType.FIFO_QUEUE);
    });

    it('accepts the delete after the consumer is shut down', async () => {
      const queue = uniqueQueue('blocker-consumer-shutdown');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      await consumer.run();

      const queueManager = RedisSMQ.createQueueManager();
      await waitFor(
        async () =>
          Object.keys(await queueManager.getConsumers(queue)).length > 0,
        {
          timeoutMs: PROPAGATION_TIMEOUT_MS,
          description: 'consumer registered in Redis',
        },
      );

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueHasActiveConsumersError,
      );

      await consumer.shutdown();
      await waitForNoConsumers(queue);

      await expect(queueManager.delete(queue)).resolves.toBeUndefined();

      await expect(queueManager.getProperties(queue)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // QueueHasBoundExchangesError
  // -------------------------------------------------------------------------

  describe('QueueHasBoundExchangesError', () => {
    it('rejects the delete while the queue is bound to an exchange', async () => {
      const queue = uniqueQueue('blocker-bound');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const exchangeParams = {
        ns: queue.ns,
        name: `ex-for-${queue.name}`,
      };
      const directExchange = RedisSMQ.createDirectExchange();
      await directExchange.create(
        exchangeParams,
        EExchangeQueuePolicy.STANDARD,
      );

      await directExchange.bindQueue(queue, exchangeParams, 'routing.key');

      const queueManager = RedisSMQ.createQueueManager();
      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueHasBoundExchangesError,
      );

      // The queue is still present.
      const props = await queueManager.getProperties(queue);
      expect(props.queueType).toBe(EQueueType.FIFO_QUEUE);
    });

    it('accepts the delete after the binding is removed', async () => {
      const queue = uniqueQueue('blocker-bound-unbound');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const exchangeParams = {
        ns: queue.ns,
        name: `ex-for-${queue.name}`,
      };
      const directExchange = RedisSMQ.createDirectExchange();
      await directExchange.create(
        exchangeParams,
        EExchangeQueuePolicy.STANDARD,
      );
      await directExchange.bindQueue(queue, exchangeParams, 'routing.key');

      const queueManager = RedisSMQ.createQueueManager();
      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueHasBoundExchangesError,
      );

      await directExchange.unbindQueue(queue, exchangeParams, 'routing.key');

      await expect(queueManager.delete(queue)).resolves.toBeUndefined();

      await expect(queueManager.getProperties(queue)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // QueueNotFoundError
  // -------------------------------------------------------------------------

  describe('QueueNotFoundError', () => {
    it('rejects the delete of a queue that does not exist', async () => {
      const queueManager = RedisSMQ.createQueueManager();

      const missing: IQueueParams = {
        ns: 'testing',
        name: `never-created-${Date.now()}`,
      };

      await expect(queueManager.delete(missing)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });

    it('rejects a second delete of the same queue with the same error', async () => {
      const queue = uniqueQueue('blocker-twice');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();

      await queueManager.delete(queue);

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Precedence
  // -------------------------------------------------------------------------

  describe('precondition precedence', () => {
    it('reports QueueNotEmptyError before QueueHasActiveConsumersError when both apply', async () => {
      const queue = uniqueQueue('blocker-precedence');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Produce a message so the not-empty condition applies.
      await produceOne(queue, 'will-remain-pending');

      // Register a consumer so the active-consumer condition also
      // applies. The handler is never invoked — the message is not
      // delivered because the delete is attempted immediately.
      const consumer = createBareConsumer();
      await consumer.consume(queue, (_msg, cb) => cb());
      await consumer.run();

      // Wait for the consumer's registration to reach Redis so both
      // preconditions are definitively in play.
      const queueManager = RedisSMQ.createQueueManager();
      await waitFor(
        async () =>
          Object.keys(await queueManager.getConsumers(queue)).length > 0,
        {
          timeoutMs: PROPAGATION_TIMEOUT_MS,
          description: 'consumer registered in Redis',
        },
      );

      await expect(queueManager.delete(queue)).rejects.toThrow(
        errors.QueueNotEmptyError,
      );
    });
  });
});
