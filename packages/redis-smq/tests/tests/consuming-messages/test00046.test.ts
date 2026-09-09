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
  EQueueOperationalState,
  EQueueStateLockOwner,
  EQueueType,
  ESystemStateTransitionReason,
  IMessageTransferable,
  IQueueParams,
  RedisSMQ,
  TQueueStateTransitionOptions,
} from '../../../index.js';
import { _setQueueState } from '../../../src/queue-state-manager/_/_set-queue-state.js';
import { withSharedPoolConnection } from '../../../src/common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { waitFor } from '../../common/wait-for.js';

/**
 * Write a queue's operational state directly to Redis, bypassing
 * _transitQueueTo and therefore bypassing the 'queue.stateChanged' event.
 *
 * We need this for testing the processMessage path in isolation: if we used
 * QueueStateManager.stop(), the state-change event would eventually propagate
 * to the consumer's QueueStateChangeHandler and shut the handler down via
 * that path, racing our direct call. Writing STOPPED directly to Redis means
 * the ONLY path that can remove the handler is the one we want to exercise:
 * CHECKOUT_MESSAGE returning QUEUE_STOPPED, which the handler sees on its
 * next processMessage call.
 */
async function setQueueStateDirectly(
  queue: IQueueParams,
  from: EQueueOperationalState,
  to: EQueueOperationalState,
  options: TQueueStateTransitionOptions | null,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    withSharedPoolConnection(
      (client, done) => {
        _setQueueState(
          client,
          queue,
          from,
          to,
          ESystemStateTransitionReason.RECOVERY,
          options,
          (err) => done(err),
        );
      },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

describe('MessageHandler: processMessage -> shutdownRequired', () => {
  const QUEUE_NAME: IQueueParams = {
    ns: 'ns1',
    name: 'name1',
  };
  let consumer: Consumer;

  beforeEach(async () => {
    // Create a fresh queue for each test.
    await RedisSMQ.createQueueManager().save(
      QUEUE_NAME,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    consumer = new Consumer();
    await consumer.run();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await consumer.consume(QUEUE_NAME, async (msg: IMessageTransferable) => {
      /* no-op: the handler is never expected to reach a message */
    });
  });

  afterEach(async () => {
    await consumer.shutdown();
    await RedisSMQ.createQueueManager().delete(QUEUE_NAME);
  });

  it('removes the handler from the runner when CHECKOUT_MESSAGE returns QUEUE_STOPPED', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    expect(runner.messageHandlerInstances.length).toBe(1);

    // 1. Write STOPPED directly to Redis, bypassing _transitQueueTo so
    //    'queue.stateChanged' is not published. The consumer's
    //    QueueStateChangeHandler will therefore not interfere; only the
    //    processMessage path can trigger cleanup.
    await setQueueStateDirectly(
      QUEUE_NAME,
      EQueueOperationalState.ACTIVE,
      EQueueOperationalState.STOPPED,
      null,
    );

    // 2. Invoke processMessage directly on the running handler. The message
    //    ID is arbitrary: CHECKOUT_MESSAGE checks the queue's operational
    //    state before it touches any message key, and returns QUEUE_STOPPED
    //    immediately.
    const handler = runner.messageHandlerInstances[0];
    handler.processMessage('any-message-id');

    // 3. processMessage is async (Redis script round-trip). The handler emits
    //    'shutdownRequired' from inside the runScript callback, and the
    //    runner's listener (attached by attachHandlerListeners) calls
    //    shutdownMessageHandler, which invokes handler.shutdown and filters
    //    the array. Poll until the array is empty.
    await waitFor(() => runner.messageHandlerInstances.length === 0);
  });

  it('does NOT remove the handler when the queue is ACTIVE', async () => {
    // Negative test: with the queue still ACTIVE, processMessage must not
    // emit shutdownRequired. The checkout script returns MESSAGE_NOT_FOUND
    // (the fake message ID does not exist), which takes the "next" branch,
    // not the shutdown branch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    expect(runner.messageHandlerInstances.length).toBe(1);

    const handler = runner.messageHandlerInstances[0];
    handler.processMessage('any-message-id');

    // Give the script callback time to run, then assert nothing happened.
    await new Promise((r) => setTimeout(r, 200));
    expect(runner.messageHandlerInstances.length).toBe(1);
    expect(handler.isOperational()).toBe(true);
  });

  it('removes the handler when CHECKOUT_MESSAGE returns QUEUE_LOCKED', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runner = (consumer as any).messageHandlerRunner;
    expect(runner.messageHandlerInstances.length).toBe(1);

    await setQueueStateDirectly(
      QUEUE_NAME,
      EQueueOperationalState.ACTIVE,
      EQueueOperationalState.LOCKED,
      {
        lockId: '123',
        lockOwner: EQueueStateLockOwner.PURGE_JOB,
      },
    );

    const handler = runner.messageHandlerInstances[0];
    handler.processMessage('any-message-id');

    await waitFor(() => runner.messageHandlerInstances.length === 0);

    await setQueueStateDirectly(
      QUEUE_NAME,
      EQueueOperationalState.LOCKED,
      EQueueOperationalState.ACTIVE,
      {
        lockId: '123',
        lockOwner: EQueueStateLockOwner.PURGE_JOB,
      },
    );
  });
});
