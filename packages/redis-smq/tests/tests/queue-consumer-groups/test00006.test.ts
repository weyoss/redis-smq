/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import {
  Consumer,
  ConsumerConsumerGroupIdNotSupportedError,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../../src/lib/index.js';
import { getQueue } from '../../common/queue.js';

test('ConsumerGroupIdNotSupportedError', async () => {
  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const queue = await getQueue();
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer1 = bluebird.promisifyAll(new Consumer());
  await consumer1.consumeAsync(
    { queue: queue1, groupId: 'my-group-1' },
    (msg, cb) => cb(),
  );

  await expect(consumer1.runAsync()).rejects.toThrow(
    ConsumerConsumerGroupIdNotSupportedError,
  );
  await consumer1.shutdownAsync();
});
