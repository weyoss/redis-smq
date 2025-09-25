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
  ConsumerGroups,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../../src/index.js';
import { getQueueManager } from '../../common/queue-manager.js';
import {
  InvalidConsumerGroupIdError,
  InvalidQueueParametersError,
} from '../../../src/errors/index.js';

test('Consumer group ID validation', async () => {
  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const queue = await getQueueManager();
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const consumer1 = bluebird.promisifyAll(new Consumer());
  await expect(
    consumer1.consumeAsync(
      { queue: queue1, groupId: 'my-group-1!' },
      (msg, cb) => cb(),
    ),
  ).rejects.toThrow(InvalidQueueParametersError);

  const consumerGroups = bluebird.promisifyAll(new ConsumerGroups());
  await expect(
    consumerGroups.saveConsumerGroupAsync(queue1, 'my-group-1!'),
  ).rejects.toThrow(InvalidConsumerGroupIdError);

  await consumerGroups.shutdownAsync();
  await consumer1.shutdownAsync();
});
