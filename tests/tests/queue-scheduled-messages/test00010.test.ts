/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { ProducerMessageNotScheduledError } from '../../../src/lib/producer/errors';
import { getProducer } from '../../common/producer';
import { EMessagePriority, EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Scheduling a message and expecting different kind of failures', async () => {
  const queue = await getQueue();
  await queue.saveAsync('test0', EQueueType.LIFO_QUEUE);
  await queue.saveAsync('test1', EQueueType.PRIORITY_QUEUE);

  const producer = getProducer();
  await producer.runAsync();

  try {
    const msg = new MessageEnvelope()
      .setQueue('test0')
      .setBody('body')
      .setPriority(EMessagePriority.LOW)
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('PRIORITY_QUEUING_NOT_ENABLED');
  }

  try {
    const msg1 = new MessageEnvelope()
      .setQueue('test1')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('MESSAGE_PRIORITY_REQUIRED');
  }

  try {
    const msg2 = new MessageEnvelope()
      .setQueue('test2')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('QUEUE_NOT_FOUND');
  }
});
