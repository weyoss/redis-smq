/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ProducibleMessage } from '../../../../src/index.js';
import { createQueue } from '../../../common/message-producing-consuming.js';
import { getMessage } from '../../../common/message.js';
import { getProducer } from '../../../common/producer.js';
import { isEqual } from '../../../common/utils.js';

test('ExchangeTopic: producing message with a Topic Exchange', async () => {
  await createQueue({ ns: 'testing', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4.5.6' }, false);
  await createQueue({ ns: 'beta', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4' }, false);

  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage().setTopic('w123.2.4').setBody('hello');
  const ids = await producer.produceAsync(msg);
  const message = await getMessage();
  const items = await message.getMessagesByIdsAsync(ids);
  expect(
    isEqual(
      items.map((i) => i.destinationQueue),
      [
        { ns: 'testing', name: 'w123.2.4.5.6' },
        { ns: 'testing', name: 'w123.2.4.5' },
        { ns: 'testing', name: 'w123.2.4' },
      ],
    ),
  ).toBe(true);
});
