/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import {
  EQueueType,
  IQueueParams,
  QueueOperationValidator,
} from '../../../src/index.js';
import bluebird from 'bluebird';

// Promisify QueueOperationValidator
const QueueOperationValidatorAsync = bluebird.promisifyAll(
  QueueOperationValidator,
);

describe('QueueOperationValidator: Concurrent validation', () => {
  let queue: IQueueParams;

  beforeEach(async () => {
    queue = getDefaultQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);
  });

  test('should handle concurrent validation requests', async () => {
    const validationPromises = Array(10)
      .fill(null)
      .map(() => {
        return QueueOperationValidatorAsync.canProduce(queue);
      });

    const results = await Promise.all(validationPromises);
    results.forEach((result) => expect(result).toBe(true));
  });

  test('should handle mixed operation types concurrently', async () => {
    const operations = [
      QueueOperationValidatorAsync.canConsume(queue),
      QueueOperationValidatorAsync.canProduce(queue),
      QueueOperationValidatorAsync.canDelete(queue),
      QueueOperationValidatorAsync.canPurge(queue),
    ];

    const results = await Promise.all(operations);
    results.forEach((result) => expect(result).toBe(true));
  });
});
