/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, errors, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the successful deletion of a queue.
 *
 * `QueueManager.delete(queue)` removes a queue and every Redis key
 * associated with it. The preconditions that can block a delete — a
 * non-empty queue, an active consumer, a bound exchange — are covered
 * in `delete-blockers.test.ts`. This file covers the case where none
 * of them apply: an empty, unsubscribed, unbound queue deletes cleanly.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Deleting a queue', () => {
  // -------------------------------------------------------------------------
  // Successful deletion
  // -------------------------------------------------------------------------

  it('deletes a fresh, empty queue', async () => {
    const queue = uniqueQueue('delete-empty');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();

    // Pre-state: the queue exists and is readable.
    const propsBefore = await queueManager.getProperties(queue);
    expect(propsBefore.queueType).toBe(EQueueType.FIFO_QUEUE);

    await queueManager.delete(queue);

    // Post-state: `getProperties` fails with `QueueNotFoundError`.
    await expect(queueManager.getProperties(queue)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });

  it('removes the queue from every metrics accessor', async () => {
    const queue = uniqueQueue('delete-metrics');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();
    await queueManager.delete(queue);

    const pending = RedisSMQ.createQueuePendingMessages();
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const scheduled = RedisSMQ.createQueueScheduledMessages();

    await expect(pending.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
    await expect(acknowledged.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
    await expect(deadLettered.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
    await expect(scheduled.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });

  it('rejects a second delete with QueueNotFoundError', async () => {
    const queue = uniqueQueue('delete-twice');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();
    await queueManager.delete(queue);

    await expect(queueManager.delete(queue)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });

  // -------------------------------------------------------------------------
  // Isolation
  // -------------------------------------------------------------------------

  it('does not affect a sibling queue with a similar name', async () => {
    const queueA = uniqueQueue('delete-sibling-a');
    const queueB = uniqueQueue('delete-sibling-b');

    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();

    // Confirm both exist before the delete.
    expect((await queueManager.getProperties(queueA)).queueType).toBe(
      EQueueType.FIFO_QUEUE,
    );
    expect((await queueManager.getProperties(queueB)).queueType).toBe(
      EQueueType.FIFO_QUEUE,
    );

    await queueManager.delete(queueA);

    // A is gone; B is untouched.
    await expect(queueManager.getProperties(queueA)).rejects.toThrow(
      errors.QueueNotFoundError,
    );

    const propsB = await queueManager.getProperties(queueB);
    expect(propsB.queueType).toBe(EQueueType.FIFO_QUEUE);
  });

  it('deletes a queue with a non-FIFO type without error', async () => {
    const queueManager = RedisSMQ.createQueueManager();

    const lifoQueue = uniqueQueue('delete-lifo');
    await createQueue(lifoQueue, EQueueType.LIFO_QUEUE);
    await queueManager.delete(lifoQueue);
    await expect(queueManager.getProperties(lifoQueue)).rejects.toThrow(
      errors.QueueNotFoundError,
    );

    const priorityQueue = uniqueQueue('delete-priority');
    await createQueue(priorityQueue, EQueueType.PRIORITY_QUEUE);
    await queueManager.delete(priorityQueue);
    await expect(queueManager.getProperties(priorityQueue)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });
});
