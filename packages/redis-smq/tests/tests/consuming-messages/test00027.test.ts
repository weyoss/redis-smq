/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { Configuration } from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import bluebird from 'bluebird';

test('ProducibleMessage storage: acknowledged.queueSize = 3', async () => {
  const configInstance = bluebird.promisifyAll(Configuration.getInstance());
  await configInstance.updateConfigAsync({
    messageAudit: {
      acknowledgedMessages: {
        queueSize: 3,
      },
    },
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { consumer: c1, producer: p1 } =
    await produceAndAcknowledgeMessage(getDefaultQueue());
  await shutDownBaseInstance(c1);
  await shutDownBaseInstance(p1);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res1 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(1);
  expect(res1.items.length).toBe(1);

  const { consumer: c2, producer: p2 } =
    await produceAndAcknowledgeMessage(getDefaultQueue());
  await shutDownBaseInstance(c2);
  await shutDownBaseInstance(p2);

  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(2);
  expect(res2.items.length).toBe(2);

  const { consumer: c3, producer: p3 } =
    await produceAndAcknowledgeMessage(getDefaultQueue());
  await shutDownBaseInstance(c3);
  await shutDownBaseInstance(p3);

  const res3 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res3.totalItems).toBe(3);
  expect(res3.items.length).toBe(3);

  const { consumer: c4, producer: p4 } =
    await produceAndAcknowledgeMessage(getDefaultQueue());
  await shutDownBaseInstance(c4);
  await shutDownBaseInstance(p4);

  const res4 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res4.totalItems).toBe(3);
  expect(res4.items.length).toBe(3);
});
