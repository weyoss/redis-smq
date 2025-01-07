/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import { ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages.js';

test('Schedule a message: messageManager.getScheduledMessages()', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const msg1 = new ProducibleMessage();
  msg1.setScheduledDelay(30000);
  msg1
    .setScheduledCRON('0 * * * * *')
    .setBody({ hello: 'world1' })
    .setQueue(defaultQueue);
  const [id1] = await producer.produceAsync(msg1);

  const msg2 = new ProducibleMessage();
  msg2
    .setScheduledDelay(60000)
    .setBody({ hello: 'world2' })
    .setQueue(defaultQueue);
  const [id2] = await producer.produceAsync(msg2);

  const msg3 = new ProducibleMessage();
  msg3
    .setScheduledDelay(90000)
    .setBody({ hello: 'world3' })
    .setQueue(defaultQueue);
  const [id3] = await producer.produceAsync(msg3);

  const queueScheduled = await getQueueScheduledMessages();

  // Page 1
  const pageOne = await queueScheduled.getMessagesAsync(defaultQueue, 0, 100);
  expect(pageOne.totalItems).toEqual(3);
  expect(pageOne.items.length).toEqual(3);
  expect(pageOne.items[0].id).toEqual(id1);
  expect(pageOne.items[1].id).toEqual(id2);
  expect(pageOne.items[2].id).toEqual(id3);
});
