/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ProducibleMessage } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueRateLimit } from '../../common/queue-rate-limit.js';
import { validateTime } from '../../common/validate-time.js';

test('Rate limit a queue without priority and check message rate', async () => {
  const eventBus = await getEventBus();

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 1').setQueue(getDefaultQueue()),
  );
  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 2').setQueue(getDefaultQueue()),
  );
  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 3').setQueue(getDefaultQueue()),
  );
  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 4').setQueue(getDefaultQueue()),
  );
  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 5').setQueue(getDefaultQueue()),
  );
  await producer.produceAsync(
    new ProducibleMessage().setBody('msg 6').setQueue(getDefaultQueue()),
  );

  const messages: { ts: number; messageId: string }[] = [];
  const consumer = await getConsumer();

  eventBus.on(
    'consumer.consumeMessage.messageAcknowledged',
    (messageId: string) => {
      messages.push({ ts: Date.now(), messageId });
    },
  );

  await consumer.runAsync();
  await bluebird.delay(25000);

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
