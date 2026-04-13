/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
  MessageManager,
  ProducibleMessage,
} from '../../../index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageDeadLettered } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('getMessageUnacknowledgementHistory', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.run();

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(new Error('e')),
  });

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryThreshold(5)
    .setRetryDelay(1000);

  const [messageId] = await producer.produce(msg);
  consumer.run(() => void 0);

  await untilMessageDeadLettered(consumer, messageId);

  const mh = new MessageManager();
  const history = await mh.getMessageUnacknowledgementHistory(messageId);

  expect(history.length).toEqual(5);
  expect(Object.keys(history[0]).sort()).toEqual(
    [
      'messageId',
      'cause',
      'action',
      'timestamp',
      'retryCount',
      'queue',
      'consumerId',
      'deadLetterCause',
    ].sort(),
  );

  expect(history[0].messageId).toEqual(messageId);
  expect(history[0].queue).toEqual({
    queueParams: defaultQueue,
    groupId: null,
  });
  expect(history[0].cause).toEqual(
    EMessageUnacknowledgementCause.UNACKNOWLEDGED,
  );
  expect(history[0].action).toEqual(
    EMessageUnacknowledgementAction.DEAD_LETTER,
  );
  expect(history[0].deadLetterCause).toEqual(
    EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
  );
  expect(history[0].retryCount).toEqual(5);
  expect(history[0].consumerId).toEqual(consumer.getId());
});
