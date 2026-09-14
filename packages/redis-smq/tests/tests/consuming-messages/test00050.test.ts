/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  IQueueParams,
  Producer,
  ProducibleMessage,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../common/wait-for.js';

const MULTIPLEX_QUEUE: IQueueParams = {
  name: 'name',
  ns: 'ns',
};

it('multiplexed mode processes the next message within one tick interval', async () => {
  Consumer.setDefaultOptions({ enableMultiplexing: true });

  await RedisSMQ.createQueueManager().save(
    MULTIPLEX_QUEUE,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = new Consumer();
  await consumer.run();
  await consumer.consume(
    MULTIPLEX_QUEUE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (msg: IMessageTransferable) => {},
  );

  // Produce 5 messages back to back.
  const producer = new Producer();
  await producer.run();
  const t0 = Date.now();
  for (let i = 0; i < 5; i++) {
    await producer.produce(
      new ProducibleMessage().setQueue(MULTIPLEX_QUEUE).setBody(i),
    );
  }

  // Wait for all to be acknowledged.
  await waitFor(async () => {
    const props =
      await RedisSMQ.createQueueManager().getProperties(MULTIPLEX_QUEUE);
    return props.acknowledgedMessagesCount === 5;
  }, 8000);

  const elapsed = Date.now() - t0;
  // Before the fix, this was ~5 * 2000ms = 10s. After, ~5 * 1000ms = 5s.
  expect(elapsed).toBeLessThan(8000);

  await producer.shutdown();
  await consumer.shutdown();
});
