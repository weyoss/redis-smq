/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { delay } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Async exceptions are caught when consuming a message', async () => {
  const producer = getProducer();
  await producer.runAsync();

  await createQueue(defaultQueue, false);

  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      callCount += 1;
      if (callCount === 1) {
        setTimeout(() => {
          cb(new Error('Async error'));
        }, 2000);
      } else if (callCount === 2) cb();
      else throw new Error('Unexpected call');
    }),
  });

  let unacknowledged = 0;
  consumer.on('messageUnacknowledged', () => {
    unacknowledged += 1;
  });

  let acknowledged = 0;
  consumer.on('messageAcknowledged', () => {
    acknowledged += 1;
  });

  const msg = new MessageEnvelope();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await delay(15000);
  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
