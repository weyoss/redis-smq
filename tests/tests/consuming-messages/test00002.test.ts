/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from '@jest/globals';
import { ProducibleMessage } from '../../../index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Produce and consume 1 message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const [messageId] = await producer.produceAsync(msg);
  consumer.run(() => void 0);

  await untilMessageAcknowledged(consumer, messageId);
});
