/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import {
  AcknowledgedMessageAuditNotEnabledError,
  DeadLetteredMessageAuditNotEnabledError,
} from '../../../src/errors/index.js';

test('Message audit: enabled = false', async () => {
  const configInstance = bluebird.promisifyAll(Configuration.getInstance());
  await configInstance.updateConfigAsync({
    messageAudit: false,
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { producer, consumer } =
    await produceAndDeadLetterMessage(getDefaultQueue());
  await shutDownBaseInstance(producer);
  await shutDownBaseInstance(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  await expect(
    deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100),
  ).rejects.toThrowError(DeadLetteredMessageAuditNotEnabledError);

  const { producer: p, consumer: c } =
    await produceAndAcknowledgeMessage(getDefaultQueue());

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  await expect(
    acknowledgedMessages.getMessagesAsync(defaultQueue, 0, 100),
  ).rejects.toThrowError(AcknowledgedMessageAuditNotEnabledError);
});
