/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages';

test('Schedule a message: messageManager.getScheduledMessages()', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const msg1 = new MessageEnvelope();
  msg1.setScheduledDelay(30000);
  msg1
    .setScheduledCRON('0 * * * * *')
    .setBody({ hello: 'world1' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg1);

  const msg2 = new MessageEnvelope();
  msg2
    .setScheduledDelay(60000)
    .setBody({ hello: 'world2' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg2);

  const msg3 = new MessageEnvelope();
  msg3
    .setScheduledDelay(90000)
    .setBody({ hello: 'world3' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg3);

  const queueScheduled = await getQueueScheduledMessages();

  // Page 1
  const pageOne = await queueScheduled.getMessagesAsync(defaultQueue, 0, 100);
  expect(pageOne.totalItems).toEqual(3);
  expect(pageOne.items.length).toEqual(3);
  expect(pageOne.items[0].getId()).toEqual(msg1.getMessageState()?.getId());
  expect(pageOne.items[1].getId()).toEqual(msg2.getMessageState()?.getId());
  expect(pageOne.items[2].getId()).toEqual(msg3.getMessageState()?.getId());
});
