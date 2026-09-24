/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EQueueOperationalState,
  EQueueStateLockOwner,
  EQueueType,
  errors,
  EStateTransitionReason,
  ESystemStateTransitionReason,
  RedisSMQ,
} from '../../../src/index.js';
import { _setQueueState } from '../../../src/core/queue-state-manager/_/_set-queue-state.js';
import { withShared } from '../../../src/core/common/redis/connection-pool/with-shared.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the interaction between a queue's operational
 * state and its rate-limit operations.
 *
 * A rate limit is a *management-plane* setting: a caller uses it to
 * shape how a queue behaves, not to participate in the queue's
 * delivery flow. That distinguishes it from produce/consume, which are
 * data-plane operations and are blocked by the delivery-related
 * states. RedisSMQ's operational-state contract reflects the
 * distinction:
 *
 *   - PAUSED and STOPPED block deliveries (or produce as well, for
 *     STOPPED), but they are administrative states the caller enters
 *     deliberately — a caller who has paused a queue to drain it may
 *     still want to adjust the limit that will apply on resume. The
 *     framework permits rate-limit writes in these states.
 *
 *   - LOCKED is different. It is a state RedisSMQ itself enters
 *     while a maintenance job (currently the purge worker) holds the
 *     queue. A concurrent limit write from a caller would race the
 *     job's own bookkeeping. RedisSMQ refuses rate-limit writes
 *     in this state with `QueueLockedError`.
 *
 *   - Reads (`get`) are permitted in every state. There is no reason
 *     to hide the current limit from a caller who is inspecting a
 *     queue, and the read path is idempotent — it cannot race any
 *     writer.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * A valid rate-limit configuration. Same values as the sibling files
 * so a reader comparing them sees consistent numbers.
 */
const RATE_LIMIT = { limit: 5, interval: 1000 } as const;

/**
 * The lock metadata used by the LOCKED-state tests.
 *
 * The `lockId` is arbitrary — RedisSMQ does not interpret it
 * beyond using it as the token a caller must present to release the
 * lock. `PURGE_JOB` is the lock owner RedisSMQ itself uses for
 * the state, so it is the most realistic choice.
 */
const LOCK_ID = 'state-errors-test-lock';
const LOCK_OWNER = EQueueStateLockOwner.PURGE_JOB;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Transition a queue to PAUSED via the public API.
 *
 * Uses `QueueStateManager` rather than the private `_setQueueState`
 * helper because the transition itself is not what this test is
 * about — the test wants a queue in PAUSED state, and the public API
 * is the cleanest way to get one.
 *
 * The reason value comes from `EStateTransitionReason` — the
 * *caller-facing* enum. `EStateTransitionReason.TESTING` is the
 * appropriate value for a test setup: it records the intent
 * accurately and does not collide with the production-relevant
 * reasons (MANUAL, SCHEDULED, PERFORMANCE) that other tests use.
 *
 * `ESystemStateTransitionReason` would be a compile error here — the
 * public method's signature accepts only `EStateTransitionReason`.
 */
async function pauseQueue(
  queue: ReturnType<typeof uniqueQueue>,
): Promise<void> {
  const stateManager = RedisSMQ.createQueueStateManager();
  await stateManager.pause(queue, {
    reason: EStateTransitionReason.TESTING,
  });
}

/**
 * Transition a queue to STOPPED via the public API.
 *
 * Same reasoning as `pauseQueue`: caller-facing API, caller-facing
 * reason enum.
 */
async function stopQueue(queue: ReturnType<typeof uniqueQueue>): Promise<void> {
  const stateManager = RedisSMQ.createQueueStateManager();
  await stateManager.stop(queue, {
    reason: EStateTransitionReason.TESTING,
  });
}

/**
 * Write a queue's state to LOCKED, bypassing `QueueStateManager` and
 * therefore bypassing the `queue.stateChanged` event.
 *
 * See the file header for why this is white-box. The `from` state is
 * ACTIVE because that is the state a real lock acquisition starts
 * from.
 *
 * The reason value comes from `ESystemStateTransitionReason` — the
 * framework-internal enum. `_setQueueState` is the helper the
 * framework's own maintenance jobs use, so the system enum is the
 * correct choice here. The distinction matters: `RECOVERY` records
 * that the transition is framework-initiated rather than
 * caller-initiated, which is what a diagnostic reading of the
 * transition history should reflect.
 */
async function lockQueue(queue: ReturnType<typeof uniqueQueue>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    withShared(
      (client, done) => {
        _setQueueState(
          client,
          queue,
          EQueueOperationalState.ACTIVE,
          EQueueOperationalState.LOCKED,
          ESystemStateTransitionReason.RECOVERY,
          { lockId: LOCK_ID, lockOwner: LOCK_OWNER },
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

describe('Queue rate limit — operational state interactions', () => {
  // -------------------------------------------------------------------------
  // PAUSED
  // -------------------------------------------------------------------------

  describe('PAUSED queue', () => {
    it('set applies the limit', async () => {
      const queue = uniqueQueue('rl-state-paused-set');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await pauseQueue(queue);

      // Confirm the precondition
      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.PAUSED);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);

      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);
    });

    it('clear removes the limit', async () => {
      const queue = uniqueQueue('rl-state-paused-clear');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);
      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

      await pauseQueue(queue);

      await rateLimit.clear(queue);

      expect(await rateLimit.get(queue)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // STOPPED
  // -------------------------------------------------------------------------

  describe('STOPPED queue', () => {
    it('set applies the limit', async () => {
      const queue = uniqueQueue('rl-state-stopped-set');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await stopQueue(queue);

      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.STOPPED);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);

      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);
    });

    it('clear removes the limit', async () => {
      const queue = uniqueQueue('rl-state-stopped-clear');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);
      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

      await stopQueue(queue);

      await rateLimit.clear(queue);

      expect(await rateLimit.get(queue)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // LOCKED
  // -------------------------------------------------------------------------

  describe('LOCKED queue', () => {
    it('set rejects with QueueLockedError', async () => {
      const queue = uniqueQueue('rl-state-locked-set');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await lockQueue(queue);

      // Confirm the precondition — the queue is actually LOCKED from
      // RedisSMQ's perspective.
      const queueManager = RedisSMQ.createQueueManager();
      const props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.LOCKED);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(rateLimit.set(queue, RATE_LIMIT)).rejects.toThrow(
        errors.QueueLockedError,
      );
    });

    it('clear rejects with QueueLockedError', async () => {
      const queue = uniqueQueue('rl-state-locked-clear');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);
      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

      await lockQueue(queue);

      await expect(rateLimit.clear(queue)).rejects.toThrow(
        errors.QueueLockedError,
      );

      // The pre-lock limit is intact.
      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);
    });

    it('get still reads the limit', async () => {
      const queue = uniqueQueue('rl-state-locked-get');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      await rateLimit.set(queue, RATE_LIMIT);

      await lockQueue(queue);

      expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);
    });
  });
});
