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
  EQueueDeliveryModel,
  EQueueType,
  EStateTransitionReason,
  type IConsumer,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { _generateEphemeralConsumerGroupId } from '../../../src/core/consumer/_/_generate-ephemeral-consumer-group-id.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { getGroupIds, waitForGroupIds } from '../../helpers/pub-sub/groups.js';

/**
 * Integration tests for the lifecycle of ephemeral consumer groups.
 *
 * A consumer that registers on a PUB_SUB queue without an explicit
 * group ID gets an *ephemeral* group derived from its own consumer ID:
 * `cid-<consumerId>`. RedisSMQ creates the group on `consume()`
 * and is responsible for deleting it when the consumer's registration
 * ends.
 *
 * The lifecycle has a sharp edge that the tests below pin: **not every
 * teardown deletes the group**. RedisSMQ's
 * `MessageHandlerRunner` distinguishes two teardown paths:
 *
 *   - `removeHandlerInstance` — used by `cancel()` and by consumer
 *     `shutdown()`. The handler's config is gone permanently, so the
 *     ephemeral group is deleted.
 *
 *   - `stopMessageHandler` — used for queue state transitions
 *     (ACTIVE → PAUSED/STOPPED/LOCKED). The config survives so the
 *     handler can restart when the queue returns to ACTIVE, and the
 *     ephemeral group must survive with it. Deleting the group on
 *     pause would force the consumer to acquire a new one on resume —
 *     which would silently break fan-out for any message produced
 *     during the paused window.
 *
 * The distinction is the reason the runner has two methods rather than
 * one. A regression that collapsed them — using the deleting path for
 * every teardown — would pass the cancel and shutdown tests below and
 * fail the pause/resume test.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The subset of `MessageHandlerRunner` the white-box test reaches
 * into.
 *
 * Declaring the shape here keeps the cast narrow: a future change to
 * the runner that breaks this interface fails at the cast site rather
 * than producing a `TypeError` deep inside an assertion.
 */
interface IRunnerInternals {
  messageHandlerInstances: Array<{ getId(): string; isOperational(): boolean }>;
  reconcileHandlers(): void;
}

function getRunner(consumer: IConsumer): IRunnerInternals {
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
 * Register a consumer on a PUB_SUB queue with no explicit group,
 * start it, and return the consumer together with its generated
 * ephemeral group ID.
 *
 * The consumer is started because the tests in this file exercise
 * lifecycle reactions that only a running consumer exhibits:
 * cancel and shutdown tear down the handler *instance* (not just the
 * config), and a queue state change stops or restarts the running
 * handler. Without a running consumer, "the handler stopped" is
 * vacuously true (there is no instance to stop) and the assertions
 * pass for the wrong reason. See the file header for the full
 * rationale.
 *
 * The handler is an immediate-ack no-op — the tests in this file are
 * about the group's lifecycle, not about delivery, so the handler's
 * behavior is irrelevant.
 */
async function registerEphemeralConsumer(
  queue: IQueueParams,
): Promise<{ consumer: IConsumer; groupId: string }> {
  const consumer = createBareConsumer();
  await consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
    cb(),
  );
  await consumer.run();
  return {
    consumer,
    groupId: _generateEphemeralConsumerGroupId(consumer.getId()),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — ephemeral group lifecycle', () => {
  // -------------------------------------------------------------------------
  // Creation baseline
  // -------------------------------------------------------------------------

  it('creates the ephemeral group when the consumer registers', async () => {
    const queue = uniqueQueue('eph-create');
    await createQueue(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.PUB_SUB,
    );

    const { groupId } = await registerEphemeralConsumer(queue);

    await waitForGroupIds(
      queue,
      (groups) => groups.includes(groupId),
      `ephemeral group ${groupId} present on the queue`,
    );

    expect(await getGroupIds(queue)).toEqual([groupId]);
  });

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------

  describe('cancel()', () => {
    it('deletes the ephemeral group', async () => {
      const queue = uniqueQueue('eph-cancel');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const { consumer, groupId } = await registerEphemeralConsumer(queue);

      // Pre-state: the group is present. Without this, the post-cancel
      // assertion could pass on a queue whose group was never created.
      await waitForGroupIds(
        queue,
        (groups) => groups.includes(groupId),
        `ephemeral group ${groupId} present before cancel`,
      );

      await consumer.cancel(queue);

      await waitForGroupIds(
        queue,
        (groups) => groups.length === 0,
        'ephemeral group removed after cancel',
      );

      expect(await getGroupIds(queue)).toEqual([]);
    });

    it('recreates the group with the same ID when the consumer re-registers', async () => {
      const queue = uniqueQueue('eph-recreate');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const { consumer, groupId } = await registerEphemeralConsumer(queue);

      await waitForGroupIds(
        queue,
        (groups) => groups.includes(groupId),
        `ephemeral group ${groupId} present before cancel`,
      );

      await consumer.cancel(queue);
      await waitForGroupIds(
        queue,
        (groups) => groups.length === 0,
        'ephemeral group removed after cancel',
      );

      // Re-consume the same queue on the same consumer. The consumer
      // is still running — `cancel` removes the handler for that
      // queue, not the consumer itself — so the re-registration
      // immediately starts a fresh handler instance, which creates
      // the ephemeral group again.
      await consumer.consume(
        queue,
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );

      await waitForGroupIds(
        queue,
        (groups) => groups.includes(groupId),
        `ephemeral group ${groupId} present after re-registration`,
      );

      // The group ID is exactly what it was before the cancel.
      expect(await getGroupIds(queue)).toEqual([groupId]);
    });
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown
  // -------------------------------------------------------------------------

  describe('shutdown()', () => {
    it('deletes the ephemeral group', async () => {
      const queue = uniqueQueue('eph-shutdown');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const { consumer, groupId } = await registerEphemeralConsumer(queue);

      await waitForGroupIds(
        queue,
        (groups) => groups.includes(groupId),
        `ephemeral group ${groupId} present before shutdown`,
      );

      await consumer.shutdown();

      await waitForGroupIds(
        queue,
        (groups) => groups.length === 0,
        'ephemeral group removed after shutdown',
      );

      expect(await getGroupIds(queue)).toEqual([]);
    });

    it('deletes the ephemeral groups of two consumers independently', async () => {
      const queue = uniqueQueue('eph-shutdown-two');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const consumerA = await registerEphemeralConsumer(queue);
      const consumerB = await registerEphemeralConsumer(queue);

      expect(consumerA.groupId).not.toBe(consumerB.groupId);

      await waitForGroupIds(
        queue,
        (groups) =>
          groups.includes(consumerA.groupId) &&
          groups.includes(consumerB.groupId),
        'both ephemeral groups present before shutdown',
      );

      // Shut down A. Its group goes; B's stays.
      await consumerA.consumer.shutdown();

      await waitForGroupIds(
        queue,
        (groups) =>
          !groups.includes(consumerA.groupId) &&
          groups.includes(consumerB.groupId),
        "A's group removed, B's group retained",
      );

      // Now shut down B. Its group goes too.
      await consumerB.consumer.shutdown();

      await waitForGroupIds(
        queue,
        (groups) => groups.length === 0,
        'both ephemeral groups removed',
      );
    });
  });

  // -------------------------------------------------------------------------
  // Queue state transition — the group survives
  // -------------------------------------------------------------------------

  describe('queue state transition', () => {
    it('preserves the ephemeral group across a pause and resume', async () => {
      const queue = uniqueQueue('eph-pause');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const { consumer, groupId } = await registerEphemeralConsumer(queue);

      await waitForGroupIds(
        queue,
        (groups) => groups.includes(groupId),
        `ephemeral group ${groupId} present before pause`,
      );

      // Pause the queue. The runner's reaction stops the handler
      // without removing the config.
      const stateManager = RedisSMQ.createQueueStateManager();
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Wait for the handler to be stopped — the in-memory status
      // flips to 'stopped'. This confirms the pause propagated to the
      // runner's registry.
      await waitFor(
        () =>
          consumer
            .getQueuesWithStatus()
            .every((entry) => entry.status === 'stopped'),
        {
          timeoutMs: 5000,
          description: 'handler stopped after queue pause',
        },
      );

      // The group is still present. This is the assertion that
      // distinguishes the pause path from the cancel and shutdown
      // paths.
      expect(await getGroupIds(queue)).toContain(groupId);

      // Resume the queue. The runner restarts the handler with the
      // same config, which carries the same ephemeral group ID.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      await waitFor(
        () =>
          consumer
            .getQueuesWithStatus()
            .every((entry) => entry.status === 'active'),
        {
          timeoutMs: 5000,
          description: 'handler restarted after queue resume',
        },
      );

      // The group is still there, unchanged. A single read, checked
      // both for membership and for exact contents — the two
      // assertions together catch both "the group vanished" and "an
      // extra group appeared".
      const finalGroups = await getGroupIds(queue);
      expect(finalGroups).toContain(groupId);
      expect(finalGroups).toEqual([groupId]);
    });
  });

  // -------------------------------------------------------------------------
  // Supervisor does not duplicate the handler
  // -------------------------------------------------------------------------

  describe('supervisor', () => {
    it('does not duplicate the handler on a reconcile tick', async () => {
      const queue = uniqueQueue('eph-supervisor');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const { consumer } = await registerEphemeralConsumer(queue);

      const runner = getRunner(consumer);

      // Baseline: exactly one handler instance for the queue.
      await waitFor(() => runner.messageHandlerInstances.length === 1, {
        timeoutMs: 5000,
        description: 'one handler instance after consumer run',
      });

      const instanceIdBefore = runner.messageHandlerInstances[0].getId();

      // Force a reconcile tick.
      runner.reconcileHandlers();

      // Settle window: give any async work the reconcile triggered a
      // chance to run. The assertion is on the count and on the
      // instance identity — a restart with a *different* instance ID
      // would be a regression even if the count stayed at one.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(runner.messageHandlerInstances).toHaveLength(1);
      expect(runner.messageHandlerInstances[0].getId()).toBe(instanceIdBefore);
      expect(runner.messageHandlerInstances[0].isOperational()).toBe(true);
    });
  });
});
