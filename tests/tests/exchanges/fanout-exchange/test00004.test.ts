/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../../src/lib/message/message-envelope';
import { getProducer } from '../../../common/producer';
import { ExchangeFanOut } from '../../../../src/lib/exchange/exchange-fan-out';
import { isEqual } from '../../../common/util';
import { EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../../src/lib/message/message';

test('ExchangeFanOut: producing message using setExchange()', async () => {
  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  const queue = await getQueue();
  await queue.saveAsync(q1, EQueueType.LIFO_QUEUE);
  await queue.saveAsync(q2, EQueueType.LIFO_QUEUE);

  const exchange = getFanOutExchange('fanout_a');
  await exchange.bindQueueAsync(q1);
  await exchange.bindQueueAsync(q2);

  const producer = getProducer();
  await producer.runAsync();

  const e = new ExchangeFanOut('fanout_a');
  const msg = new MessageEnvelope().setExchange(e).setBody('hello');

  const r = await producer.produceAsync(msg);
  expect(r.scheduled).toEqual(false);
  const message = promisifyAll(new Message());
  const items = await message.getMessagesByIdsAsync(r.messages);
  expect(
    isEqual(
      items.map((i) => i.getDestinationQueue()),
      [q1, q2],
    ),
  ).toBe(true);
});
