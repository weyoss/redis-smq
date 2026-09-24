/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessageUnacknowledgementCause,
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueStateLockOwner,
  EQueueType,
  ESystemStateTransitionReason,
  type IMessageTransferable,
} from '../../../src/index.js';
import { _setQueueState } from '../../../src/core/queue-state-manager/_/_set-queue-state.js';
import { withShared } from '../../../src/core/common/redis/connection-pool/with-shared.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import bluebird from 'bluebird';

/**
 * Integration tests for the `processMessage` reaction to a queue whose
 * state changed after the handler had already checked the message out.
 *
 * The consumer's normal reaction to a queue state change is driven by
 * the `queue.stateChanged` event (see `consumer-reaction.test.ts`). But
 * there is a second path: when a handler calls `processMessage` and the
 * `CHECKOUT_MESSAGE` script refuses — because the queue is `STOPPED`,
 * `LOCKED`, or in an invalid state — the handler itself emits
 * `shutdownRequired`, and the runner removes the instance.
 *
 * This file exercises that second path in isolation.
 *
 * WHY THE STATE IS WRITTEN DIRECTLY, BYPASSING `QueueStateManager`:
 *
 *   If the test called `stateManager.stop(queue)` or `stateManager.pause(queue)`,
 *   RedisSMQ would publish a `queue.stateChanged` event, which the
 *   consumer's `QueueStateChangeHandler` subscribes to. That handler
 *   would eventually shut the message handler down via the *event*
 *   path — the very path this file is meant to exclude. The direct
 *   write via `_setQueueState` produces the Redis-side state change
 *   without publishing the event, so the only way the handler can be
 *   removed is the `processMessage` path the test exercises.
 *
 *   The absence of the event is not incidental; it is the whole point.
 *   A version of these tests that used the public API would pass
 *   whether or not `processMessage` handled `QUEUE_STOPPED` correctly,
 *   because the event path would remove the handler anyway.
 *
 * WHAT `processMessage` DOES WHEN CHECKOUT REFUSES:
 *
 *   The `CHECKOUT_MESSAGE` script returns a string sentinel instead of
 *   the message data:
 *
 *     QUEUE_STOPPED        queue is in STOPPED state
 *     QUEUE_LOCKED         queue is in LOCKED state
 *     QUEUE_INVALID_STATE  queue is in an unrecognized state
 *     MESSAGE_NOT_FOUND    the message key is gone
 *     MESSAGE_NOT_PENDING  the message is not in the pending list
 *
 *   For the three QUEUE_* sentinels, the handler emits
 *   `shutdownRequired` with the corresponding cause and returns without
 *   calling `next()`. The runner's listener then calls
 *   `shutdownMessageHandler`, which shuts the instance down and removes
 *   it from `messageHandlerInstances`.
 *
 *   For the two MESSAGE_* sentinels, the handler logs a warning and
 *   calls `next()` to advance the dequeue loop. The handler instance
 *   stays alive.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the handler-removal wait.
 *
 * The shutdown chain includes `_unsubscribeConsumer` (a Redis
 * round-trip) and the handler's `WorkerCluster` shutdown, so it takes
 * longer than a simple state flip. Generous on CI.
 */
const HANDLER_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Settle window for the negative baseline. The handler has no reason
 * to shut down when the queue stays ACTIVE, so the assertion is
 * "nothing happened" and needs a bounded window for a hypothetical
 * mis-behavior to surface.
 */
const NEGATIVE_ASSERTION_SETTLE_MS = 2_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The subset of `MessageHandlerRunner` and `MessageHandler` the tests
 * reach into. Declaring it here keeps the white-box surface narrow: a
 * future change to either class that breaks the shape will fail to
 * compile at these declarations rather than producing a `TypeError`
 * deep inside an assertion.
 */
interface IRunnerInternals {
  messageHandlerInstances: Array<{
    getId(): string;
    isOperational(): boolean;
    processMessage(messageId: string): void;
    once(
      event: 'shutdownRequired',
      listener: (
        cause: EMessageUnacknowledgementCause,
        consumerId: string,
        queue: unknown,
      ) => void,
    ): unknown;
  }>;
}

/**
 * Access a consumer's `messageHandlerRunner` via the private field.
 *
 * `MessageHandlerRunner` and `Consumer` are framework internals; the
 * public API exposes `getQueues()` and `getQueuesWithStatus()` but not
 * the live handler instances. The `processMessage` contract this file
 * tests is not reachable through the public surface, so the test
 * reaches in.
 *
 * A cast through `unknown` is required because TypeScript sees the
 * field as protected. The interface above narrows the shape to what
 * the tests use.
 */
function getRunner(
  consumer: Awaited<ReturnType<typeof createBareConsumer>>,
): IRunnerInternals {
  const runner = (
    consumer as unknown as { messageHandlerRunner: IRunnerInternals }
  ).messageHandlerRunner;
  if (!runner) {
    throw new Error(
      'Consumer does not expose a messageHandlerRunner. ' +
        'The internal shape of the consumer has changed; this test needs updating.',
    );
  }
  return runner;
}

/**
 * Write a queue's operational state directly to Redis, bypassing
 * `QueueStateManager` and therefore bypassing the `queue.stateChanged`
 * event.
 *
 * See the file header for why this bypass is essential: if the state
 * change propagated as an event, the consumer's event-driven handler
 * would remove the message handler instance through the wrong path,
 * and the test would pass whether or not `processMessage` handled the
 * refusal correctly.
 *
 * The `from` state is `ACTIVE` because that is where the handler's own
 * checkout expects to find the queue. Passing a different `from` would
 * either fail the transition or (depending on the implementation)
 * write a state the checkout script treats differently.
 */
async function setQueueStateDirectly(
  queue: ReturnType<typeof uniqueQueue>,
  to: EQueueOperationalState,
  lockMetadata?: { lockId: string; lockOwner: EQueueStateLockOwner },
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    withShared(
      (client, done) => {
        _setQueueState(
          client,
          queue,
          EQueueOperationalState.ACTIVE,
          to,
          ESystemStateTransitionReason.RECOVERY,
          lockMetadata ?? null,
          (err) => done(err),
        );
      },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessageHandler.processMessage reaction to queue state', () => {
  // -------------------------------------------------------------------------
  // STOPPED
  // -------------------------------------------------------------------------

  it('removes the handler instance when CHECKOUT_MESSAGE returns QUEUE_STOPPED', async () => {
    const queue = uniqueQueue('process-msg-stopped');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
    });

    await consumer.run();

    // Give the handler time to start. The runner creates the instance
    // synchronously during `run()`, but the `goingUp` chain is async.
    const runner = getRunner(consumer);
    await waitFor(() => runner.messageHandlerInstances.length === 1, {
      timeoutMs: HANDLER_SHUTDOWN_TIMEOUT_MS,
      description: 'handler instance registered after run',
    });

    const handler = runner.messageHandlerInstances[0];

    // Subscribe to the handler's shutdownRequired event *before*
    // triggering the checkout. The handler emits it synchronously
    // during `processMessage`, so a listener attached after the call
    // would miss it.
    const emittedCauses: EMessageUnacknowledgementCause[] = [];
    handler.once('shutdownRequired', (cause) => {
      emittedCauses.push(cause);
    });

    // Write STOPPED directly. No event is published; the only path
    // that can remove the handler is `processMessage`.
    await setQueueStateDirectly(queue, EQueueOperationalState.STOPPED);

    // Invoke `processMessage` with an arbitrary ID. The
    // `CHECKOUT_MESSAGE` script checks the queue's operational state
    // *before* touching any message key, so the ID is never looked up
    // and the script returns `QUEUE_STOPPED` regardless of what is
    // passed.
    handler.processMessage('any-message-id');

    // The runner's listener reacts to `shutdownRequired` by calling
    // `shutdownMessageHandler`, which performs a full shutdown chain
    // (including a Redis deregistration) and then removes the instance
    // from the list.
    await waitFor(() => runner.messageHandlerInstances.length === 0, {
      timeoutMs: HANDLER_SHUTDOWN_TIMEOUT_MS,
      description:
        'handler instance removed after CHECKOUT_MESSAGE returned QUEUE_STOPPED',
    });

    // The cause recorded by the listener confirms the removal was
    // triggered by the STOPPED path, not by some other mechanism (a
    // crash, an unrelated event).
    expect(emittedCauses).toEqual([
      EMessageUnacknowledgementCause.QUEUE_STOPPED,
    ]);
  });

  // -------------------------------------------------------------------------
  // LOCKED
  // -------------------------------------------------------------------------

  it('removes the handler instance when CHECKOUT_MESSAGE returns QUEUE_LOCKED', async () => {
    const queue = uniqueQueue('process-msg-locked');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
    });

    await consumer.run();

    const runner = getRunner(consumer);
    await waitFor(() => runner.messageHandlerInstances.length === 1, {
      timeoutMs: HANDLER_SHUTDOWN_TIMEOUT_MS,
      description: 'handler instance registered after run',
    });

    const handler = runner.messageHandlerInstances[0];

    const emittedCauses: EMessageUnacknowledgementCause[] = [];
    handler.once('shutdownRequired', (cause) => {
      emittedCauses.push(cause);
    });

    await setQueueStateDirectly(queue, EQueueOperationalState.LOCKED, {
      lockId: 'test-lock-id',
      lockOwner: EQueueStateLockOwner.PURGE_JOB,
    });

    handler.processMessage('any-message-id');

    await waitFor(() => runner.messageHandlerInstances.length === 0, {
      timeoutMs: HANDLER_SHUTDOWN_TIMEOUT_MS,
      description:
        'handler instance removed after CHECKOUT_MESSAGE returned QUEUE_LOCKED',
    });

    expect(emittedCauses).toEqual([
      EMessageUnacknowledgementCause.QUEUE_LOCKED,
    ]);
  });

  // -------------------------------------------------------------------------
  // ACTIVE baseline
  // -------------------------------------------------------------------------

  it('keeps the handler instance alive when the queue stays ACTIVE', async () => {
    const queue = uniqueQueue('process-msg-active');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
    });

    await consumer.run();

    const runner = getRunner(consumer);
    await waitFor(() => runner.messageHandlerInstances.length === 1, {
      timeoutMs: HANDLER_SHUTDOWN_TIMEOUT_MS,
      description: 'handler instance registered after run',
    });

    const handler = runner.messageHandlerInstances[0];
    const handlerIdBefore = handler.getId();

    // Invoke `processMessage` with an ID that does not exist. The
    // script's queue-state check passes (ACTIVE), then the message
    // lookup fails with `MESSAGE_NOT_FOUND`. The handler calls `next()`
    // and stays alive.
    handler.processMessage('nonexistent-message-id');

    // Settle window: give the handler time to (incorrectly) shut down,
    // if it were going to.
    await bluebird.delay(NEGATIVE_ASSERTION_SETTLE_MS);

    // The handler is still in the list, and it is the same instance —
    // not a replacement that was somehow created.
    expect(runner.messageHandlerInstances).toHaveLength(1);
    expect(runner.messageHandlerInstances[0].getId()).toBe(handlerIdBefore);

    // The handler is operational. `isOperational()` is RedisSMQ's
    // own predicate for "this instance is up and running"; a false
    // value would mean the instance was left in a broken state even
    // though it was not removed from the list.
    expect(runner.messageHandlerInstances[0].isOperational()).toBe(true);
  });
});
