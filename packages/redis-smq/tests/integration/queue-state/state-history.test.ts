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
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
  EStateTransitionReason,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for reading a queue's state-history log.
 *
 * Every transition a queue undergoes is appended to a history list.
 * `stateManager.getStateHistory(queue)` returns the whole list. The
 * entries are `IQueueStateTransition` records — the same shape
 * `getState()` returns for the most recent transition, but as a
 * sequence.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue state history', () => {
  // -------------------------------------------------------------------------
  // Initial history
  // -------------------------------------------------------------------------

  describe('initial history', () => {
    it('contains exactly one entry for a freshly created queue', async () => {
      // RedisSMQ records the transition from "nothing" to ACTIVE
      // when the queue is saved. No other transition has occurred yet.
      const queue = uniqueQueue('history-initial');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();
      const history = await stateManager.getStateHistory(queue);

      expect(history).toHaveLength(1);

      const creation = history[0];
      expect(creation.from).toBeNull();
      expect(creation.to).toBe(EQueueOperationalState.ACTIVE);
    });

    it('records the delivery model and queue type on the creation entry', async () => {
      const queue = uniqueQueue('history-creation-metadata');
      await createQueue(
        queue,
        EQueueType.PRIORITY_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
      );

      const stateManager = RedisSMQ.createQueueStateManager();
      const history = await stateManager.getStateHistory(queue);

      expect(history).toHaveLength(1);

      const creation = history[0];
      expect(creation.metadata).toEqual({
        deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
        queueType: EQueueType.PRIORITY_QUEUE,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Ordering
  // -------------------------------------------------------------------------

  describe('ordering', () => {
    it('returns entries newest-first', async () => {
      const queue = uniqueQueue('history-order');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      // First transition: pause with a distinctive reason.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
      });

      // Second transition: resume with a different reason.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
      });

      const history = await stateManager.getStateHistory(queue);

      // Three entries: creation, pause, resume.
      expect(history).toHaveLength(3);

      // Newest first: the resume is at index 0, the pause at index 1,
      // the creation at index 2.
      expect(history[0].to).toBe(EQueueOperationalState.ACTIVE);
      expect(history[0].reason).toBe(EStateTransitionReason.TESTING);

      expect(history[1].to).toBe(EQueueOperationalState.PAUSED);
      expect(history[1].reason).toBe(EStateTransitionReason.PERFORMANCE);

      expect(history[2].to).toBe(EQueueOperationalState.ACTIVE);
      expect(history[2].from).toBeNull();
    });

    it('chains consecutive entries when read chronologically', async () => {
      const queue = uniqueQueue('history-chain');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
      });
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const history = await stateManager.getStateHistory(queue);

      // Five entries: creation plus four transitions.
      expect(history).toHaveLength(5);

      // Reverse to chronological order for the chain check.
      const chronological = [...history].reverse();

      for (let i = 1; i < chronological.length; i += 1) {
        expect(
          chronological[i].from,
          `chain broken between entry ${i - 1} ` +
            `(to=${EQueueOperationalState[chronological[i - 1].to]}) ` +
            `and entry ${i} ` +
            `(from=${chronological[i].from === null ? 'null' : EQueueOperationalState[chronological[i].from!]})`,
        ).toBe(chronological[i - 1].to);
      }

      // The full chronological sequence, for a reader who wants to see
      // the transitions without reverse-engineering them from the
      // chain assertion above.
      expect(chronological.map((e) => e.to)).toEqual([
        EQueueOperationalState.ACTIVE,
        EQueueOperationalState.PAUSED,
        EQueueOperationalState.ACTIVE,
        EQueueOperationalState.STOPPED,
        EQueueOperationalState.ACTIVE,
      ]);
    });

    it('records timestamps in chronological order', async () => {
      const queue = uniqueQueue('history-timestamps');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const history = await stateManager.getStateHistory(queue);
      const chronological = [...history].reverse();

      for (let i = 0; i < chronological.length; i += 1) {
        const ts = chronological[i].timestamp;
        expect(typeof ts, `entry ${i} timestamp is not a number`).toBe(
          'number',
        );
        expect(
          ts,
          `entry ${i} timestamp is ${ts}, expected a positive value`,
        ).toBeGreaterThan(0);
      }

      for (let i = 1; i < chronological.length; i += 1) {
        expect(
          chronological[i].timestamp,
          `entry ${i} timestamp (${chronological[i].timestamp}) ` +
            `is earlier than entry ${i - 1} (${chronological[i - 1].timestamp})`,
        ).toBeGreaterThanOrEqual(chronological[i - 1].timestamp);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Content
  // -------------------------------------------------------------------------

  describe('entry content', () => {
    it('preserves the reason verbatim on every transition entry', async () => {
      const queue = uniqueQueue('history-reasons');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
      });
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const history = await stateManager.getStateHistory(queue);
      const chronological = [...history].reverse();

      // Skip index 0 — the creation entry. Its reason is set by the
      // framework, not by a caller, and the tests do not assert its
      // specific value because it is an implementation detail.
      const callerTransitions = chronological.slice(1);

      expect(callerTransitions[0].reason).toBe(
        EStateTransitionReason.PERFORMANCE,
      );
      expect(callerTransitions[1].reason).toBe(EStateTransitionReason.TESTING);
      expect(callerTransitions[2].reason).toBe(
        EStateTransitionReason.SCHEDULED,
      );
    });

    it('preserves caller-supplied descriptions verbatim', async () => {
      const queue = uniqueQueue('history-descriptions');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
        description: 'first distinctive description',
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
        description: 'second distinctive description',
      });

      const history = await stateManager.getStateHistory(queue);
      const chronological = [...history].reverse();

      const callerTransitions = chronological.slice(1);

      expect(callerTransitions[0].description).toBe(
        'first distinctive description',
      );
      expect(callerTransitions[1].description).toBe(
        'second distinctive description',
      );
    });

    it('ensures every caller-triggered entry carries a non-empty description', async () => {
      const queue = uniqueQueue('history-descriptions-present');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
        description: 'has a description',
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
        // description intentionally omitted
      });
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'has another description',
      });

      const history = await stateManager.getStateHistory(queue);
      expect(history).toHaveLength(4);

      // Newest-first: the newest three entries are the caller-triggered
      // transitions; the last entry is the creation record.
      const callerTransitions = history.slice(0, history.length - 1);

      expect(callerTransitions).toHaveLength(3);

      for (let i = 0; i < callerTransitions.length; i += 1) {
        const entry = callerTransitions[i];

        // The diagnostic uses the entry's index and `to` state to
        // identify which one failed. The `reason` field is not
        // indexed into the enum because its type is a union of the
        // caller-facing and system enums — indexing one of the two
        // would fail to compile for entries carrying the other.
        const label =
          `caller transition ${i} ` +
          `(to=${EQueueOperationalState[entry.to]})`;

        expect(
          typeof entry.description,
          `${label} has no description field`,
        ).toBe('string');
        expect(
          (entry.description as string).length,
          `${label} has an empty description`,
        ).toBeGreaterThan(0);
      }

      // The creation entry's `description` field is absent by design
      const creationEntry = history[history.length - 1];
      expect(creationEntry.from).toBeNull();
      expect(creationEntry.description ?? null).toBeNull();
    });

    it('leaves metadata undefined on transitions where the caller supplied none', async () => {
      const queue = uniqueQueue('history-metadata-absent');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        // metadata intentionally omitted
      });

      const history = await stateManager.getStateHistory(queue);
      const chronological = [...history].reverse();

      // Skip index 0 — the creation entry
      expect(chronological[1].metadata ?? null).toBeNull();
    });
  });
});
