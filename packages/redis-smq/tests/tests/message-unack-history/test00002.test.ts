/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  ConfigManager,
  MessageManager,
  ProducibleMessage,
} from '../../../index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { UnacknowledgmentHistoryDisabledError } from '../../../src/errors/index.js';

test('getMessageUnacknowledgementHistory: audit disabled', async () => {
  const configManager = new ConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      unacknowledgementHistory: false,
    },
  });

  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.run();

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryThreshold(5)
    .setRetryDelay(1000);

  const [messageId] = await producer.produce(msg);

  const mh = new MessageManager();
  await expect(
    mh.getMessageUnacknowledgementHistory(messageId),
  ).rejects.toThrow(UnacknowledgmentHistoryDisabledError);
});
