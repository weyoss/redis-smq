/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RedisSMQ,
  Consumer,
  ConsumerGroups,
  EQueueType,
  EQueueDeliveryModel,
  IMessageTransferable,
} from '../../../index.js';

describe('Ephemeral group cleanup on graceful shutdown', () => {
  const QUEUE_NAME = 'ephemeral-shutdown-test';
  let consumer: Consumer;

  beforeEach(async () => {
    await RedisSMQ.createQueueManager().save(
      QUEUE_NAME,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    consumer = new Consumer();
    await consumer.run();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await consumer.consume(QUEUE_NAME, async (msg: IMessageTransferable) => {});
  });

  afterEach(async () => {
    // consumer may already be down; shutdown is idempotent
    await consumer.shutdown();
    await RedisSMQ.createQueueManager().delete(QUEUE_NAME);
  });

  it('deletes the ephemeral group during clean shutdown', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    const handler = runner.messageHandlerInstances[0];
    const ephemeralGroupId = handler.getQueue().groupId as string;

    expect(ephemeralGroupId).toMatch(/^cid-/);

    // Sanity: group exists and has this consumer as a member
    const cg = new ConsumerGroups();
    const groupsBefore = await cg.getConsumerGroups(QUEUE_NAME);
    expect(groupsBefore).toContain(ephemeralGroupId);

    // Graceful shutdown
    await consumer.shutdown();

    // After shutdown, the group should be gone.
    // ConsumerGroups.getConsumerGroups returns the set of group IDs
    // registered for the queue, which is what _deleteConsumerGroup
    // removes from.
    const groupsAfter = await cg.getConsumerGroups(QUEUE_NAME).catch(() => []);
    expect(groupsAfter).not.toContain(ephemeralGroupId);
  });
});
