/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Message } from '../../../src/lib/message/message';
import { delay } from 'bluebird';
import { events } from '../../../src/common/events/events';
import { ICallback } from 'redis-smq-common';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

type TQueueMetrics = {
  receivedMessages: Message[];
  acks: number;
};

test('Given many queues, a message is recovered from a consumer crash and re-queued to its origin queue', async () => {
  await createQueue(defaultQueue, false);
  await createQueue('queue_b', false);

  const defaultQueueMetrics: TQueueMetrics = {
    receivedMessages: [],
    acks: 0,
  };
  const queueBMetrics: TQueueMetrics = {
    receivedMessages: [],
    acks: 0,
  };

  const queueAConsumer = getConsumer({
    queue: defaultQueue,
    messageHandler: (msg: Message, cb: ICallback<void>) => {
      defaultQueueMetrics.receivedMessages.push(msg);
      cb();
    },
  });
  queueAConsumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    defaultQueueMetrics.acks += 1;
  });
  await queueAConsumer.runAsync();

  const queueBConsumer = getConsumer({
    queue: 'queue_b',
    messageHandler: (msg: Message, cb: ICallback<void>) => {
      queueBMetrics.receivedMessages.push(msg);
      cb();
    },
  });
  queueBConsumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    queueBMetrics.acks += 1;
  });
  await queueBConsumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  // Produce a message to QUEUE B
  const anotherMsg = new Message();
  anotherMsg.setBody({ id: 'b' }).setQueue('queue_b');
  await producer.produceAsync(anotherMsg);

  // using defaultQueue
  await crashAConsumerConsumingAMessage();
  await delay(10000);

  expect(defaultQueueMetrics.acks).toBe(1);
  expect(defaultQueueMetrics.receivedMessages.length).toBe(1);

  expect(queueBMetrics.acks).toBe(1);
  expect(queueBMetrics.receivedMessages.length).toBe(1);
  expect(queueBMetrics.receivedMessages[0].getRequiredId()).toBe(
    anotherMsg.getRequiredId(),
  );
});
