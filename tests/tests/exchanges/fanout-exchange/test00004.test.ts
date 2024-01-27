/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../../src/lib/message/producible-message';
import { getProducer } from '../../../common/producer';
import { ExchangeFanOut } from '../../../../src/lib/exchange/exchange-fan-out';
import { isEqual } from '../../../common/util';
import { EQueueDeliveryModel, EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../../src/lib/message/message';

test('ExchangeFanOut: producing message using setExchange()', async () => {
  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  const queue = await getQueue();
  await queue.saveAsync(
    q1,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await queue.saveAsync(
    q2,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const exchange = getFanOutExchange('fanout_a');
  await exchange.bindQueueAsync(q1);
  await exchange.bindQueueAsync(q2);

  const producer = getProducer();
  await producer.runAsync();

  const e = new ExchangeFanOut('fanout_a');
  const msg = new ProducibleMessage().setExchange(e).setBody('hello');

  const ids = await producer.produceAsync(msg);
  const message = promisifyAll(new Message());
  const items = await message.getMessagesByIdsAsync(ids);
  expect(
    isEqual(
      items.map((i) => i.destinationQueue),
      [q1, q2],
    ),
  ).toBe(true);
});
