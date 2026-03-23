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

process.on('warning', (warning) => {
  console.log('TRACING', warning);
});

test('Set a rate limit for a queue and consume message using many consumers', async () => {
  const eventBus = await getEventBus();

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.set(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const messages: { ts: number; messageId: string }[] = [];
  eventBus.on(
    'consumer.consumeMessage.messageAcknowledged',
    (messageId: string) => {
      messages.push({ ts: Date.now(), messageId });
    },
  );

  for (let i = 0; i < 6; i += 1) {
    const consumer = getConsumer();
    await consumer.run();
  }

  const producer = getProducer();
  await producer.run();

  for (let i = 0; i < 100; i += 1) {
    await producer.produce(
      new ProducibleMessage().setBody(`msg ${i}`).setQueue(getDefaultQueue()),
    );
  }

  await bluebird.delay(25000);
  expect(messages.length).toBeGreaterThanOrEqual(6);
  expect(messages.length).toBeLessThanOrEqual(9);

  for (let i = 0; i < messages.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const diff = messages[i].ts - messages[i - 1].ts;
    if (i % 3 === 0) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else {
      expect(validateTime(diff, 1)).toBe(true);
    }
  }
});
