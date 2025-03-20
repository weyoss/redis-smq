/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ICallback } from 'redis-smq-common';
import {
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Consume message from different queues and published by a single producer instance', async () => {
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 5; i += 1) {
    const queue = `QuEue_${i}`;
    await createQueue(queue, false);

    const message = new ProducibleMessage();
    // queue name should be normalized to lowercase
    message.setBody(`Message ${i}`).setQueue(queue);
    await producer.produceAsync(message);
  }
  const queueMessages = await getQueueMessages();
  for (let i = 0; i < 5; i += 1) {
    // Be carefull here: queue name is always in lowercase. Otherwise it will be not normalized
    const m1 = await queueMessages.countMessagesByStatusAsync(`queue_${i}`);
    expect(m1).toEqual({
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
      pending: 1,
    });

    // queue name should be normalized to lowercase
    const consumer = getConsumer({
      queue: `queUE_${i}`,
      messageHandler: (msg: IMessageTransferable, cb: ICallback<void>) => {
        // message handlers start consuming message once started and before the consumer is fully started (when event.UP is emitted)
        // untilMessageAcknowledged() may miss acknowledged event
        // As a workaround, adding a delay before acknowledging a message
        setTimeout(() => cb(), 10000);
      },
    });
    await consumer.runAsync();
    await untilMessageAcknowledged(consumer);
    await shutDownBaseInstance(consumer);

    //
    const m2 = await queueMessages.countMessagesByStatusAsync(`queue_${i}`);
    expect(m2).toEqual({
      acknowledged: 1,
      deadLettered: 0,
      scheduled: 0,
      pending: 0,
    });
  }
});
