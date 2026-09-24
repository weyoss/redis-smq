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
  EQueueType,
  errors,
  EStateTransitionReason,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for invalid state transitions.
 *
 * `QueueStateManager`'s transition methods enforce source-state
 * preconditions:
 *
 *   - `pause()`   accepts only ACTIVE.
 *   - `resume()`  accepts PAUSED or STOPPED, not ACTIVE or LOCKED.
 *   - `stop()`    accepts ACTIVE or PAUSED, not STOPPED or LOCKED.
 *
 * A call that violates the precondition rejects with
 * `QueueStateTransitionError`. The rejection is synchronous with the
 * state machine's decision — no partial transition, no intermediate
 * state written.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue state transition errors', () => {
  // -------------------------------------------------------------------------
  // Pause rejections
  // -------------------------------------------------------------------------

  describe('pause()', () => {
    it('rejects when the queue is already paused, and leaves the state unchanged', async () => {
      const queue = uniqueQueue('err-pause-paused');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // Put the queue in the source state the invalid transition needs.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'first pause',
      });

      // Confirm the precondition before the invalid attempt
      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.PAUSED);

      // The invalid transition.
      await expect(
        stateManager.pause(queue, {
          reason: EStateTransitionReason.MANUAL,
          description: 'second pause',
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      // The rejection must not have modified the state
      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.PAUSED);

      const stateAfter = await stateManager.getState(queue);
      expect(stateAfter.to).toBe(EQueueOperationalState.PAUSED);
      expect(stateAfter.description).toBe('first pause');
    });

    it('rejects when the queue is stopped, and leaves the state unchanged', async () => {
      const queue = uniqueQueue('err-pause-stopped');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.STOPPED);

      await expect(
        stateManager.pause(queue, {
          reason: EStateTransitionReason.MANUAL,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.STOPPED);

      const stateAfter = await stateManager.getState(queue);
      expect(stateAfter.to).toBe(EQueueOperationalState.STOPPED);
    });
  });

  // -------------------------------------------------------------------------
  // Resume rejections
  // -------------------------------------------------------------------------

  describe('resume()', () => {
    it('rejects when the queue is already active, and leaves the state unchanged', async () => {
      const queue = uniqueQueue('err-resume-active');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // A freshly created queue is ACTIVE, which is exactly the state
      // `resume()` refuses.
      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.ACTIVE);

      await expect(
        stateManager.resume(queue, {
          reason: EStateTransitionReason.MANUAL,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.ACTIVE);

      // The most recent state entry must still be the creation record.
      // A regression where the failed resume wrote a transition would
      // show up here as a non-null `from` field on the newest entry.
      const stateAfter = await stateManager.getState(queue);
      expect(stateAfter.from).toBeNull();
      expect(stateAfter.to).toBe(EQueueOperationalState.ACTIVE);
    });
  });

  // -------------------------------------------------------------------------
  // Stop rejections
  // -------------------------------------------------------------------------

  describe('stop()', () => {
    it('rejects when the queue is already stopped, and leaves the state unchanged', async () => {
      const queue = uniqueQueue('err-stop-stopped');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'first stop',
      });

      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.STOPPED);

      await expect(
        stateManager.stop(queue, {
          reason: EStateTransitionReason.SCHEDULED,
          description: 'second stop',
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.STOPPED);

      const stateAfter = await stateManager.getState(queue);
      expect(stateAfter.to).toBe(EQueueOperationalState.STOPPED);
      expect(stateAfter.description).toBe('first stop');
    });
  });

  // -------------------------------------------------------------------------
  // Consistency after failures
  // -------------------------------------------------------------------------

  describe('consistency after failures', () => {
    it('leaves the state unchanged after a chain of invalid attempts', async () => {
      const queue = uniqueQueue('err-chain');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'the only successful transition',
      });

      // Confirm the precondition.
      const propsBefore = await queueManager.getProperties(queue);
      expect(propsBefore.operationalState).toBe(EQueueOperationalState.STOPPED);

      // Three invalid attempts: two `stop()`s and one `pause()`. Each
      // must reject and leave the state untouched.
      await expect(
        stateManager.stop(queue, {
          reason: EStateTransitionReason.SCHEDULED,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      await expect(
        stateManager.pause(queue, {
          reason: EStateTransitionReason.MANUAL,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      await expect(
        stateManager.stop(queue, {
          reason: EStateTransitionReason.SCHEDULED,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      // The queue is still in the state the successful transition left.
      const propsAfter = await queueManager.getProperties(queue);
      expect(propsAfter.operationalState).toBe(EQueueOperationalState.STOPPED);

      const stateAfter = await stateManager.getState(queue);
      expect(stateAfter.to).toBe(EQueueOperationalState.STOPPED);
      expect(stateAfter.description).toBe('the only successful transition');

      // The history reflects exactly the creation entry and the one
      // successful stop. A regression that wrote a spurious entry for
      // a rejected attempt would fail here.
      const history = await stateManager.getStateHistory(queue);
      expect(history).toHaveLength(2);
    });

    it('allows a valid transition after an invalid attempt', async () => {
      const queue = uniqueQueue('err-recovery');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // Valid: ACTIVE → PAUSED.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      // Invalid: PAUSED → PAUSED.
      await expect(
        stateManager.pause(queue, {
          reason: EStateTransitionReason.MANUAL,
        }),
      ).rejects.toThrow(errors.QueueStateTransitionError);

      // Valid: PAUSED → ACTIVE. Succeeds despite the failed attempt
      // immediately before it.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      let props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

      // Valid: ACTIVE → STOPPED. Succeeds as well.
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.STOPPED);

      // The history reflects exactly the three valid transitions plus
      // the creation record. A regression that wrote a spurious entry
      // for the rejected attempt would fail here.
      const history = await stateManager.getStateHistory(queue);
      expect(history).toHaveLength(4);
    });
  });
});
