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
  produceMessage,
} from '../../common/message-producing-consuming.js';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueOperationalState,
  EStateTransitionReason,
  EQueueType,
  QueueManager,
  QueueStateManager,
  TQueueStateTransitionUserOptions,
} from '../../../src/index.js';
import bluebird from 'bluebird';
import {
  QueuePausedError,
  QueueNotFoundError,
  QueueStateTransitionError,
} from '../../../src/errors/index.js';

describe('QueueStateManager: pause()/resume()/getStateHistory()/getState()', () => {
  test('should pause and resume a queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const queueManager = bluebird.promisifyAll(new QueueManager());
    const props1 = await queueManager.getProperties(defaultQueue);
    expect(props1.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Test pause with metadata
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Planned deployment',
    });

    const props2 = await queueManager.getProperties(defaultQueue);
    expect(props2.operationalState).toEqual(EQueueOperationalState.PAUSED);

    // Test resume
    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Deployment completed',
    });

    const props3 = await queueManager.getProperties(defaultQueue);
    expect(props3.operationalState).toEqual(EQueueOperationalState.ACTIVE);
  });

  test('should get state history with proper transitions', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Initial state (ACTIVE)
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'First pause',
    });

    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'First resume',
    });

    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Second pause',
    });

    const history = await stateManager.getStateHistory(defaultQueue);
    expect(history.length).toEqual(4);

    history.reverse();

    // Check transitions
    expect(history[0].from).toEqual(null);
    expect(history[0].to).toEqual(EQueueOperationalState.ACTIVE);
    expect(history[0].metadata).toEqual({
      deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
      queueType: EQueueType.FIFO_QUEUE,
    });

    expect(history[1].from).toEqual(EQueueOperationalState.ACTIVE);
    expect(history[1].to).toEqual(EQueueOperationalState.PAUSED);
    expect(history[1]?.reason).toEqual(EStateTransitionReason.SCHEDULED);
    expect(history[1]?.description).toEqual('First pause');

    expect(history[2].from).toEqual(EQueueOperationalState.PAUSED);
    expect(history[2].to).toEqual(EQueueOperationalState.ACTIVE);
    expect(history[2]?.reason).toEqual(EStateTransitionReason.MANUAL);
    expect(history[2]?.description).toEqual('First resume');

    expect(history[3].from).toEqual(EQueueOperationalState.ACTIVE);
    expect(history[3].to).toEqual(EQueueOperationalState.PAUSED);
    expect(history[3]?.reason).toEqual(EStateTransitionReason.SCHEDULED);
    expect(history[3]?.description).toEqual('Second pause');
  });

  test('should prevent operations on paused queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.PERFORMANCE,
    });

    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    await expect(
      consumer.consume(defaultQueue, (msg, done) => done()),
    ).rejects.toThrow(QueuePausedError);

    await consumer.shutdown();
  });

  test('should allow operations after resuming queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.TESTING,
    });
    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.TESTING,
    });

    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    await expect(
      consumer.consume(defaultQueue, (msg, done) => done()),
    ).resolves.not.toThrow();

    await consumer.shutdown();
  });

  test('should throw error when pausing an already paused queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.PERFORMANCE,
    });

    await expect(
      stateManager.pause(defaultQueue, {
        reason: EStateTransitionReason.PERFORMANCE,
      }),
    ).rejects.toThrow(QueueStateTransitionError);
  });

  test('should throw error when resuming an already active queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    await expect(
      stateManager.resume(defaultQueue, {
        reason: EStateTransitionReason.PERFORMANCE,
      }),
    ).rejects.toThrow(QueueStateTransitionError);
  });

  test('should handle multiple queues independently', async () => {
    const queue1 = { name: 'queue1', ns: 'testing' };
    const queue2 = { name: 'queue2', ns: 'testing' };

    await createQueue(queue1, EQueueType.FIFO_QUEUE);
    await createQueue(queue2, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Pause queue1 only
    await stateManager.pause(queue1, {
      reason: EStateTransitionReason.MANUAL,
    });

    const props1 = await queueManager.getProperties(queue1);
    const props2 = await queueManager.getProperties(queue2);

    expect(props1.operationalState).toEqual(EQueueOperationalState.PAUSED);
    expect(props2.operationalState).toEqual(EQueueOperationalState.ACTIVE);
  });

  test('should persist pause reason and metadata', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    const options: TQueueStateTransitionUserOptions = {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Maintenance window',
      metadata: {
        operator: 'admin',
        ticket: 'INC-12345',
      },
    };

    await stateManager.pause(defaultQueue, options);

    const history = await stateManager.getStateHistory(defaultQueue);
    const pauseTransition = history.find(
      (h) => h.to === EQueueOperationalState.PAUSED,
    );

    expect(pauseTransition).toBeDefined();
    expect(pauseTransition?.reason).toEqual(options?.reason);
    expect(pauseTransition?.metadata).toEqual(options?.metadata);
  });

  test('should prevent message consumption when queue is paused', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
    });

    const { producer } = await produceMessage(defaultQueue);

    const consumer = bluebird.promisifyAll(new Consumer());
    const consumeSpy = vi.fn((msg, done) => done());

    await consumer.run();
    await expect(consumer.consume(defaultQueue, consumeSpy)).rejects.toThrow(
      QueuePausedError,
    );

    await consumer.shutdown();
    await producer.shutdown();
  });

  test('should allow message consumption after resuming queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
    });

    const { producer } = await produceMessage(defaultQueue);

    // Resume queue
    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
    });

    const consumer = bluebird.promisifyAll(new Consumer());
    const consumeSpy = vi.fn((msg, done) => done());

    await consumer.run();
    await consumer.consume(defaultQueue, consumeSpy);

    await bluebird.delay(5000);

    expect(consumeSpy).toHaveBeenCalledTimes(1);

    await consumer.shutdown();
    await producer.shutdown();
  });

  test('should get current operational state', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    const activeState = await stateManager.getState(defaultQueue);
    expect(activeState.from).toEqual(null);
    expect(activeState.to).toEqual(EQueueOperationalState.ACTIVE);

    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
    });

    const pausedState = await stateManager.getState(defaultQueue);

    expect(pausedState.from).toEqual(EQueueOperationalState.ACTIVE);
    expect(pausedState.to).toEqual(EQueueOperationalState.PAUSED);
  });

  test('should throw error for non-existent queue', async () => {
    const nonExistentQueue = { name: 'non-existent', ns: 'testing' };
    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    await expect(
      stateManager.pause(nonExistentQueue, {
        reason: EStateTransitionReason.MANUAL,
      }),
    ).rejects.toThrow();

    await expect(stateManager.getState(nonExistentQueue)).rejects.toThrow(
      QueueNotFoundError,
    );
  });

  test('should handle pause/resume with priority queues', async () => {
    const priorityQueue = { name: 'priority-queue', ns: 'testing' };
    await createQueue(priorityQueue, EQueueType.PRIORITY_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Verify initial state
    const props1 = await queueManager.getProperties(priorityQueue);
    expect(props1.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    // Pause the priority queue
    await stateManager.pause(priorityQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Testing pause on priority queue',
    });

    const props2 = await queueManager.getProperties(priorityQueue);
    expect(props2.operationalState).toEqual(EQueueOperationalState.PAUSED);

    // Try to consume from paused priority queue
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    await expect(
      consumer.consume(priorityQueue, (msg, done) => done()),
    ).rejects.toThrow(QueuePausedError);

    // Resume and verify
    await stateManager.resume(priorityQueue, {
      reason: EStateTransitionReason.MANUAL,
    });

    const props3 = await queueManager.getProperties(priorityQueue);
    expect(props3.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    await consumer.shutdown();
  });

  test('should maintain state history with timestamps', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    const history = await stateManager.getStateHistory(defaultQueue);

    expect(history.length).toBeGreaterThan(0);

    // Check that timestamps are valid
    history.forEach((entry) => {
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe('number');
      expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    });

    // Check chronological order
    for (let i = 1; i < history.length; i++) {
      expect(history[i].timestamp).toBeLessThanOrEqual(
        history[i - 1].timestamp,
      );
    }
  });

  test('should handle concurrent state operations gracefully', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Attempt concurrent pauses
    await expect(
      Promise.all([
        stateManager.pause(defaultQueue, {
          reason: EStateTransitionReason.MANUAL,
        }),
        stateManager.pause(defaultQueue, {
          reason: EStateTransitionReason.MANUAL,
        }),
      ]),
    ).rejects.toThrow(); // One should fail

    // Verify final state is paused
    const finalState = await stateManager.getState(defaultQueue);
    expect(finalState.from).toEqual(EQueueOperationalState.ACTIVE);
    expect(finalState.to).toEqual(EQueueOperationalState.PAUSED);

    // Clean up by resuming
    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
    });
  });
});
