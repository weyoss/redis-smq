/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it, vitest } from 'vitest';
import { createBareConsumer } from '../../../helpers/factories/consumer.js';

/**
 * Integration test for the `Runnable` lifecycle under concurrent
 * run/shutdown of multiple consumers.
 *
 * N consumers are created in the same process and driven through
 * their run and shutdown transitions *concurrently* — the transitions
 * are issued with `Promise.all`, so each instance's startup sequence
 * races the others for the same Redis connection pool and the same
 * process-wide event bus. Each instance's lifecycle events must fire
 * correctly despite the interleaving.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Number of consumer instances running concurrently.
 *
 * Four is enough to exercise the interleaving — with two instances,
 * most concurrency bugs would still be caught, but with four the
 * shared-state contention is more realistic and the pool has to
 * actually queue requests rather than just alternating between two
 * instances. The original `health-check/test00005` also used four.
 */
const NUM_CONSUMERS = 4;

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('Consumer lifecycle — concurrent run/shutdown', () => {
  it('runs and shuts down all consumers concurrently with correct per-instance lifecycle events', async () => {
    const consumers = Array.from({ length: NUM_CONSUMERS }, () =>
      createBareConsumer(),
    );

    // Per-consumer event mocks. Each consumer gets its own set of
    // four mock functions, so the per-consumer assertions at the end
    // cannot be accidentally satisfied by another instance's events.
    const events = consumers.map(() => ({
      goingUp: vitest.fn(),
      up: vitest.fn(),
      goingDown: vitest.fn(),
      down: vitest.fn(),
    }));

    consumers.forEach((consumer, i) => {
      consumer.on('consumer.goingUp', events[i].goingUp);
      consumer.on('consumer.up', events[i].up);
      consumer.on('consumer.goingDown', events[i].goingDown);
      consumer.on('consumer.down', events[i].down);
    });

    try {
      // --- Concurrent run ---
      //
      // All four `run()` calls start at the same tick. Their
      // resolution is independent — each instance's startup
      // sequence has to complete on its own — so the `Promise.all`
      // resolves once the last instance is up.
      await Promise.all(consumers.map((c) => c.run()));

      // --- Concurrent shutdown ---
      //
      // Same shape. The four `shutdown()` calls race the same way,
      // and the aggregate resolves once the last instance has
      // reached its down state.
      await Promise.all(consumers.map((c) => c.shutdown()));

      // --- Assertions ---
      //
      // Per-consumer lifecycle event counts. Every instance should
      // see exactly one of each event, no more and no less.
      //
      // The assertion loops per-consumer rather than aggregating
      // across consumers. An aggregate like "4 goingUp calls total"
      // would pass if one consumer fired goingUp twice and another
      // fired it zero times — a plausible bug if RedisSMQ's
      // event emission used a shared registry keyed by event name
      // rather than by instance.
      for (let i = 0; i < NUM_CONSUMERS; i += 1) {
        expect(
          events[i].goingUp,
          `consumer ${i} should have fired goingUp exactly once`,
        ).toHaveBeenCalledTimes(1);

        expect(
          events[i].up,
          `consumer ${i} should have fired up exactly once`,
        ).toHaveBeenCalledTimes(1);

        expect(
          events[i].goingDown,
          `consumer ${i} should have fired goingDown exactly once`,
        ).toHaveBeenCalledTimes(1);

        expect(
          events[i].down,
          `consumer ${i} should have fired down exactly once`,
        ).toHaveBeenCalledTimes(1);
      }

      // The consumer IDs are distinct. This is a supporting check
      // for the lifecycle event correlation: if two consumers
      // shared an ID, RedisSMQ's event correlation (which uses
      // the ID) would attribute one instance's events to the other.
      //
      // The check is small and the contract is real, so it is worth
      // pinning here rather than in a separate file. It is not this
      // file's subject — the concurrent lifecycle is — but it is
      // the contract that makes the per-instance assertions above
      // meaningful.
      const ids = consumers.map((c) => c.getId());
      expect(new Set(ids).size, 'consumer IDs should be distinct').toBe(
        NUM_CONSUMERS,
      );
    } finally {
      // Defensive idempotent shutdown
      await Promise.all(consumers.map((c) => c.shutdown()));
    }
  });
});
