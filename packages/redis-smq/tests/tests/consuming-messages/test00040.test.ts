/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from 'vitest';
import { IMessageTransferable, ProducibleMessage } from '../../../index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageUnacknowledged } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Message handler promise: reject()', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.run();

  const consumer = getConsumer({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    messageHandler: async (msg1: IMessageTransferable) => {
      return Promise.reject();
    },
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const [messageId] = await producer.produce(msg);
  consumer.run(() => void 0);

  await untilMessageUnacknowledged(consumer, messageId);
});
