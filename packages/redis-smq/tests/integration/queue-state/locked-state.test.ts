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
  EQueueOperationalState,
  EQueueStateLockOwner,
  EQueueType,
  errors,
  ESystemStateTransitionReason,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { _setQueueState } from '../../../src/core/queue-state-manager/_/_set-queue-state.js';
import { _unlockQueue } from '../../../src/core/queue-state-manager/_/_unlock-queue.js';
import { withShared } from '../../../src/core/common/redis/connection-pool/with-shared.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the LOCKED operational state.
 *
 * LOCKED is the state RedisSMQ uses to hold a queue offline while
 * a maintenance operation runs. Unlike PAUSED and STOPPED, LOCKED is
 * not set by a caller — RedisSMQ's background jobs set it
 * internally and release it when their work completes. The purge-queue
 * job is the current user of the state; other jobs could adopt the same
 * pattern.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set a queue's operational state to LOCKED, recording the given lock
 * metadata.
 *
 * Wraps `_setQueueState` in a Promise so the test body can `await` it
 * with the same shape as any other framework call. The `withShared`
 * helper handles acquiring a raw client from the pool and releasing it
 * afterwards.
 *
 * The `from` state is ACTIVE because that is the only state a real lock
 * acquisition starts from — RedisSMQ's jobs lock a queue that is
 * currently processing normally.
 */
async function lockQueue(
  queue: ReturnType<typeof uniqueQueue>,
  lockId: string,
  lockOwner: EQueueStateLockOwner,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    withShared(
      (client, done) => {
        _setQueueState(
          client,
          queue,
          EQueueOperationalState.ACTIVE,
          EQueueOperationalState.LOCKED,
          ESystemStateTransitionReason.RECOVERY,
          { lockId, lockOwner },
          (err) => done(err),
        );
      },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

/**
 * Release a queue's lock, returning it to ACTIVE.
 *
 * Wraps `_unlockQueue` in a Promise. The logger argument is passed as
 * an empty object cast to the expected type — `_unlockQueue` uses it
 * only for diagnostic logging, and the test does not exercise that path.
 */
async function unlockQueue(
  queue: ReturnType<typeof uniqueQueue>,
  lockId: string,
  lockOwner: EQueueStateLockOwner,
): Promise<void> {
  // The logger parameter of `_unlockQueue` is only consulted on the
  // error path. A no-op stub is sufficient for the success path.
  const noopLogger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  } as unknown as Parameters<typeof _unlockQueue>[4];

  await new Promise<void>((resolve, reject) => {
    _unlockQueue(
      queue,
      lockOwner,
      lockId,
      { reason: ESystemStateTransitionReason.RECOVERY },
      noopLogger,
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Locked queue state', () => {
  // -------------------------------------------------------------------------
  // Locking
  // -------------------------------------------------------------------------

  describe('acquiring a lock', () => {
    it('transitions the queue to LOCKED', async () => {
      const queue = uniqueQueue('locked-acquire');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();

      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.ACTIVE);

      await lockQueue(queue, 'job-1', EQueueStateLockOwner.PURGE_JOB);

      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.LOCKED);
    });

    it('records the lock metadata on the queue properties', async () => {
      const queue = uniqueQueue('locked-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const lockId = 'purge-job-abc-123';
      const lockOwner = EQueueStateLockOwner.PURGE_JOB;

      await lockQueue(queue, lockId, lockOwner);

      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);

      expect(props.operationalState).toBe(EQueueOperationalState.LOCKED);
      expect(props.lockId).toBe(lockId);
    });

    it('records the transition in the state history', async () => {
      const queue = uniqueQueue('locked-history');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await lockQueue(queue, 'job-2', EQueueStateLockOwner.PURGE_JOB);

      const stateManager = RedisSMQ.createQueueStateManager();
      const state = await stateManager.getState(queue);

      expect(state.from).toBe(EQueueOperationalState.ACTIVE);
      expect(state.to).toBe(EQueueOperationalState.LOCKED);
    });
  });

  // -------------------------------------------------------------------------
  // Consume behavior
  // -------------------------------------------------------------------------

  describe('consuming a locked queue', () => {
    it('rejects a consumer registration with QueueLockedError', async () => {
      const queue = uniqueQueue('locked-consume');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await lockQueue(queue, 'job-3', EQueueStateLockOwner.PURGE_JOB);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueueLockedError);

      // A rejected registration must leave no handler-set entry
      // behind — same contract as the paused and stopped cases.
      expect(consumer.getQueues()).toEqual([]);
    });

    it('accepts the same registration after the lock is released', async () => {
      const queue = uniqueQueue('locked-unlock-consume');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const lockId = 'job-4';
      const lockOwner = EQueueStateLockOwner.PURGE_JOB;

      await lockQueue(queue, lockId, lockOwner);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).rejects.toThrow(errors.QueueLockedError);

      await unlockQueue(queue, lockId, lockOwner);

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).resolves.toBeUndefined();

      expect(
        consumer.getQueues().map((entry) => entry.queueParams),
      ).toContainEqual(queue);
    });
  });

  // -------------------------------------------------------------------------
  // Unlocking
  // -------------------------------------------------------------------------

  describe('releasing a lock', () => {
    it('transitions the queue back to ACTIVE', async () => {
      const queue = uniqueQueue('locked-release');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const lockId = 'job-5';
      const lockOwner = EQueueStateLockOwner.PURGE_JOB;

      await lockQueue(queue, lockId, lockOwner);

      const queueManager = RedisSMQ.createQueueManager();
      const lockedProps = await queueManager.getProperties(queue);
      expect(lockedProps.operationalState).toBe(EQueueOperationalState.LOCKED);

      await unlockQueue(queue, lockId, lockOwner);

      const activeProps = await queueManager.getProperties(queue);
      expect(activeProps.operationalState).toBe(EQueueOperationalState.ACTIVE);

      // The lock metadata is cleared. `lockId` is `null` on an active
      // queue — RedisSMQ resets it as part of the unlock, so a
      // recovery worker reading the queue would not mistake it for a
      // still-locked one.
      expect(activeProps.lockId ?? null).toBeNull();
    });

    it('records the unlock transition in the state history', async () => {
      const queue = uniqueQueue('locked-release-history');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const lockId = 'job-6';
      const lockOwner = EQueueStateLockOwner.PURGE_JOB;

      await lockQueue(queue, lockId, lockOwner);
      await unlockQueue(queue, lockId, lockOwner);

      const stateManager = RedisSMQ.createQueueStateManager();
      const history = await stateManager.getStateHistory(queue);

      expect(history).toHaveLength(3);

      // Newest first: unlock, lock, creation.
      expect(history[0].from).toBe(EQueueOperationalState.LOCKED);
      expect(history[0].to).toBe(EQueueOperationalState.ACTIVE);

      expect(history[1].from).toBe(EQueueOperationalState.ACTIVE);
      expect(history[1].to).toBe(EQueueOperationalState.LOCKED);

      expect(history[2].from).toBeNull();
      expect(history[2].to).toBe(EQueueOperationalState.ACTIVE);
    });
  });
});
