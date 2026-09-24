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
 * Integration test for the `Runnable` lifecycle under mixed
 * sequential and concurrent transitions.
 *
 * The scenario combines the two sibling patterns in a single test:
 * two consumers are started sequentially (one `await` at a time),
 * then all four are started concurrently. The same pattern is
 * repeated on the shutdown side: two consumers shut down
 * sequentially, then all four shut down concurrently.
 *
 * The two consumers that were started in the sequential phase are
 * re-`run()` in the concurrent phase — a no-op, because they are
 * already running. Similarly, the two shut down sequentially are
 * re-`shutdown()` in the concurrent phase. Those extra calls are the
 * point: they pin RedisSMQ's *idempotency* contract — a
 * `run()` on a running consumer fires no lifecycle events, and a
 * `shutdown()` on a down consumer fires no lifecycle events.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Number of consumer instances.
 *
 * Four matches the sibling concurrency files, so a reader comparing
 * the three files sees the same instance count. Two of the four are
 * the sequential-phase consumers; two are added in the concurrent
 * phase. The `SEQUENTIAL_SUBSET` constant below names the split.
 */
const NUM_CONSUMERS = 4;

/**
 * Number of consumers started (and shut down) in the sequential
 * phase. The remaining `NUM_CONSUMERS - SEQUENTIAL_SUBSET` are
 * started only in the concurrent phase.
 *
 * Two is the smallest value that exercises the idempotency contract
 * with more than one instance in the sequential phase. With one, the
 * concurrent batch's interaction with an already-running instance
 * would be a single case rather than a class.
 */
const SEQUENTIAL_SUBSET = 2;

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('Consumer lifecycle — mixed sequential and concurrent', () => {
  it('produces correct per-instance lifecycle events across mixed sequential and concurrent phases', async () => {
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
      // -----------------------------------------------------------------
      // Phase 1 — sequential run of the first `SEQUENTIAL_SUBSET`
      // -----------------------------------------------------------------
      //
      // Each `run()` is awaited individually, so the second starts
      // only after the first has fully resolved. These consumers
      // reach the up state before the concurrent phase begins.
      for (let i = 0; i < SEQUENTIAL_SUBSET; i += 1) {
        await consumers[i].run();
      }

      // -----------------------------------------------------------------
      // Phase 2 — concurrent run of all consumers
      // -----------------------------------------------------------------
      //
      // For the first `SEQUENTIAL_SUBSET` consumers this is an
      // idempotent call — they are already running, and the
      // framework's `run()` is a no-op in that state. For the
      // remaining consumers this is their first run.
      //
      // The `Promise.all` issues all four at once, so the
      // already-running instances and the fresh instances are in
      // the same startup batch.
      await Promise.all(consumers.map((c) => c.run()));

      // -----------------------------------------------------------------
      // Phase 3 — sequential shutdown of the first `SEQUENTIAL_SUBSET`
      // -----------------------------------------------------------------
      //
      // Same shape as phase 1, mirrored. The first two consumers
      // reach the down state before the concurrent shutdown phase.
      for (let i = 0; i < SEQUENTIAL_SUBSET; i += 1) {
        await consumers[i].shutdown();
      }

      // -----------------------------------------------------------------
      // Phase 4 — concurrent shutdown of all consumers
      // -----------------------------------------------------------------
      //
      // For the first `SEQUENTIAL_SUBSET` consumers this is an
      // idempotent call — they are already down. For the remaining
      // consumers this is their first shutdown.
      await Promise.all(consumers.map((c) => c.shutdown()));

      // -----------------------------------------------------------------
      // Assertions
      // -----------------------------------------------------------------
      //
      // Every consumer fires exactly one of each lifecycle event,
      // regardless of how many `run()` or `shutdown()` calls it
      // received. The per-consumer assertion names the diverging
      // instance in its failure message.
      //
      // For the first `SEQUENTIAL_SUBSET` consumers, this is the
      // *idempotency* assertion: they received two `run()` calls and
      // two `shutdown()` calls, and only the first of each pair fired
      // events. A regression that re-fired the events on the
      // idempotent calls would double the counts here.
      //
      // For the remaining consumers, this is the *concurrency*
      // assertion: they received exactly one `run()` and one
      // `shutdown()`, and their events fired exactly once.
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

      // The consumer IDs are distinct. Same supporting check as the
      // concurrent-only file — the per-instance event correlation
      // depends on the IDs being unique.
      const ids = consumers.map((c) => c.getId());
      expect(new Set(ids).size, 'consumer IDs should be distinct').toBe(
        NUM_CONSUMERS,
      );
    } finally {
      // Defensive idempotent shutdown. The per-test harness drains
      // the consumer registry anyway, so any consumer that already
      // reached `down` through the explicit shutdown above is a
      // no-op here; a consumer that threw before reaching it gets
      // cleaned up.
      //
      // The concurrent `Promise.all` is fine even if some instances
      // are down and others are up — the already-down ones are
      // no-ops, and the others complete their shutdown.
      await Promise.all(consumers.map((c) => c.shutdown()));
    }
  });
});
