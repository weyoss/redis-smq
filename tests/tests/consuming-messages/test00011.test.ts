/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Given many consumers, a message is delivered only to one consumer', async () => {
  await createQueue(defaultQueue, false);

  const consumer1 = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      cb();
    }),
  });
  let unacks1 = 0;
  let acks1 = 0;
  consumer1
    .on(events.MESSAGE_UNACKNOWLEDGED, () => {
      unacks1 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      acks1 += 1;
    });

  /**
   *
   */
  const consumer2 = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      cb();
    }),
  });
  let unacks2 = 0;
  let acks2 = 0;
  consumer2
    .on(events.MESSAGE_UNACKNOWLEDGED, () => {
      unacks2 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      acks2 += 1;
    });

  await consumer1.runAsync();
  await consumer2.runAsync();

  /**
   *
   */
  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  /**
   *
   */
  await delay(20000);

  /**
   *
   */
  expect(unacks1).toBe(0);
  expect(unacks2).toBe(0);
  expect(acks1 + acks2).toBe(1);
});
