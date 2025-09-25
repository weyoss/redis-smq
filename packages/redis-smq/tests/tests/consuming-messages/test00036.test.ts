/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  ProducibleMessage,
} from '../../../src/index.js';
import { getProducer } from '../../common/producer.js';
import { getQueueManager } from '../../common/queue-manager.js';
import {
  MessagePriorityRequiredError,
  PriorityQueuingNotEnabledError,
  QueueNotFoundError,
} from '../../../src/errors/index.js';

test('Producing a message and expecting different kind of failures', async () => {
  const queue = await getQueueManager();
  await queue.saveAsync(
    'test0',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await queue.saveAsync(
    'test1',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const producer = getProducer();
  await producer.runAsync();

  try {
    const msg = new ProducibleMessage()
      .setQueue('test0')
      .setBody('body')
      .setPriority(EMessagePriority.LOW);
    await producer.produceAsync(msg);
  } catch (e: unknown) {
    expect(e instanceof PriorityQueuingNotEnabledError).toBe(true);
  }

  try {
    const msg1 = new ProducibleMessage().setQueue('test1').setBody('body');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    expect(e instanceof MessagePriorityRequiredError).toBe(true);
  }

  try {
    const msg2 = new ProducibleMessage().setQueue('test2').setBody('body');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    expect(e instanceof QueueNotFoundError).toBe(true);
  }
});
