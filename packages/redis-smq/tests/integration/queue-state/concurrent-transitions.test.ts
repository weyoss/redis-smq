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
 * Integration tests for concurrent state transitions.
 *
 * Two or more transition calls issued at the same time against the
 * same queue must not both apply. RedisSMQ serializes them: one
 * call wins and writes the new state, the others detect that the state
 * moved under them and reject with `QueueStateTransitionError`.
 *
 * The atomicity guarantee rests on the state record carrying a version
 * or source-state token that the write path compares before applying.
 * RedisSMQ does not expose that mechanism, and the tests do not
 * assume which call will win — they assert the *invariant*: exactly one
 * winner, exactly N−1 losers, and a final state consistent with the
 * winner's target.
 *
 * WHY `Promise.allSettled` AND NOT `Promise.all`:
 *
 *   `Promise.all` short-circuits on the first rejection and discards
 *   the results of the other calls, so a bug where two calls *both*
 *   succeeded would go undetected — the aggregate promise would resolve
 *   only if all succeeded, and a single spurious success in the middle
 *   of a rejecting batch would be invisible.
 *
 *   `Promise.allSettled` waits for every call and reports each one's
 *   outcome. The tests can then count winners and losers explicitly,
 *   and a regression that changed the winner-count would fail with a
 *   message naming the actual distribution.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A settled-result summary that counts outcomes and lists the
 * rejection reasons.
 *
 * The tests assert on `fulfilledCount`, `rejectedCount`, and the class
 * of each rejection. This shape makes those assertions direct rather
 * than requiring each test to filter the `PromiseSettledResult` array
 * inline.
 */
interface ISettledSummary {
  fulfilledCount: number;
  rejectedCount: number;
  reasons: unknown[];
}

function summarize(results: PromiseSettledResult<unknown>[]): ISettledSummary {
  const fulfilled = results.filter(
    (r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled',
  );
  const rejected = results.filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected',
  );
  return {
    fulfilledCount: fulfilled.length,
    rejectedCount: rejected.length,
    reasons: rejected.map((r) => r.reason),
  };
}

/**
 * Assert that exactly one call won and that every loser rejected with
 * `QueueStateTransitionError`.
 *
 * A single helper for all the concurrency tests, so the invariant is
 * expressed once and any test that runs into it produces a consistent
 * failure shape.
 *
 * The failure messages name the actual counts and the class of the
 * first unexpected rejection reason, so a regression that produced a
 * different distribution is diagnosable from the assertion alone.
 */
function expectExactlyOneWinner(
  results: PromiseSettledResult<unknown>[],
  expectedTotal: number,
  label: string,
): void {
  const summary = summarize(results);

  expect(
    summary.fulfilledCount,
    `${label}: expected exactly 1 successful call out of ` +
      `${expectedTotal}, got ${summary.fulfilledCount}`,
  ).toBe(1);

  expect(
    summary.rejectedCount,
    `${label}: expected exactly ${expectedTotal - 1} rejected calls ` +
      `out of ${expectedTotal}, got ${summary.rejectedCount}`,
  ).toBe(expectedTotal - 1);

  for (let i = 0; i < summary.reasons.length; i += 1) {
    expect(
      summary.reasons[i],
      `${label}: rejection ${i} is not a QueueStateTransitionError`,
    ).toBeInstanceOf(errors.QueueStateTransitionError);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Concurrent state transitions', () => {
  // -------------------------------------------------------------------------
  // Pause vs pause
  // -------------------------------------------------------------------------

  it('serializes two concurrent pause calls — one wins, one loses', async () => {
    const queue = uniqueQueue('concurrent-pause');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const stateManager = RedisSMQ.createQueueStateManager();

    const results = await Promise.allSettled([
      stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'concurrent pause A',
      }),
      stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'concurrent pause B',
      }),
    ]);

    expectExactlyOneWinner(results, 2, 'two concurrent pauses');

    // The final state is PAUSED — the target of both calls.
    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.PAUSED);

    // The history records exactly the creation entry plus the winning
    // transition. A regression where the losing call wrote a partial
    // entry before its CAS check failed would push this to three.
    const history = await stateManager.getStateHistory(queue);
    expect(history).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Stop vs stop vs stop
  // -------------------------------------------------------------------------

  it('serializes three concurrent stop calls — one wins, two lose', async () => {
    const queue = uniqueQueue('concurrent-stop');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const stateManager = RedisSMQ.createQueueStateManager();

    const results = await Promise.allSettled([
      stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'concurrent stop A',
      }),
      stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'concurrent stop B',
      }),
      stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'concurrent stop C',
      }),
    ]);

    expectExactlyOneWinner(results, 3, 'three concurrent stops');

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.STOPPED);

    const history = await stateManager.getStateHistory(queue);
    expect(history).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Resume vs resume
  // -------------------------------------------------------------------------

  it('serializes two concurrent resume calls — one wins, one loses', async () => {
    const queue = uniqueQueue('concurrent-resume');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const stateManager = RedisSMQ.createQueueStateManager();

    // Establish the paused state.
    await stateManager.pause(queue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'setup pause',
    });

    const results = await Promise.allSettled([
      stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'concurrent resume A',
      }),
      stateManager.resume(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'concurrent resume B',
      }),
    ]);

    expectExactlyOneWinner(results, 2, 'two concurrent resumes');

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

    // Creation + setup pause + winning resume = 3 entries.
    const history = await stateManager.getStateHistory(queue);
    expect(history).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // Pause vs stop
  // -------------------------------------------------------------------------

  it('serializes a concurrent pause/stop race from ACTIVE', async () => {
    const queue = uniqueQueue('concurrent-pause-stop');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const stateManager = RedisSMQ.createQueueStateManager();

    const results = await Promise.allSettled([
      stateManager.pause(queue, {
        reason: EStateTransitionReason.PERFORMANCE,
        description: 'pause raced against stop',
      }),
      stateManager.stop(queue, {
        reason: EStateTransitionReason.SCHEDULED,
        description: 'stop raced against pause',
      }),
    ]);

    expectExactlyOneWinner(results, 2, 'concurrent pause/stop');

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);

    // Either PAUSED or STOPPED is a valid outcome, depending on which
    // call won. Anything else — ACTIVE (neither applied), or an
    // intermediate state — is a bug.
    expect(
      props.operationalState === EQueueOperationalState.PAUSED ||
        props.operationalState === EQueueOperationalState.STOPPED,
      `expected PAUSED or STOPPED after pause/stop race, got ` +
        `${EQueueOperationalState[props.operationalState]}`,
    ).toBe(true);

    // The history has the creation entry plus exactly one transition.
    const history = await stateManager.getStateHistory(queue);
    expect(history).toHaveLength(2);

    // The winning transition's target matches the current state.
    // This is the strongest assertion the race permits — it verifies
    // that the state and the history agree about which call won.
    expect(history[0].to).toBe(props.operationalState);
    expect(history[0].from).toBe(EQueueOperationalState.ACTIVE);
  });

  // -------------------------------------------------------------------------
  // Post-race recovery
  // -------------------------------------------------------------------------

  it('allows a valid transition after a race resolves', async () => {
    const queue = uniqueQueue('concurrent-recovery');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const stateManager = RedisSMQ.createQueueStateManager();

    // Race two pauses.
    const results = await Promise.allSettled([
      stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'race A',
      }),
      stateManager.pause(queue, {
        reason: EStateTransitionReason.MANUAL,
        description: 'race B',
      }),
    ]);

    expectExactlyOneWinner(results, 2, 'two concurrent pauses (recovery)');

    // The queue is paused. A subsequent resume must succeed.
    await stateManager.resume(queue, {
      reason: EStateTransitionReason.MANUAL,
      description: 'post-race resume',
    });

    const queueManager = RedisSMQ.createQueueManager();
    const props = await queueManager.getProperties(queue);
    expect(props.operationalState).toBe(EQueueOperationalState.ACTIVE);

    // Creation + winning pause + resume = 3 entries.
    const history = await stateManager.getStateHistory(queue);
    expect(history).toHaveLength(3);
  });
});
