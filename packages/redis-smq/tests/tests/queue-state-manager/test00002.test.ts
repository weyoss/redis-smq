/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, test, vi } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';
import {
  Consumer,
  EQueueOperationalState,
  EQueueType,
  EStateTransitionReason,
  QueueManager,
  QueueStateManager,
} from '../../../src/index.js';
import bluebird from 'bluebird';
import {
  QueueStateTransitionError,
  QueueStoppedError,
} from '../../../src/errors/index.js';

describe('QueueStateManager: stop()/resume()/getStateHistory()/getState()', () => {
  test('should stop an active queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const queueManager = bluebird.promisifyAll(new QueueManager());
    const props1 = await queueManager.getProperties(defaultQueue);
    expect(props1.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Stop the queue with metadata
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Planned maintenance',
      metadata: {
        estimatedDowntime: '30 minutes',
      },
    });

    const props2 = await queueManager.getProperties(defaultQueue);
    expect(props2.operationalState).toEqual(EQueueOperationalState.STOPPED);
  });

  test('should stop a paused queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // First pause the queue
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Initial pause',
    });

    const props1 = await queueManager.getProperties(defaultQueue);
    expect(props1.operationalState).toEqual(EQueueOperationalState.PAUSED);

    // Then stop it
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Stopping from paused state',
    });

    const props2 = await queueManager.getProperties(defaultQueue);
    expect(props2.operationalState).toEqual(EQueueOperationalState.STOPPED);
  });

  test('should throw error when stopping an already stopped queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    await expect(
      stateManager.stop(defaultQueue, {
        reason: EStateTransitionReason.SCHEDULED,
      }),
    ).rejects.toThrow(QueueStateTransitionError);
  });

  test('should record stop in state history with proper transitions', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Create a sequence of state changes including stop
    await stateManager.pause(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Pause before stop',
    });

    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Resume before stop',
    });

    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Final stop',
      metadata: {
        ticket: 'INC-67890',
      },
    });

    const history = await stateManager.getStateHistory(defaultQueue);
    expect(history.length).toEqual(4);

    // Should have: ACTIVE (initial) -> PAUSED -> ACTIVE -> STOPPED
    history.reverse();

    // Check the stop transition
    const stopTransition = history[3];
    expect(stopTransition.from).toEqual(EQueueOperationalState.ACTIVE);
    expect(stopTransition.to).toEqual(EQueueOperationalState.STOPPED);
    expect(stopTransition.metadata).toBeDefined();
    expect(stopTransition.reason).toEqual(EStateTransitionReason.SCHEDULED);
    expect(stopTransition.description).toEqual('Final stop');
    expect(stopTransition.metadata?.ticket).toEqual('INC-67890');
  });

  test('should prevent any operations on stopped queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    // Try to produce message
    await expect(produceMessage(defaultQueue)).rejects.toThrow(
      QueueStoppedError,
    );

    // Try to consume
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    await expect(
      consumer.consume(defaultQueue, (msg, done) => done()),
    ).rejects.toThrow(QueueStoppedError);

    await consumer.shutdown();
  });

  test('should prevent pausing a stopped queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    await expect(
      stateManager.pause(defaultQueue, {
        reason: EStateTransitionReason.MANUAL,
      }),
    ).rejects.toThrow(QueueStateTransitionError);
  });

  test('should allow resuming a stopped queue', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Stop the queue
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'System maintenance',
    });

    const props1 = await queueManager.getProperties(defaultQueue);
    expect(props1.operationalState).toEqual(EQueueOperationalState.STOPPED);

    // Force restart (resume from stopped state)
    await stateManager.resume(defaultQueue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Restart after maintenance',
    });

    const props2 = await queueManager.getProperties(defaultQueue);
    expect(props2.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    // Verify operations work again
    const { producer } = await produceMessage(defaultQueue);

    const consumer = bluebird.promisifyAll(new Consumer());
    const consumeSpy = vi.fn((msg, done) => done());

    await consumer.run();
    await consumer.consume(defaultQueue, consumeSpy);

    await bluebird.delay(5000);

    expect(consumeSpy).toHaveBeenCalledTimes(1);

    await consumer.shutdown();
    await producer.shutdown();
  });

  test('should handle stop on multiple queues independently', async () => {
    const queue1 = { name: 'queue1', ns: 'testing' };
    const queue2 = { name: 'queue2', ns: 'testing' };
    const queue3 = { name: 'queue3', ns: 'testing' };

    await createQueue(queue1, EQueueType.FIFO_QUEUE);
    await createQueue(queue2, EQueueType.FIFO_QUEUE);
    await createQueue(queue3, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Stop queue1 and queue2, leave queue3 active
    await stateManager.stop(queue1, {
      reason: EStateTransitionReason.SCHEDULED,
    });
    await stateManager.stop(queue2, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    const props1 = await queueManager.getProperties(queue1);
    const props2 = await queueManager.getProperties(queue2);
    const props3 = await queueManager.getProperties(queue3);

    expect(props1.operationalState).toEqual(EQueueOperationalState.STOPPED);
    expect(props2.operationalState).toEqual(EQueueOperationalState.STOPPED);
    expect(props3.operationalState).toEqual(EQueueOperationalState.ACTIVE);
  });

  test('should maintain detailed stop metadata', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    const options = {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Emergency maintenance',
      metadata: {
        operator: 'system-admin',
        ticket: 'EMERG-789',
        severity: 'high',
        estimatedDuration: '2 hours',
        affectedServices: ['consumer', 'producer'],
      },
    };

    await stateManager.stop(defaultQueue, options);

    const history = await stateManager.getStateHistory(defaultQueue);
    const stopTransition = history.find(
      (h) => h.to === EQueueOperationalState.STOPPED,
    );

    expect(stopTransition).toBeDefined();
    expect(stopTransition?.metadata).toMatchObject(options.metadata);
  });

  test('should prevent message production when queue is stopped', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    // Attempt to produce message
    await expect(produceMessage(defaultQueue)).rejects.toThrow(
      QueueStoppedError,
    );
  });

  test('should handle stop operation with priority queues', async () => {
    const priorityQueue = { name: 'priority-stop-queue', ns: 'testing' };
    await createQueue(priorityQueue, EQueueType.PRIORITY_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Stop the priority queue
    await stateManager.stop(priorityQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Priority queue maintenance',
    });

    const props = await queueManager.getProperties(priorityQueue);
    expect(props.operationalState).toEqual(EQueueOperationalState.STOPPED);

    // Try to consume from stopped priority queue
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    await expect(
      consumer.consume(priorityQueue, (msg, done) => done()),
    ).rejects.toThrow(QueueStoppedError);

    await consumer.shutdown();
  });

  test('should handle concurrent stop operations gracefully', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Attempt concurrent stops
    await expect(
      Promise.all([
        stateManager.stop(defaultQueue, {
          reason: EStateTransitionReason.SCHEDULED,
        }),
        stateManager.stop(defaultQueue, {
          reason: EStateTransitionReason.SCHEDULED,
        }),
        stateManager.stop(defaultQueue, {
          reason: EStateTransitionReason.SCHEDULED,
        }),
      ]),
    ).rejects.toThrow(); // Only one should succeed

    // Verify final state is stopped
    const finalState = await stateManager.getState(defaultQueue);
    expect(finalState.to).toEqual(EQueueOperationalState.STOPPED);
  });

  test('should not allow operations after stop even with existing consumers', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    // Start a consumer first
    const consumer = bluebird.promisifyAll(new Consumer());
    await consumer.run();

    const consumeSpy = vi.fn((msg, done) => done());
    consumer.consume(defaultQueue, consumeSpy, () => void 0);

    // Produce a message
    const { producer } = await produceMessage(defaultQueue);

    // Stop the queue
    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
    });

    // Wait a bit to ensure no messages are consumed after stop
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Consumer should not receive the message
    expect(consumeSpy).not.toHaveBeenCalled();

    await consumer.shutdown();
    await producer.shutdown();
  });

  test('should preserve stopped state across system restarts', async () => {
    const defaultQueue = getDefaultQueue();
    await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

    const stateManager = bluebird.promisifyAll(new QueueStateManager());

    // Stop the queue
    await stateManager.stop(defaultQueue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Permanent stop',
    });

    // Create new instances (simulating restart)
    const newStateManager = bluebird.promisifyAll(new QueueStateManager());
    const queueManager = bluebird.promisifyAll(new QueueManager());

    // Verify state is still stopped
    const props = await queueManager.getProperties(defaultQueue);
    expect(props.operationalState).toEqual(EQueueOperationalState.STOPPED);

    const state = await newStateManager.getState(defaultQueue);
    expect(state.to).toEqual(EQueueOperationalState.STOPPED);
  });
});
