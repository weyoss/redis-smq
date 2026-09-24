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
 * Integration tests for the pause/resume transition pair.
 *
 * A queue is `ACTIVE` by default. `pause()` transitions it to `PAUSED`,
 * and `resume()` transitions it back to `ACTIVE`. In the `PAUSED`
 * state, consumers cannot take messages from the queue — the
 * `CHECKOUT_MESSAGE` script refuses — but producers can still add
 * messages. The behavioral consequences of that are covered in
 * `paused-behavior.test.ts`; this file is only about the transition
 * itself and the state it records.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue pause/resume', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts in the ACTIVE state', async () => {
    const queue = uniqueQueue('pause-initial');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

    const stateManager = RedisSMQ.createQueueStateManager();
    const state = await stateManager.getState(queue);
    expect(state.to).toBe(EQueueOperationalState.ACTIVE);
    expect(state.from).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Single pause and resume
  // -------------------------------------------------------------------------

  describe('single transition pair', () => {
    it('transitions to PAUSED on pause and back to ACTIVE on resume', async () => {
      const queue = uniqueQueue('pause-single');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // Pause.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      let props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.PAUSED);

      let state = await stateManager.getState(queue);
      expect(state.from).toBe(EQueueOperationalState.ACTIVE);
      expect(state.to).toBe(EQueueOperationalState.PAUSED);

      // Resume.
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      props = await queueManager.getProperties(queue);
      expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

      state = await stateManager.getState(queue);
      expect(state.from).toBe(EQueueOperationalState.PAUSED);
      expect(state.to).toBe(EQueueOperationalState.ACTIVE);
    });

    it('survives repeated pause/resume cycles', async () => {
      const queue = uniqueQueue('pause-cycles');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      for (let cycle = 0; cycle < 3; cycle += 1) {
        await stateManager.pause(queue, {
          reason: EStateTransitionReason.SCHEDULED,
          description: `cycle ${cycle} pause`,
        });

        let props = await queueManager.getProperties(queue);
        expect(
          props.operationalState,
          `expected PAUSED after cycle ${cycle} pause`,
        ).toBe(EQueueOperationalState.PAUSED);

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
    it('preserves the reason and description on pause', async () => {
      const queue = uniqueQueue('pause-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
        description: 'reducing load during a spike',
      });

      const state = await stateManager.getState(queue);
      expect(state.reason).toBe(EStateTransitionReason.PERFORMANCE);
      expect(state.description).toBe('reducing load during a spike');
    });

    it('preserves the reason and description on resume', async () => {
      const queue = uniqueQueue('resume-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });
      await stateManager.resume(queue, {
        reason: EStateTransitionReason.TESTING,
        description: 'resuming after a test',
      });

      const state = await stateManager.getState(queue);
      expect(state.reason).toBe(EStateTransitionReason.TESTING);
      expect(state.description).toBe('resuming after a test');
    });

    it('preserves arbitrary metadata on the transition', async () => {
      const queue = uniqueQueue('pause-arbitrary-metadata');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      const metadata: Record<string, unknown> = {
        operator: 'admin',
        ticket: 'INC-12345',
        reason_code: 42,
        affected_services: ['consumer', 'producer'],
        nested: { when: 'now', priority: 'high' },
      };

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'maintenance window',
        metadata,
      });

      const state = await stateManager.getState(queue);
      expect(state.metadata).toEqual(metadata);
    });

    it('synthesizes a description when none is provided', async () => {
      const queue = uniqueQueue('pause-default-description');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const stateManager = RedisSMQ.createQueueStateManager();

      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
      });

      const state = await stateManager.getState(queue);

      // The description is a non-empty string. RedisSMQ's
      // transition history is meant to be read by humans; an entry
      // with `description: null` or `''` would be unhelpful. A
      // regression that stopped synthesizing when the caller omitted
      // the field would fail here.
      expect(typeof state.description).toBe('string');
      expect((state.description as string).length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Accessor consistency
  // -------------------------------------------------------------------------

  describe('accessor consistency', () => {
    it('getProperties and getState agree after each transition', async () => {
      const queue = uniqueQueue('pause-accessors');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueManager = RedisSMQ.createQueueManager();
      const stateManager = RedisSMQ.createQueueStateManager();

      // After pause.
      await stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'consistency check',
      });

      const propsAfterPause = await queueManager.getProperties(queue);
      const stateAfterPause = await stateManager.getState(queue);
      expect(
        propsAfterPause.operationalState,
        'after pause: getProperties().operationalState ' +
          'and getState().to must agree',
      ).toBe(stateAfterPause.to);

      // After resume.
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
