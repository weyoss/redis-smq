/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { ProducerMessageNotPublishedError } from '../../../src/lib/producer/errors';
import { getProducer } from '../../common/producer';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
} from '../../../types';
import { getQueue } from '../../common/queue';

test('Producing a message and expecting different kind of failures', async () => {
  const queue = await getQueue();
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
    const m = e instanceof ProducerMessageNotPublishedError ? e.message : '';
    expect(m).toBe('PRIORITY_QUEUING_NOT_ENABLED');
  }

  try {
    const msg1 = new ProducibleMessage().setQueue('test1').setBody('body');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotPublishedError ? e.message : '';
    expect(m).toBe('MESSAGE_PRIORITY_REQUIRED');
  }

  try {
    const msg2 = new ProducibleMessage().setQueue('test2').setBody('body');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotPublishedError ? e.message : '';
    expect(m).toBe('QUEUE_NOT_FOUND');
  }
});
