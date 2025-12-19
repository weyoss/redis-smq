/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { QueueHasBoundExchangesError } from '../../../src/errors/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueueManager } from '../../common/queue-manager.js';
import { IExchangeParams, RedisSMQ } from '../../../src/index.js';
import bluebird from 'bluebird';

test('Deleting a message queue bound to an exchange', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const exchangeDirectParams: IExchangeParams = {
    ns: defaultQueue.ns,
    name: 'ex_direct_pub',
  };
  const directExchange = bluebird.promisifyAll(RedisSMQ.createDirectExchange());
  const rkOrderCreated = 'order.created';

  await directExchange.bindQueueAsync(
    defaultQueue,
    exchangeDirectParams,
    rkOrderCreated,
  );

  const q = await getQueueManager();

  await expect(q.deleteAsync(defaultQueue)).rejects.toThrow(
    QueueHasBoundExchangesError,
  );
});
