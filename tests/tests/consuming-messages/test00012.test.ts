/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';

test('An unacknowledged message is delayed given messageRetryDelay > 0 and messageRetryThreshold > 0 and is not exceeded', async () => {
  await createQueue(defaultQueue, false);

  const timestamps: number[] = [];
  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      timestamps.push(Date.now());
      callCount += 1;
      if (callCount < 5) {
        throw new Error('Explicit error');
      } else if (callCount === 5) {
        cb();
      } else throw new Error('Unexpected call');
    }),
  });

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });

  let acks = 0;
  consumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    acks += 1;
  });

  const msg = new Message();
  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setRetryDelay(10000)
    .setRetryThreshold(5);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  consumer.run();

  await untilMessageAcknowledged(consumer);

  expect(unacks).toBe(4);
  expect(acks).toBe(1);

  // consumer workers are run each ~ 5 sec
  for (let i = 0; i < timestamps.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const diff = timestamps[i] - timestamps[i - 1];
    if (i === 1) {
      expect(validateTime(diff, 11000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 11000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 11000)).toBe(true);
    } else {
      expect(validateTime(diff, 11000)).toBe(true);
    }
  }
});
