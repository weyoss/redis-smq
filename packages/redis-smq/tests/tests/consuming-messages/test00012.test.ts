/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable, ProducibleMessage } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { validateTime } from '../../common/validate-time.js';

test('An unacknowledged message is delayed given messageRetryDelay > 0 and messageRetryThreshold > 0 and is not exceeded', async () => {
  const retryThreshold = 5;
  const eventBus = await getEventBus();

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const timestamps: number[] = [];
  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: vitest.fn(
      (msg: IMessageTransferable, cb: ICallback<void>) => {
        timestamps.push(Date.now());
        callCount += 1;
        if (callCount < retryThreshold) {
          throw new Error('Explicit error');
        } else if (callCount === retryThreshold) {
          cb();
        } else throw new Error('Unexpected call');
      },
    ),
  });

  let unacks = 0;
  eventBus.on('consumer.consumeMessage.messageUnacknowledged', () => {
    unacks += 1;
  });

  let acks = 0;
  eventBus.on('consumer.consumeMessage.messageAcknowledged', () => {
    acks += 1;
  });

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryDelay(10000)
    .setRetryThreshold(retryThreshold);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  consumer.run(() => void 0);

  await untilMessageAcknowledged(consumer);

  expect(unacks).toBe(retryThreshold - 1);
  expect(acks).toBe(1);

  // consumer workers are run each ~ 5 sec
  for (let i = 0; i < timestamps.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const diff = timestamps[i] - timestamps[i - 1];
    expect(validateTime(diff, 11000, 5000)).toBe(true);
  }
});
