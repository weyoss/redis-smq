/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, jest } from '@jest/globals';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../../../src/lib/message/types/message.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';

test('A message is not lost in case of a consumer crash', async () => {
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  /**
   * Consumer2 re-queues failed message and consumes it!
   */
  const consumer2 = getConsumer({
    messageHandler: jest.fn(
      (msg: IMessageTransferable, cb: ICallback<void>) => {
        cb();
      },
    ),
  });
  consumer2.run(() => void 0);
  await untilMessageAcknowledged(consumer2);
});
