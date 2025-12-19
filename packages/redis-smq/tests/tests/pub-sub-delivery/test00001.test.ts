/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  ProducibleMessage,
  RedisSMQ,
} from '../../../src/index.js';
import { _generateEphemeralConsumerGroupId } from '../../../src/consumer/message-handler/_/_generate-ephemeral-consumer-group-id.js';

test('PUB/SUB Delivery: consuming a PUB_SUB queue without providing consumer group ID', async () => {
  const qm = bluebird.promisifyAll(RedisSMQ.createQueueManager());

  const queue: IQueueParams = {
    name: 'q1',
    ns: 'ns1',
  };
  await qm.saveAsync(queue, EQueueType.FIFO_QUEUE, EQueueDeliveryModel.PUB_SUB);

  const consumer = bluebird.promisifyAll(RedisSMQ.createConsumer());
  await consumer.runAsync();

  await consumer.consumeAsync(queue, (msg, cb) => cb());

  const cg = bluebird.promisifyAll(RedisSMQ.createConsumerGroups());
  const consumerGroups = await cg.getConsumerGroupsAsync(queue);
  expect(consumerGroups).toEqual([
    _generateEphemeralConsumerGroupId(consumer.getId()),
  ]);

  const p = bluebird.promisifyAll(RedisSMQ.createProducer());
  const msg = new ProducibleMessage();
  msg.setQueue(queue).setBody('hello');
  await p.runAsync();
  const ids = await p.produceAsync(msg);
  expect(ids.length).toEqual(1);

  await bluebird.delay(5000);

  const properties = await qm.getPropertiesAsync(queue);
  expect(properties.acknowledgedMessagesCount).toEqual(1);
});
