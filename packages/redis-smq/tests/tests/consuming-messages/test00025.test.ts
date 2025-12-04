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
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';
import { AcknowledgedMessageAuditNotEnabledError } from '../../../src/errors/index.js';

test('Message audit: acknowledged = false, deadLettered = true', async () => {
  const configInstance = bluebird.promisifyAll(Configuration.getInstance());
  await configInstance.updateConfigAsync({
    messageAudit: {
      acknowledgedMessages: false,
      deadLetteredMessages: true,
    },
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { producer, consumer } =
    await produceAndDeadLetterMessage(getDefaultQueue());
  await shutDownBaseInstance(producer);
  await shutDownBaseInstance(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res1 = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(1);
  expect(res1.items.length).toBe(1);

  const { producer: p, consumer: c } =
    await produceAndAcknowledgeMessage(getDefaultQueue());

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  await expect(
    acknowledgedMessages.getMessagesAsync(defaultQueue, 0, 100),
  ).rejects.toThrowError(AcknowledgedMessageAuditNotEnabledError);
});
