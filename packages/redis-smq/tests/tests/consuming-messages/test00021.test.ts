/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ProducibleMessage } from '../../../index.js';
import { ProducerInstanceNotRunningError } from '../../../src/lib/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Shutdown a producer and try to produce a message', async () => {
  const producer = getProducer();
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());
  await expect(producer.produceAsync(msg)).rejects.toThrowError(
    ProducerInstanceNotRunningError,
  );
});
