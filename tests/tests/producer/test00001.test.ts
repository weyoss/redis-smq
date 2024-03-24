/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Producing a message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const [id] = await producer.produceAsync(msg);
  expect(typeof id).toBe('string');
});
