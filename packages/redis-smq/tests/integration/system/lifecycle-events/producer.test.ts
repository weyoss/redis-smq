/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { createBareProducer } from '../../../helpers/factories/producer.js';

/**
 * Smoke test for the producer's `Runnable` lifecycle.
 *
 * A single producer runs once and shuts down once. The test asserts
 * the four lifecycle events fire on the instance channel and the
 * predicate methods report the expected state at each checkpoint.
 */

describe('Producer lifecycle — smoke test', () => {
  it('reports the expected predicates and fires the four lifecycle events across a single run/shutdown cycle', async () => {
    const producer = createBareProducer();

    // Capture events in the order they fire. The exact sequence is
    // the load-bearing assertion — a regression that reordered or
    // dropped an event would fail with the observed sequence named.
    const events: string[] = [];
    producer.on('producer.goingUp', () => events.push('goingUp'));
    producer.on('producer.up', () => events.push('up'));
    producer.on('producer.goingDown', () => events.push('goingDown'));
    producer.on('producer.down', () => events.push('down'));

    try {
      // --- Checkpoint 1: down, before run ---
      //
      // A freshly constructed producer is in the down state — it has
      // not been run, so `isRunning()` is false and `isDown()` is
      // true. Confirming this baseline makes the post-run assertions
      // meaningful: without it, a regression that left the producer
      // perpetually "running" would fail the post-shutdown check for
      // a reason that looked like the shutdown path was broken.
      expect(producer.isRunning()).toBe(false);
      expect(producer.isDown()).toBe(true);
      expect(producer.isGoingUp()).toBe(false);
      expect(producer.isGoingDown()).toBe(false);
      expect(producer.isOperational()).toBe(false);

      // --- Run ---
      await producer.run();

      // --- Checkpoint 2: up, after run ---
      //
      // The transition is complete once `run()` resolves. All four
      // predicate pairs reflect the fully-up state, and the
      // transition-in-progress flags have cleared.
      expect(producer.isRunning()).toBe(true);
      expect(producer.isUp()).toBe(true);
      expect(producer.isDown()).toBe(false);
      expect(producer.isGoingUp()).toBe(false);
      expect(producer.isGoingDown()).toBe(false);
      expect(producer.isOperational()).toBe(true);

      // --- Shutdown ---
      await producer.shutdown();

      // --- Checkpoint 3: down, after shutdown ---
      expect(producer.isRunning()).toBe(false);
      expect(producer.isUp()).toBe(false);
      expect(producer.isDown()).toBe(true);
      expect(producer.isGoingUp()).toBe(false);
      expect(producer.isGoingDown()).toBe(false);
      expect(producer.isOperational()).toBe(false);

      // --- Events ---
      //
      // The exact sequence. This is where the file adds value over
      // the predicate assertions: a regression that suppressed an
      // event, duplicated one, or reversed the goingUp/up order would
      // pass the predicate checks (which only look at the settled
      // state) and fail here with the observed sequence named.
      expect(events).toEqual(['goingUp', 'up', 'goingDown', 'down']);
    } finally {
      // Defensive idempotent shutdown. The per-test teardown drains
      // the producer registry anyway, so a producer that already
      // reached `down` through the explicit shutdown above is a no-op
      // here; a producer that threw before reaching it gets cleaned
      // up.
      await producer.shutdown();
    }
  });
});
