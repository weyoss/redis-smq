/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ConsumerGroupHasActiveConsumersError } from '../../../src/errors/index.js';
import bluebird from 'bluebird';
import {
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';

test('Deleting a consumer group with active consumers', async () => {
  const queueParams: IQueueParams = { name: 'q1', ns: 'n1' };
  const groupId = 'g1';

  const queueManager = RedisSMQ.createQueueManager();
  await queueManager.save(
    queueParams,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const consumerGroups = RedisSMQ.createConsumerGroups();
  await consumerGroups.saveConsumerGroup(queueParams, groupId);

  const consumer = await RedisSMQ.startConsumer();
  await consumer.consume(
    { queueParams, groupId },
    async (m: IMessageTransferable) => void m,
  );

  await bluebird.delay(5000);

  await expect(
    consumerGroups.deleteConsumerGroup(queueParams, groupId),
  ).rejects.toThrow(ConsumerGroupHasActiveConsumersError);

  await consumer.shutdown();

  await bluebird.delay(5000);

  // should succeed
  await consumerGroups.deleteConsumerGroup(queueParams, groupId);
});
