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
} from '../../common/message-producing-consuming.js';
import {
  EQueueOperationalState,
  EQueueType,
  IQueueParams,
  QueueOperationValidator,
} from '../../../src/index.js';
import bluebird from 'bluebird';
import { getQueueManager } from '../../common/queue-manager.js';

// Promisify QueueOperationValidator
const QueueOperationValidatorAsync = bluebird.promisifyAll(
  QueueOperationValidator,
);

describe('QueueOperationValidator: ACTIVE state operations', () => {
  let queue: IQueueParams;

  beforeEach(async () => {
    queue = getDefaultQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);
  });

  test('should allow consume when queue is ACTIVE', async () => {
    // Verify queue is ACTIVE
    const queueManager = await getQueueManager();
    const props = await queueManager.getPropertiesAsync(queue);
    expect(props.operationalState).toEqual(EQueueOperationalState.ACTIVE);

    const allowed = await QueueOperationValidatorAsync.canConsumeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow produce when queue is ACTIVE', async () => {
    const allowed = await QueueOperationValidatorAsync.canProduceAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete when queue is ACTIVE', async () => {
    const allowed = await QueueOperationValidatorAsync.canDeleteAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete message when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canDeleteMessageAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow purge when queue is ACTIVE', async () => {
    const allowed = await QueueOperationValidatorAsync.canPurgeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow requeue when queue is ACTIVE', async () => {
    const allowed = await QueueOperationValidatorAsync.canRequeueAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow set rate limit when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canSetRateLimitAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow clear rate limit when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canClearRateLimitAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow create consumer group when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canCreateConsumerGroupAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow delete consumer group when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canDeleteConsumerGroupAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow bind exchange when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canBindExchangeAsync(queue);
    expect(allowed).toBe(true);
  });

  test('should allow unbind exchange when queue is ACTIVE', async () => {
    const allowed =
      await QueueOperationValidatorAsync.canUnbindExchangeAsync(queue);
    expect(allowed).toBe(true);
  });
});
