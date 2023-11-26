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
import { validateTime } from '../../common/validate-time';
import { getQueueRateLimit } from '../../common/queue-rate-limit';

test('Rate limit a queue without priority and check message rate', async () => {
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(
    new Message().setBody('msg 1').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 2').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 3').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 4').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 5').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 6').setQueue(defaultQueue),
  );

  const messages: { ts: number; messageId: string }[] = [];
  const consumer = await getConsumer();

  consumer.on(events.MESSAGE_ACKNOWLEDGED, (messageId: string) => {
    messages.push({ ts: Date.now(), messageId });
  });

  await consumer.runAsync();
  await delay(25000);

  expect(messages.length).toBe(6);

  const diff1 = messages[1].ts - messages[0].ts;
  expect(validateTime(diff1, 0)).toBe(true);

  const diff2 = messages[2].ts - messages[1].ts;
  expect(validateTime(diff2, 0)).toBe(true);

  const diff3 = messages[3].ts - messages[2].ts;
  expect(validateTime(diff3, 10000)).toBe(true);

  const diff4 = messages[4].ts - messages[3].ts;
  expect(validateTime(diff4, 0)).toBe(true);

  const diff5 = messages[5].ts - messages[4].ts;
  expect(validateTime(diff5, 0)).toBe(true);
});
