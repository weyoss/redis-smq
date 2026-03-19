/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, describe, vi } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import {
  Consumer,
  EStateTransitionReason,
  EQueueType,
  QueueStateManager,
} from '../../../src/index.js';
import bluebird from 'bluebird';
import { getQueueManager } from '../../common/queue-manager.js';

describe('QueueStateManager: consumers stop consuming messages from a queue when it is stopped/paused', () => {
  test('pause a queue -> consumer stops consuming messages', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    // Start a consumer first
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.runAsync();

    const consumeSpy = vi.fn((msg, done) => done());
    await consumer.consumeAsync(defaultQueue, consumeSpy);

    const queueManager = await getQueueManager();
    await expect(
      queueManager.getConsumersAsync(defaultQueue),
    ).resolves.toHaveProperty(consumer.getId());

    //
    expect(consumer.getQueuesWithStatus()).toEqual([
      {
        status: 'active',
        queue: {
          groupId: null,
          queueParams: defaultQueue,
        },
      },
    ]);

    // Stop the queue
    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pauseAsync(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    // Wait a bit to ensure no messages are consumed after stop
    await bluebird.delay(5000);

    // Consumer should not receive the message
    expect(consumeSpy).not.toHaveBeenCalled();
    expect(consumer.getQueuesWithStatus()).toEqual([
      {
        status: 'stopped',
        queue: {
          groupId: null,
          queueParams: defaultQueue,
        },
      },
    ]);

    await expect(queueManager.getConsumersAsync(defaultQueue)).resolves.toEqual(
      {},
    );

    await consumer.shutdownAsync();
  });

  test('stop a queue -> consumer stops consuming messages', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const queueManager = await getQueueManager();

    // Start a consumer first
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.runAsync();

    const consumeSpy = vi.fn((msg, done) => done());
    await consumer.consumeAsync(defaultQueue, consumeSpy);

    //
    expect(consumer.getQueuesWithStatus()).toEqual([
      {
        status: 'active',
        queue: {
          groupId: null,
          queueParams: defaultQueue,
        },
      },
    ]);

    await expect(
      queueManager.getConsumersAsync(defaultQueue),
    ).resolves.toHaveProperty(consumer.getId());

    // Stop the queue
    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stopAsync(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    // Wait a bit to ensure no messages are consumed after stop
    await bluebird.delay(5000);

    // Consumer should not receive the message
    expect(consumeSpy).not.toHaveBeenCalled();
    expect(consumer.getQueuesWithStatus()).toEqual([
      {
        status: 'stopped',
        queue: {
          groupId: null,
          queueParams: defaultQueue,
        },
      },
    ]);

    //
    await expect(queueManager.getConsumersAsync(defaultQueue)).resolves.toEqual(
      {},
    );

    await consumer.shutdownAsync();
  });
});
