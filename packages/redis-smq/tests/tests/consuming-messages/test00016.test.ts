/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  Consumer,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Consume message from different queues using a single consumer instance: case 2', async () => {
  await createQueue('test_queue', false);
  await createQueue('another_queue', false);

  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.consumeAsync(
    'test_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      setTimeout(() => cb(), 1000);
    },
  );
  await consumer.consumeAsync(
    'another_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      cb();
    },
  );
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
