/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessagePropertyStatus,
  Message,
  ProducibleMessage,
} from '../../../index';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { promisifyAll } from 'bluebird';

test('ConsumableMessage', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const [messageId] = await producer.produceAsync(msg);
  consumer.run();

  await untilMessageAcknowledged(consumer, messageId);

  const m = promisifyAll(new Message());
  const consumableMessage = await m.getMessageByIdAsync(messageId);

  expect(typeof consumableMessage.getPublishedAt()).toBe('number');
  expect(consumableMessage.getScheduledAt()).toBe(null);
  expect(consumableMessage.getScheduledMessageId()).toBe(null);
  expect(typeof consumableMessage.getId()).toBe('string');
  expect(consumableMessage.getStatus()).toBe(
    EMessagePropertyStatus.ACKNOWLEDGED,
  );
  expect(consumableMessage.hasPriority()).toBe(false);
  expect(consumableMessage.getQueue()).toEqual(defaultQueue);
  expect(consumableMessage.getDestinationQueue()).toEqual(defaultQueue);
  expect(consumableMessage.getPriority()).toBe(null);
  expect(consumableMessage.getBody()).toEqual({ hello: 'world' });
  expect(consumableMessage.getTTL()).toBe(0);
  expect(consumableMessage.getRetryThreshold()).toBe(3);
  expect(consumableMessage.getRetryDelay()).toBe(0);
  expect(consumableMessage.getConsumeTimeout()).toBe(0);
  expect(typeof consumableMessage.getCreatedAt()).toBe('number');
  expect(consumableMessage.getScheduledRepeat()).toBe(0);
  expect(consumableMessage.getScheduledRepeatPeriod()).toBe(null);
  expect(consumableMessage.getScheduledCRON()).toBe(null);
  expect(consumableMessage.getScheduledDelay()).toBe(null);
  expect(consumableMessage.getFanOut()).toBe(null);
  expect(consumableMessage.getTopic()).toBe(null);
  expect(consumableMessage.getTopic()).toBe(null);
  expect(consumableMessage.getConsumerGroupId()).toBe(null);
  expect(consumableMessage.toJSON()).toEqual({
    createdAt: consumableMessage.getCreatedAt(),
    exchange: consumableMessage.getExchange().toJSON(),
    ttl: consumableMessage.getTTL(),
    retryThreshold: consumableMessage.getRetryThreshold(),
    retryDelay: consumableMessage.getRetryDelay(),
    consumeTimeout: consumableMessage.getConsumeTimeout(),
    body: consumableMessage.getBody(),
    priority: consumableMessage.getPriority(),
    scheduledCron: consumableMessage.getScheduledCRON(),
    scheduledDelay: consumableMessage.getScheduledDelay(),
    scheduledRepeatPeriod: consumableMessage.getScheduledRepeatPeriod(),
    scheduledRepeat: consumableMessage.getScheduledRepeat(),
    destinationQueue: consumableMessage.getDestinationQueue(),
    consumerGroupId: consumableMessage.getConsumerGroupId(),
  });
});
