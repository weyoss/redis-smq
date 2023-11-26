/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { untilMessageAcknowledged } from '../../common/events';
import { getProducer } from '../../common/producer';
import { createQueue } from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Consume message from different queues using a single consumer instance: case 2', async () => {
  await createQueue('test_queue', false);
  await createQueue('another_queue', false);

  const consumer = promisifyAll(new Consumer());
  await consumer.consumeAsync('test_queue', (msg, cb) => {
    setTimeout(cb, 1000);
  });
  await consumer.consumeAsync('another_queue', (msg, cb) => {
    cb();
  });
  await consumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  const msg1 = new Message().setQueue('test_queue').setBody('some data');
  const { messages } = await producer.produceAsync(msg1);
  await untilMessageAcknowledged(consumer, messages[0]);

  const msg2 = new Message().setQueue('another_queue').setBody('some data');
  const { messages: m } = await producer.produceAsync(msg2);
  await untilMessageAcknowledged(consumer, m[0]);

  await shutDownBaseInstance(consumer);
});
