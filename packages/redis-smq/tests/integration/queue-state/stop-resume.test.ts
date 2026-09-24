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
  EStateTransitionReason,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the stop/resume transition pair.
 *
 * `stop()` transitions a queue to `STOPPED`, and `resume()` transitions
 * it back to `ACTIVE`. In the `STOPPED` state, neither consuming nor
 * producing is allowed — the queue is fully offline. The behavioral
 * consequences are covered in `stopped-behavior.test.ts`; this file
 * only asserts the transition itself and the state it records.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue stop/resume', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts in the ACTIVE state', async () => {
    const queue = uniqueQueue('stop-initial');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);
  });

  // -------------------------------------------------------------------------
  // Single stop and resume
  // -------------------------------------------------------------------------

  describe('single transition pair', () => {
    it('transitions to STOPPED on stop and back to ACTIVE on resume', async () => {
      const queue = uniqueQueue('stop-single');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // Stop.
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      let props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.STOPPED);

      let state = await stateManager.getState(queue);
      expect(state.from).toBe(EQueueOperationalState.ACTIVE);
      expect(state.to).toBe(EQueueOperationalState.STOPPED);

      // Resume.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

      state = await stateManager.getState(queue);
      expect(state.from).toBe(EQueueOperationalState.STOPPED);
      expect(state.to).toBe(EQueueOperationalState.ACTIVE);
    });

    it('stops a paused queue and records PAUSED as the source state', async () => {
      const queue = uniqueQueue('stop-from-paused');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // Pause first.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const pausedProps = await queueManager.getProperties(queue);
      expect(pausedProps.operationalState).toBe(EQueueOperationalState.PAUSED);

      // Then stop.
      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const stoppedProps = await queueManager.getProperties(queue);
      expect(stoppedProps.operationalState).toBe(
        EQueueOperationalState.STOPPED,
      );

      const state = await stateManager.getState(queue);
      expect(state.from).toBe(EQueueOperationalState.PAUSED);
      expect(state.to).toBe(EQueueOperationalState.STOPPED);
    });

    it('survives repeated stop/resume cycles', async () => {
      const queue = uniqueQueue('stop-cycles');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      for (let cycle = 0; cycle < 3; cycle += 1) {
        await stateManager.stop(queue, {
          reason: EStateTransitionReason.SCHEDULED,
          description: `cycle ${cycle} stop`,
        });

        let props = await queueManager.getProperties(queue);
        expect(
          props.operationalState,
          `expected STOPPED after cycle ${cycle} stop`,
        ).toBe(EQueueOperationalState.STOPPED);

        await stateManager.resume(queue, {
          reason: EStateTransitionReason.MANUAL,
          description: `cycle ${cycle} resume`,
        });

        props = await queueManager.getProperties(queue);
        expect(
          props.operationalState,
          `expected ACTIVE after cycle ${cycle} resume`,
        ).toBe(EQueueOperationalState.ACTIVE);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Transition metadata
  // -------------------------------------------------------------------------

  describe('transition metadata', () => {
    it('preserves the reason and description on stop', async () => {
      const queue = uniqueQueue('stop-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'planned maintenance window',
      });

      const state = await stateManager.getState(queue);
      expect(state.reason).toBe(EStateTransitionReason.SCHEDULED);
      expect(state.description).toBe('planned maintenance window');
    });

    it('preserves the reason and description on resume', async () => {
      const queue = uniqueQueue('resume-from-stopped-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'maintenance complete',
      });

      const state = await stateManager.getState(queue);
      expect(state.reason).toBe(EStateTransitionReason.MANUAL);
      expect(state.description).toBe('maintenance complete');
    });

    it('preserves arbitrary metadata on the transition', async () => {
      // Same free-form bag as pause/resume. Nested objects and arrays
      // confirm the whole value round-trips through JSON serialization.
      const queue = uniqueQueue('stop-arbitrary-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      const metadata: Record<string, unknown> = {
        operator: 'system-admin',
        ticket: 'EMERG-789',
        severity: 'high',
        estimated_duration: '2 hours',
        affected_services: ['consumer', 'producer'],
        nested: { region: 'eu-west-1', on_call: true },
      };

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'emergency maintenance',
        metadata,
      });

      const state = await stateManager.getState(queue);
      expect(state.metadata).toEqual(metadata);
    });

    it('synthesizes a description when none is provided', async () => {
      const queue = uniqueQueue('stop-default-description');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
      });

      const state = await stateManager.getState(queue);

      expect(typeof state.description).toBe('string');
      expect((state.description as string).length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Accessor consistency
  // -------------------------------------------------------------------------

  describe('accessor consistency', () => {
    it('getProperties and getState agree after each transition', async () => {
      const queue = uniqueQueue('stop-accessors');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'consistency check',
      });

      const propsAfterStop = await queueManager.getProperties(queue);
      const stateAfterStop = await stateManager.getState(queue);
      expect(
        propsAfterStop.operationalState,
        'after stop: getProperties().operationalState ' +
          'and getState().to must agree',
      ).toBe(stateAfterStop.to);

      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'consistency check',
      });

      const propsAfterResume = await queueManager.getProperties(queue);
      const stateAfterResume = await stateManager.getState(queue);
      expect(
        propsAfterResume.operationalState,
        'after resume: getProperties().operationalState ' +
          'and getState().to must agree',
      ).toBe(stateAfterResume.to);
    });
  });
});
