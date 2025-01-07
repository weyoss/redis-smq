/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { jest, test } from '@jest/globals';
import { ICallback } from 'redis-smq-common';
import { ProducibleMessage } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import {
  untilMessageAcknowledged,
  untilMessageUnacknowledged,
} from '../../common/events.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('A message is unacknowledged when messageConsumeTimeout is exceeded', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  let consumeCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: unknown, cb: ICallback<void>) => {
      if (consumeCount === 0) setTimeout(() => cb(), 5000);
      else if (consumeCount === 1) cb();
      else throw new Error('Unexpected call');
      consumeCount += 1;
    }),
  });

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setConsumeTimeout(2000)
    .setRetryDelay(6000);

  await producer.produceAsync(msg);
  consumer.run(() => void 0);
  await untilMessageUnacknowledged(consumer);
  await untilMessageAcknowledged(consumer);
});
