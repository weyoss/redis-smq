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

describe('QueueOperationValidator: STOPPED state operations', () => {
  let queue: IQueueParams;

  beforeEach(async () => {
    queue = getDefaultQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);
    const stateManager = bluebird.promisifyAll(new QueueStateManager());
    await stateManager.stopAsync(queue, {
      reason: EStateTransitionReason.SCHEDULED,
      description: 'Testing stopped state',
    });
  });

  test('should not allow produce when queue is STOPPED', async () => {
    const allowed = await QueueOperationValidatorAsync.canProduceAsync(queue);
    expect(allowed).toBe(false);
  });

  test('should not allow consume when queue is STOPPED', async () => {
    const allowed = await QueueOperationValidatorAsync.canConsumeAsync(queue);
    expect(allowed).toBe(false);
  });

  test('should allow delete when queue is STOPPED', async () => {
    const allowed = await QueueOperationValidatorAsync.canDeleteAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete message when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canDeleteMessageAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow purge when queue is STOPPED', async () => {
    const allowed = await QueueOperationValidatorAsync.canPurgeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow requeue when queue is STOPPED', async () => {
    const allowed = await QueueOperationValidatorAsync.canRequeueAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow set rate limit when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canSetRateLimitAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow clear rate limit when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canClearRateLimitAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow create consumer group when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canCreateConsumerGroupAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete consumer group when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canDeleteConsumerGroupAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow bind exchange when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canBindExchangeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow unbind exchange when queue is STOPPED', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canUnbindExchangeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should actually prevent message production', async () => {
    // Attempt to produce message - should throw
    await expect(produceMessage(queue)).rejects.toThrow();
  });
});
