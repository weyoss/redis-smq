/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ExchangeTopic } from '../../../../src/lib/exchange/exchange-topic';
import { createQueue } from '../../../common/message-producing-consuming';
import { ProducibleMessage } from '../../../../src/lib/message/producible-message';
import { getProducer } from '../../../common/producer';
import { isEqual } from '../../../common/util';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../../src/lib/message/message';

test('ExchangeTopic: producing message using setExchange()', async () => {
  await createQueue({ ns: 'testing', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4.5.6' }, false);
  await createQueue({ ns: 'beta', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4' }, false);

  const producer = getProducer();
  await producer.runAsync();

  const e1 = new ExchangeTopic('w123.2.4');
  const msg = new ProducibleMessage().setExchange(e1).setBody('hello');
  const ids = await producer.produceAsync(msg);
  const message = promisifyAll(new Message());
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
