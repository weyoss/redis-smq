/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  EQueueDeliveryModel,
  EQueueType,
  ExchangeFanOutExchangeHasBoundQueuesError,
  ExchangeQueueIsNotBoundToExchangeError,
} from '../../../../src/lib/index.js';
import { getFanOutExchange } from '../../../common/exchange.js';
import { getQueue } from '../../../common/queue.js';

test('ExchangeFanOut: creating and deleting an exchange', async () => {
  const fanOutExchange = getFanOutExchange();
  await fanOutExchange.saveExchangeAsync('e1');
  await fanOutExchange.saveExchangeAsync('e1');
  await fanOutExchange.saveExchangeAsync('e2');
  const r1 = await fanOutExchange.getAllExchangesAsync();
  expect(r1.sort()).toEqual(['e1', 'e2']);

  const q1 = { ns: 'testing', name: 'w123' };

  const queue = await getQueue();
  await queue.saveAsync(
    q1,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await fanOutExchange.bindQueueAsync(q1, 'e1');
  await fanOutExchange.bindQueueAsync(q1, 'e1');

  const r4 = await fanOutExchange.getQueuesAsync('e1');
  expect(r4).toEqual([q1]);

  await fanOutExchange.bindQueueAsync(q1, 'e2');

  const r5 = await fanOutExchange.getQueuesAsync('e1');
  expect(r5).toEqual([]);

  const r6 = await fanOutExchange.getQueuesAsync('e2');
  expect(r6).toEqual([q1]);

  await expect(fanOutExchange.deleteExchangeAsync('e2')).rejects.toThrow(
    ExchangeFanOutExchangeHasBoundQueuesError,
  );

  await fanOutExchange.unbindQueueAsync(q1, 'e2');
  await expect(fanOutExchange.unbindQueueAsync(q1, 'e2')).rejects.toThrow(
    ExchangeQueueIsNotBoundToExchangeError,
  );

  await fanOutExchange.deleteExchangeAsync('e2');
  const r7 = await fanOutExchange.getAllExchangesAsync();
  expect(r7).toEqual(['e1']);
});
