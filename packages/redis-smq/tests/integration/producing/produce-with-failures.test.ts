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
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  errors,
  RedisSMQ,
} from '../../../src/index.js';
import { uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration test for the validation errors `produce()` raises.
 *
 * Three caller errors can be detected at produce time, before the message
 * reaches Redis:
 *
 *   1. A priority is set on a message destined for a queue that is not a
 *      priority queue. RedisSMQ rejects with
 *      `PriorityQueuingNotEnabledError` — the caller's priority setting
 *      would be silently ignored otherwise, so failing loudly is the
 *      correct behavior.
 *
 *   2. A message destined for a priority queue has no priority set.
 *      `MessagePriorityRequiredError` — a priority queue without a
 *      priority cannot order the message, and a default would be a guess.
 *
 *   3. The destination queue does not exist. `QueueNotFoundError` — this
 *      is a lookup failure, not a validation failure, but it happens at
 *      the same point in the produce path.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * The two queue shapes needed by the tests below, created once per test.
 *
 * Both are created for every test, not just the ones that use them,
 * because the setup cost is negligible and sharing the setup keeps each
 * test's body focused on the case it exercises. If a test ever grows to
 * depend on the absence of one queue, it can create its own setup — but
 * that would be the exception, and worth a comment when it happens.
 */
let fifoQueue: ReturnType<typeof uniqueQueue>;
let priorityQueue: ReturnType<typeof uniqueQueue>;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('produce() validation failures', () => {
  beforeEach(async () => {
    const qm = RedisSMQ.createQueueManager();

    fifoQueue = uniqueQueue('fifo');
    await qm.save(
      fifoQueue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    priorityQueue = uniqueQueue('prio');
    await qm.save(
      priorityQueue,
      EQueueType.PRIORITY_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );
  });

  // -------------------------------------------------------------------------
  // Priority on a non-priority queue
  // -------------------------------------------------------------------------

  it('rejects with PriorityQueuingNotEnabledError when a priority is set for a FIFO queue', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(fifoQueue)
      .setBody('body')
      .setPriority(EMessagePriority.LOW);

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.PriorityQueuingNotEnabledError,
    );
  });

  it('writes nothing to Redis when a priority is set for a FIFO queue', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(fifoQueue)
      .setBody('body')
      .setPriority(EMessagePriority.LOW);

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.PriorityQueuingNotEnabledError,
    );

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(fifoQueue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // No priority on a priority queue
  // -------------------------------------------------------------------------

  it('rejects with MessagePriorityRequiredError when no priority is set for a priority queue', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(priorityQueue)
      .setBody('body');

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.MessagePriorityRequiredError,
    );
  });

  it('writes nothing to Redis when a priority queue is targeted without a priority', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(priorityQueue)
      .setBody('body');

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.MessagePriorityRequiredError,
    );

    // Reading from a priority queue without a priority is a different
    // operation — `countMessages` is queue-type agnostic and works on
    // both FIFO and priority queues.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(priorityQueue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Nonexistent queue
  // -------------------------------------------------------------------------

  it('rejects with QueueNotFoundError when the destination queue does not exist', async () => {
    const producer = await startProducer();
    const missingQueue = uniqueQueue('missing');

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(missingQueue)
      .setBody('body');

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });

  // -------------------------------------------------------------------------
  // Correct configuration still works
  // -------------------------------------------------------------------------

  it('accepts a priority on a priority queue', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(priorityQueue)
      .setBody('body')
      .setPriority(EMessagePriority.LOW);

    const [id] = await producer.produce(msg);

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('accepts a plain message on a FIFO queue', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(fifoQueue)
      .setBody('body');

    const [id] = await producer.produce(msg);

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
