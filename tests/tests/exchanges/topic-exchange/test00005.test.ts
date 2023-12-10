/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createQueue } from '../../../common/message-producing-consuming';
import { MessageEnvelope } from '../../../../src/lib/message/message-envelope';
import { getProducer } from '../../../common/producer';
import { isEqual } from '../../../common/util';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../../src/lib/message/message';

test('ExchangeTopic: producing message using setTopic()', async () => {
  await createQueue({ ns: 'testing', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4.5.6' }, false);
  await createQueue({ ns: 'beta', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4' }, false);

  const producer = getProducer();
  await producer.runAsync();

  const msg = new MessageEnvelope().setTopic('w123.2.4').setBody('hello');
  const r = await producer.produceAsync(msg);
  expect(r.scheduled).toEqual(false);
  const message = promisifyAll(new Message());
  const items = await message.getMessagesByIdsAsync(r.messages);
  expect(
    isEqual(
      items.map((i) => i.getDestinationQueue()),
      [
        { ns: 'testing', name: 'w123.2.4.5.6' },
        { ns: 'testing', name: 'w123.2.4.5' },
        { ns: 'testing', name: 'w123.2.4' },
      ],
    ),
  ).toBe(true);
});
