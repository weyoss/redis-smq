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
  Producer,
  ProducibleMessage,
  ConsumerGroups,
  EQueueType,
  EQueueDeliveryModel,
} from '../../../index.js';
import { waitFor } from '../../common/wait-for.js';
import { ProducerNotRunningError } from '../../../src/errors/index.js';

describe('Producer — PubSubTargetResolver degradation', () => {
  const POINT_QUEUE = 'ptp-queue';
  const PUBSUB_QUEUE = 'pubsub-queue';

  let producer: Producer;

  beforeEach(async () => {
    const qm = RedisSMQ.createQueueManager();
    await qm.save(
      POINT_QUEUE,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );
    await qm.save(
      PUBSUB_QUEUE,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );
    await new ConsumerGroups().saveConsumerGroup(PUBSUB_QUEUE, 'g1');

    producer = new Producer();
    await producer.run();
  });

  afterEach(async () => {
    await producer.shutdown();
    const qm = RedisSMQ.createQueueManager();
    await qm.delete(POINT_QUEUE);
    await qm.delete(PUBSUB_QUEUE);
  });

  it('shuts the producer down when the resolver errors at runtime', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolver = (producer as any).pubSubTargetResolver;
    expect(producer.isRunning()).toBe(true);
    expect(resolver.isOperational()).toBe(true);

    resolver.emit('error', new Error('simulated resolver failure'));

    await waitFor(() => !producer.isRunning());
    expect(producer.isRunning()).toBe(false);
  });

  it('rejects produce() with ProducerNotRunningError once the producer is down', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolver = (producer as any).pubSubTargetResolver;
    resolver.emit('error', new Error('simulated resolver failure'));

    await waitFor(() => !producer.isRunning());

    const pubsubMsg = new ProducibleMessage()
      .setQueue(PUBSUB_QUEUE)
      .setBody('x');
    await expect(producer.produce(pubsubMsg)).rejects.toBeInstanceOf(
      ProducerNotRunningError,
    );

    const ptpMsg = new ProducibleMessage().setQueue(POINT_QUEUE).setBody('x');
    await expect(producer.produce(ptpMsg)).rejects.toBeInstanceOf(
      ProducerNotRunningError,
    );
  });
});
