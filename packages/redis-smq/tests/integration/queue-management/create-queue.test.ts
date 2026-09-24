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
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
  errors,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for creating a queue.
 *
 * `QueueManager.save(queue, type, deliveryModel)` creates a queue. The
 * queue is registered in the namespace's queue set, its properties
 * hash is written with the initial configuration, and its operational
 * state begins as `ACTIVE`.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Creating a queue', () => {
  // -------------------------------------------------------------------------
  // Queue types
  // -------------------------------------------------------------------------

  describe('queue types', () => {
    it.each<[string, EQueueType]>([
      ['FIFO_QUEUE', EQueueType.FIFO_QUEUE],
      ['LIFO_QUEUE', EQueueType.LIFO_QUEUE],
      ['PRIORITY_QUEUE', EQueueType.PRIORITY_QUEUE],
    ])('creates a queue with the %s type', async (_label, queueType) => {
      const queue = uniqueQueue('create-type');

      await createQueue(queue, queueType);

      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);

      expect(props.queueType).toBe(queueType);
    });
  });

  // -------------------------------------------------------------------------
  // Delivery models
  // -------------------------------------------------------------------------

  describe('delivery models', () => {
    it.each<[string, EQueueDeliveryModel]>([
      ['POINT_TO_POINT', EQueueDeliveryModel.POINT_TO_POINT],
      ['PUB_SUB', EQueueDeliveryModel.PUB_SUB],
    ])('creates a queue with the %s delivery model', async (_label, model) => {
      const queue = uniqueQueue('create-model');

      await createQueue(queue, EQueueType.FIFO_QUEUE, model);

      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);

      expect(props.deliveryModel).toBe(model);
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts with the ACTIVE operational state', async () => {
      // A freshly created queue is operational. Every operation
      // proceeds without a state-change step in between.
      const queue = uniqueQueue('create-active');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);

      expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);
    });

    it('starts with all message counts at zero', async () => {
      const queue = uniqueQueue('create-zero-counts');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);

      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      const total = await queueMessages.countMessages(queue);
      expect(total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate detection
  // -------------------------------------------------------------------------

  describe('duplicate detection', () => {
    it('rejects a second save of the same queue with QueueAlreadyExistsError', async () => {
      const queue = uniqueQueue('create-duplicate');
      const queueManager = RedisSMQ.createQueueManager();

      await queueManager.save(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
      );

      await expect(
        queueManager.save(
          queue,
          EQueueType.FIFO_QUEUE,
          EQueueDeliveryModel.POINT_TO_POINT,
        ),
      ).rejects.toThrow(errors.QueueAlreadyExistsError);
    });

    it('does not modify the existing queue on a rejected second save', async () => {
      const queue = uniqueQueue('create-duplicate-no-mutate');
      const queueManager = RedisSMQ.createQueueManager();

      await queueManager.save(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
      );

      // Second save with different parameters. If RedisSMQ
      // applied them and then rejected, the queue would become a
      // priority queue.
      await expect(
        queueManager.save(
          queue,
          EQueueType.PRIORITY_QUEUE,
          EQueueDeliveryModel.POINT_TO_POINT,
        ),
      ).rejects.toThrow(errors.QueueAlreadyExistsError);

      const props = await queueManager.getProperties(queue);
      expect(props.queueType).toBe(EQueueType.FIFO_QUEUE);
      expect(props.deliveryModel).toBe(EQueueDeliveryModel.POINT_TO_POINT);
    });
  });

  // -------------------------------------------------------------------------
  // Name normalization
  // -------------------------------------------------------------------------

  describe('name normalization', () => {
    it('treats mixed-case queue names as the same queue', async () => {
      const namespace = 'testing';
      const mixedCase: IQueueParams = {
        ns: namespace,
        name: `MixedCase-${Date.now()}`,
      };
      const lowerCase: IQueueParams = {
        ns: namespace,
        name: mixedCase.name.toLowerCase(),
      };

      const queueManager = RedisSMQ.createQueueManager();
      await queueManager.save(
        mixedCase,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
      );

      // Read through the lowercase form. If normalization works, the
      // lookup finds the queue and returns its properties. If
      // normalization is broken, the lookup fails with a
      // `QueueNotFoundError` and the test fails with that specific
      // class — the failure message names what RedisSMQ looked
      // for, not a vague "not found".
      const props = await queueManager.getProperties(lowerCase);
      expect(props.queueType).toBe(EQueueType.FIFO_QUEUE);

      // And the reverse direction: reading through the original
      // mixed-case form also works. Both casings resolve to the same
      // underlying storage.
      const propsFromMixed = await queueManager.getProperties(mixedCase);
      expect(propsFromMixed.queueType).toBe(EQueueType.FIFO_QUEUE);
    });
  });
});
