/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import {
  EQueueDeliveryModel,
  EQueueType,
  ExchangeFanOutError,
} from '../../../../src/lib/index.js';
import { getFanOutExchange } from '../../../common/exchange.js';
import { getQueue } from '../../../common/queue.js';

test('ExchangeFanOut: binding different types of queues', async () => {
  const fanOutExchangeManager = getFanOutExchange();
  await fanOutExchangeManager.saveExchangeAsync('e1');

  const q1 = { ns: 'testing', name: 'w123' };
  const queueInstance = await getQueue();
  await queueInstance.saveAsync(
    q1,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await fanOutExchangeManager.bindQueueAsync(q1, 'e1');

  const q2 = { ns: 'testing', name: 'w456' };
  await queueInstance.saveAsync(
    q2,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  await expect(fanOutExchangeManager.bindQueueAsync(q2, 'e1')).rejects.toThrow(
    ExchangeFanOutError,
  );
});
