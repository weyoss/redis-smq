/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../common/wait-for.js';
import bluebird from 'bluebird';

describe('Ephemeral consumer groups and queue identifier', () => {
  const QUEUE_NAME = 'ephemeral-cancel-test';
  let consumer: Consumer;

  beforeEach(async () => {
    // Create a fresh queue for each test.
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
    await consumer.shutdown();
    await RedisSMQ.createQueueManager().delete(QUEUE_NAME);
  });

  it('cancel() shuts down a handler with an ephemeral consumer group', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    expect(runner.messageHandlerInstances.length).toBe(1);

    const handler = runner.messageHandlerInstances[0];
    const effectiveQueue = handler.getQueue();

    // Sanity: the handler is using a generated group ID
    expect(effectiveQueue.groupId).toMatch(/^cid-/);

    await consumer.cancel('ephemeral-cancel-test');

    await waitFor(() => runner.messageHandlerInstances.length === 0);
    expect(handler.isOperational()).toBe(false);
  });

  it('supervisor does not create a duplicate handler for an ephemeral group', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    expect(runner.messageHandlerInstances.length).toBe(1);

    const instanceId = runner.messageHandlerInstances[0].getId();

    // Force a reconciliation tick and give it time to run.
    // (Access the private tick directly or wait for the 5s interval.)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (runner as any).reconcileHandlers();
    await bluebird.delay(1000);

    // Still exactly one instance, and it's the same one (not a duplicate).
    expect(runner.messageHandlerInstances.length).toBe(1);
    expect(runner.messageHandlerInstances[0].getId()).toBe(instanceId);
  });
});
