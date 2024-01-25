/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ExchangeFanOutError } from '../../../../src/lib/exchange/errors';
import { EQueueDeliveryModel, EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';

test('ExchangeFanOut: binding different types of queues', async () => {
  const e1 = getFanOutExchange('e1');
  await e1.saveExchangeAsync();

  const q1 = { ns: 'testing', name: 'w123' };
  const queueInstance = await getQueue();
  await queueInstance.saveAsync(
    q1,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await e1.bindQueueAsync(q1);

  const q2 = { ns: 'testing', name: 'w456' };
  await queueInstance.saveAsync(
    q2,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  await expect(e1.bindQueueAsync(q2)).rejects.toThrow(ExchangeFanOutError);
});
