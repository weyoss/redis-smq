/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import _ from 'lodash';
import { Configuration } from '../../../src/config/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { config } from '../../common/config.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';

test('Message storage: acknowledged = true, deadLettered = false', async () => {
  const cfg = _.merge(config, {
    messages: {
      store: {
        acknowledged: true,
        deadLettered: false,
      },
    },
  });
  Configuration.reset();
  Configuration.getSetConfig(cfg);

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
  expect(res1.totalItems).toBe(0);
  expect(res1.items.length).toBe(0);

  const { producer: p, consumer: c } =
    await produceAndAcknowledgeMessage(getDefaultQueue());

  await shutDownBaseInstance(p);
  await shutDownBaseInstance(c);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);
});
