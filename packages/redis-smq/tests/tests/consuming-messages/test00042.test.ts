/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { RedisSMQ } from '../../../index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { InvalidMessageHandlerSignatureError } from '../../../src/errors/index.js';

test('Message handler promise: InvalidMessageHandlerSignatureError', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const consumer = await RedisSMQ.startConsumer();
  await consumer.run();

  await expect(
    consumer.consume(defaultQueue, async () => {
      throw new Error();
    }),
  ).rejects.toThrow(InvalidMessageHandlerSignatureError);
});
