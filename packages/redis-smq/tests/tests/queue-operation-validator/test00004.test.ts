/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, describe } from 'vitest';
import { createQueue } from '../../common/message-producing-consuming.js';
import { EQueueType, QueueOperationValidator } from '../../../src/index.js';
import bluebird from 'bluebird';

// Promisify QueueOperationValidator
const QueueOperationValidatorAsync = bluebird.promisifyAll(
  QueueOperationValidator,
);

describe('QueueOperationValidator: Edge cases and error handling', () => {
  test('should handle non-existent queue gracefully', async () => {
    const nonExistentQueue = { name: 'non-existent', ns: 'testing' };

    await expect(
      QueueOperationValidatorAsync.canConsumeAsync(nonExistentQueue),
    ).rejects.toThrow();
  });

  test('should handle string queue parameter', async () => {
    const queueName = `queue-${Date.now()}`;
    await createQueue(queueName, EQueueType.FIFO_QUEUE);

    const allowed =
      await QueueOperationValidatorAsync.canProduceAsync(queueName);
    expect(allowed).toBe(true);
  });

  test('should handle queue with namespace', async () => {
    const queueWithNs = { name: 'namespaced-queue', ns: 'custom-namespace' };
    await createQueue(queueWithNs, EQueueType.FIFO_QUEUE);

    const allowed =
      await QueueOperationValidatorAsync.canConsumeAsync(queueWithNs);
    expect(allowed).toBe(true);
  });
});
