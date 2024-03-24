/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { IQueueParams, ProducibleMessage } from '../../../../src/lib/index.js';
import { createQueue } from '../../../common/message-producing-consuming.js';
import { getMessage } from '../../../common/message.js';
import { getProducer } from '../../../common/producer.js';
import { isEqual } from '../../../common/utils.js';

test('DirectExchange: producing message with a Direct exchange', async () => {
  const myQueue: IQueueParams = { ns: 'testing', name: 'w123.2.4.5' };
  await createQueue(myQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage().setQueue(myQueue).setBody('hello');
  const ids = await producer.produceAsync(msg);
  expect(ids.length).toBe(1);

  const message = await getMessage();
  const items = await message.getMessagesByIdsAsync(ids);
  expect(
    isEqual(
      items.map((i) => i.destinationQueue),
      [myQueue],
    ),
  ).toBe(true);
  expect(items[0].exchange.exchangeTag).toEqual(msg.getExchange()?.exchangeTag);
});
