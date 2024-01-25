/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ExchangeFanOut } from '../../../../src/lib/exchange/exchange-fan-out';
import { EQueueDeliveryModel, EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';
import { promisifyAll } from 'bluebird';

const FanOutExchangeAsync = promisifyAll(ExchangeFanOut);

test('ExchangeFanOut: creating and deleting an exchange', async () => {
  const e1 = getFanOutExchange('e1');
  await e1.saveExchangeAsync();
  await e1.saveExchangeAsync();

  const e2 = getFanOutExchange('e2');
  await e2.saveExchangeAsync();

  const r1 = await FanOutExchangeAsync.getAllExchangesAsync();
  expect(r1.sort()).toEqual(['e1', 'e2']);

  const q1 = { ns: 'testing', name: 'w123' };

  const queue = await getQueue();
  await queue.saveAsync(
    q1,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await e1.bindQueueAsync(q1);
  await e1.bindQueueAsync(q1);

  const r4 = await e1.getQueuesAsync();
  expect(r4).toEqual([q1]);

  await e2.bindQueueAsync(q1);

  const r5 = await e1.getQueuesAsync();
  expect(r5).toEqual([]);

  const r6 = await e2.getQueuesAsync();
  expect(r6).toEqual([q1]);

  await expect(e2.deleteExchangeAsync()).rejects.toThrow(
    `Exchange has 1 bound queue(s). Unbind all queues before deleting the exchange.`,
  );

  await e2.unbindQueueAsync(q1);
  await expect(e2.unbindQueueAsync(q1)).rejects.toThrow(
    `Queue ${q1.name}@${q1.ns} is not bound to [e2] exchange.`,
  );

  await e2.deleteExchangeAsync();
  const r7 = await FanOutExchangeAsync.getAllExchangesAsync();
  expect(r7).toEqual(['e1']);
});
