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

describe('QueueOperationValidator: Different queue types', () => {
  test('should validate operations for priority queue', async () => {
    const priorityQueue = { name: 'priority-validator-queue', ns: 'testing' };
    await createQueue(priorityQueue, EQueueType.PRIORITY_QUEUE);

    const consumeAllowed =
      await QueueOperationValidatorAsync.canConsume(priorityQueue);
    expect(consumeAllowed).toBe(true);

    const produceAllowed =
      await QueueOperationValidatorAsync.canProduce(priorityQueue);
    expect(produceAllowed).toBe(true);
  });

  test('should validate operations for LIFO queue', async () => {
    const lifoQueue = { name: 'lifo-validator-queue', ns: 'testing' };
    await createQueue(lifoQueue, EQueueType.LIFO_QUEUE);

    const allowed = await QueueOperationValidatorAsync.canConsume(lifoQueue);
    expect(allowed).toBe(true);
  });
});
