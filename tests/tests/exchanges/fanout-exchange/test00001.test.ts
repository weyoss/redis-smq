/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import { EQueueDeliveryModel, EQueueType } from '../../../../src/lib/index.js';
import { getFanOutExchange } from '../../../common/exchange.js';
import { getQueue } from '../../../common/queue.js';
import { isEqual } from '../../../common/utils.js';

test('ExchangeFanOut: bindQueue(), getExchangeQueues(), unbindQueue()', async () => {
  const fanOutExchange = getFanOutExchange();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };
  const q3 = { ns: 'testing', name: 'w789' };

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
  await queue.saveAsync(
    q3,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  await fanOutExchange.bindQueueAsync(q1, 'fanout_a');
  await fanOutExchange.bindQueueAsync(q2, 'fanout_a');
  await fanOutExchange.bindQueueAsync(q3, 'fanout_b');

  const r0 = await fanOutExchange.getQueuesAsync('fanout_a');
  expect(isEqual(r0, [q1, q2])).toBe(true);

  const r1 = await fanOutExchange.getQueuesAsync('fanout_b');
  expect(isEqual(r1, [q3])).toBe(true);

  const r2 = await fanOutExchange.getQueueExchangeAsync(q1);
  expect(r2).toEqual('fanout_a');

  const r3 = await fanOutExchange.getQueueExchangeAsync(q2);
  expect(r3).toEqual('fanout_a');

  await fanOutExchange.unbindQueueAsync(q1, 'fanout_a');

  const r4 = await fanOutExchange.getQueuesAsync('fanout_a');
  expect(isEqual(r4, [q2])).toBe(true);

  const r5 = await fanOutExchange.getQueueExchangeAsync(q1);
  expect(r5).toEqual(null);

  const r6 = await fanOutExchange.getQueueExchangeAsync(q2);
  expect(r6).toEqual('fanout_a');

  const r7 = await fanOutExchange.getAllExchangesAsync();
  expect(r7.sort()).toEqual(['fanout_a', 'fanout_b'].sort());
});
