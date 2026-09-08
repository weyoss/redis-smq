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
  EQueueType,
  IMessageTransferable,
  QueueStateManager,
} from '../../../src/index.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import bluebird from 'bluebird';

it('removes the handler from the runner when the queue is stopped mid-flight', async () => {
  await createQueue('orders', EQueueType.FIFO_QUEUE);

  const consumer = new Consumer();
  await consumer.run();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await consumer.consume('orders', async (msg: IMessageTransferable) => {
    /* no-op */
  });

  // Simulate the runner's view before the state change
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runner = (consumer as any).messageHandlerRunner;
  expect(runner.messageHandlerInstances.length).toBe(1);

  // Force the queue into STOPPED via the Redis script path
  const queueStateManager = new QueueStateManager();
  await queueStateManager.stop('orders', null);

  await bluebird.delay(5000); // let the state event propagate

  // Before the fix: the handler's shutdown() is called, but the runner
  // still holds a reference. After the fix: the instance is removed.
  expect(runner.messageHandlerInstances.length).toBe(0);

  // And when the queue goes back to ACTIVE, a new handler is created
  await queueStateManager.resume('orders', null);

  await bluebird.delay(5000); // let the state event propagate

  expect(runner.messageHandlerInstances.length).toBe(1);

  await consumer.shutdown();
});
