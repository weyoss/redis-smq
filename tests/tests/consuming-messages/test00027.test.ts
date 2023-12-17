/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { merge } from 'lodash';
import { config } from '../../common/config';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { Configuration } from '../../../src/config/configuration';

test('ProducibleMessage storage: acknowledged.queueSize = 3', async () => {
  const cfg = merge(config, {
    messages: {
      store: {
        acknowledged: {
          queueSize: 3,
        },
      },
    },
  });
  Configuration.reset();
  Configuration.getSetConfig(cfg);

  await createQueue(defaultQueue, false);
  const { consumer: c1, producer: p1 } =
    await produceAndAcknowledgeMessage(defaultQueue);
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
    await produceAndAcknowledgeMessage(defaultQueue);
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
    await produceAndAcknowledgeMessage(defaultQueue);
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
    await produceAndAcknowledgeMessage(defaultQueue);
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
