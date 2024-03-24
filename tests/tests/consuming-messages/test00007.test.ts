/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect, jest } from '@jest/globals';
import { ICallback } from 'redis-smq-common';
import { IMessageParams, ProducibleMessage } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Unacknowledged message are re-queued when messageRetryThreshold is not exceeded', async () => {
  const eventBus = await getEventBus();
  const producer = getProducer();
  await producer.runAsync();

  await createQueue(defaultQueue, false);

  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: IMessageParams, cb: ICallback<void>) => {
      callCount += 1;
      if (callCount === 1) throw new Error('Explicit error');
      else if (callCount === 2) cb();
      else throw new Error('Unexpected call');
    }),
  });

  let unacknowledged = 0;
  eventBus.on('consumer.consumeMessage.messageUnacknowledged', () => {
    unacknowledged += 1;
  });

  let acknowledged = 0;
  eventBus.on('consumer.consumeMessage.messageAcknowledged', () => {
    acknowledged += 1;
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run(() => void 0);

  await untilMessageAcknowledged(consumer);

  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
