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
  ConsumerGroups,
  ConsumerGroupsConsumerGroupsNotSupportedError,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../../src/lib/index.js';
import { getQueue } from '../../common/queue.js';

test('Consumer groups/Queue delivery model validation', async () => {
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

  const consumerGroups = bluebird.promisifyAll(new ConsumerGroups());
  await expect(
    consumerGroups.saveConsumerGroupAsync(queue1, 'my-group-1'),
  ).rejects.toThrow(ConsumerGroupsConsumerGroupsNotSupportedError);

  await consumerGroups.shutdownAsync();
});
