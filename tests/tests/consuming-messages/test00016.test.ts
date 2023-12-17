/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
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

  const msg1 = new ProducibleMessage()
    .setQueue('test_queue')
    .setBody('some data');
  const [id1] = await producer.produceAsync(msg1);
  await untilMessageAcknowledged(consumer, id1);

  const msg2 = new ProducibleMessage()
    .setQueue('another_queue')
    .setBody('some data');
  const [id2] = await producer.produceAsync(msg2);
  await untilMessageAcknowledged(consumer, id2);

  await shutDownBaseInstance(consumer);
});
