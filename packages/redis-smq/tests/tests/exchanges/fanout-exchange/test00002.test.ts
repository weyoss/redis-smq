/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { EQueueDeliveryModel, EQueueType } from '../../../../src/index.js';
import { getFanOutExchange } from '../../../common/exchange.js';
import { getQueue } from '../../../common/queue.js';
import { isEqual } from '../../../common/utils.js';

test('ExchangeFanOut: getQueues() ', async () => {
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

  const fanOutExchange = getFanOutExchange();
  await fanOutExchange.bindQueueAsync(q1, 'fanout_a');
  await fanOutExchange.bindQueueAsync(q2, 'fanout_a');

  const r = await fanOutExchange.getQueuesAsync('fanout_a');
  expect(isEqual(r, [q1, q2])).toBe(true);
});
