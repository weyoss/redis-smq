/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';
import { expect, test } from 'vitest';
import { Configuration } from '../../../src/config/index.js';
import { config } from '../../common/config.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Combined test: Disable message storage, produce and acknowledge a message, and purge queue', async () => {
  const cfg = _.merge(config, {
    messages: {
      store: false,
    },
  });
  Configuration.reset();
  Configuration.getSetConfig(cfg);

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { queue } = await produceAndAcknowledgeMessage();

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res2 = await acknowledgedMessages.countMessagesAsync(queue);
  expect(res2).toBe(0);

  const messages = await getQueueMessages();
  const res3 = await messages.countMessagesAsync(queue);
  expect(res3).toBe(1);

  await acknowledgedMessages.purgeAsync(queue);

  const res4 = await messages.countMessagesAsync(queue);
  expect(res4).toBe(1);

  await messages.purgeAsync(queue);

  const res5 = await messages.countMessagesAsync(queue);
  expect(res5).toBe(0);
});
