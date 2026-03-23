/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { expect, test } from 'vitest';
import { Configuration } from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { AcknowledgmentAuditDisabledError } from '../../../src/errors/index.js';

test('Combined test: Disable message audit, produce and acknowledge a message, and purge queue', async () => {
  const configInstance = bluebird.promisifyAll(Configuration.getInstance());
  await configInstance.updateConfig({
    messageAudit: false,
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { queue } = await produceAndAcknowledgeMessage();

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  await expect(acknowledgedMessages.countMessages(queue)).rejects.toThrowError(
    AcknowledgmentAuditDisabledError,
  );

  const messages = await getQueueMessages();
  const res3 = await messages.countMessages(queue);
  expect(res3).toBe(1);

  await expect(acknowledgedMessages.purge(queue)).rejects.toThrowError(
    AcknowledgmentAuditDisabledError,
  );

  const res4 = await messages.countMessages(queue);
  expect(res4).toBe(1);

  await messages.purge(queue);

  await bluebird.delay(5000);

  const res5 = await messages.countMessages(queue);
  expect(res5).toBe(0);
});
