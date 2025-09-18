/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { Configuration } from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';

test('ProducibleMessage storage: acknowledged.expire = 10000', async () => {
  const configInstance = bluebird.promisifyAll(Configuration.getInstance());
  await configInstance.updateConfigAsync({
    messages: {
      store: {
        acknowledged: {
          expire: 20000,
        },
      },
    },
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { producer: p, consumer: c } =
    await produceAndAcknowledgeMessage(getDefaultQueue());

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res1 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(1);
  expect(res1.items.length).toBe(1);

  await bluebird.delay(20000);

  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);
});
