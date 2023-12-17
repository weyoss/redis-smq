/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { ICallback } from 'redis-smq-common';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { IConsumableMessage } from '../../../types';

test('Unacknowledged message are re-queued when messageRetryThreshold is not exceeded', async () => {
  const producer = getProducer();
  await producer.runAsync();

  await createQueue(defaultQueue, false);

  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: IConsumableMessage, cb: ICallback<void>) => {
      callCount += 1;
      if (callCount === 1) throw new Error('Explicit error');
      else if (callCount === 2) cb();
      else throw new Error('Unexpected call');
    }),
  });

  let unacknowledged = 0;
  consumer.on('messageUnacknowledged', () => {
    unacknowledged += 1;
  });

  let acknowledged = 0;
  consumer.on('messageAcknowledged', () => {
    acknowledged += 1;
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await untilMessageAcknowledged(consumer);

  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
