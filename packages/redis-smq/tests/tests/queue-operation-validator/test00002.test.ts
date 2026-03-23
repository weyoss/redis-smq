/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, describe, beforeEach } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';
import {
  EStateTransitionReason,
  EQueueType,
  QueueStateManager,
  QueueOperationValidator,
  IQueueParams,
} from '../../../src/index.js';
import bluebird from 'bluebird';

// Promisify QueueOperationValidator
const QueueOperationValidatorAsync = bluebird.promisifyAll(
  QueueOperationValidator,
);

describe('QueueOperationValidator: PAUSED state operations', () => {
  let queue: IQueueParams;

  beforeEach(async () => {
    queue = getDefaultQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);
    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.pause(queue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'Testing paused state',
    });
  });

  test('should not allow consume when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canConsume(queue);
    expect(allowed).toBe(false);
  });

  test('should allow produce when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canProduce(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canDelete(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete message when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canDeleteMessage(queue);
    expect(allowed).toBe(true);
  });

  test('should allow purge when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canPurge(queue);
    expect(allowed).toBe(true);
  });

  test('should allow requeue when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canRequeue(queue);
    expect(allowed).toBe(true);
  });

  test('should allow set rate limit when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canSetRateLimit(queue);
    expect(allowed).toBe(true);
  });

  test('should allow clear rate limit when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canClearRateLimit(queue);
    expect(allowed).toBe(true);
  });

  test('should allow create consumer group when queue is PAUSED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canCreateConsumerGroup(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete consumer group when queue is PAUSED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canDeleteConsumerGroup(queue);
    expect(allowed).toBe(true);
  });

  test('should allow bind exchange when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canBindExchange(queue);
    expect(allowed).toBe(true);
  });

  test('should allow unbind exchange when queue is PAUSED', async () => {
    const allowed = await QueueOperationValidatorAsync.canUnbindExchange(queue);
    expect(allowed).toBe(true);
  });

  test('should actually prevent message consumption', async () => {
    const allowed = await QueueOperationValidatorAsync.canConsume(queue);
    expect(allowed).toBe(false);
  });

  test('should allow message production to paused queue', async () => {
    // Verify we can produce messages
    const { producer, messageId } = await produceMessage(queue);
    expect(messageId).toBeDefined();
    await producer.shutdown();
  });
});
