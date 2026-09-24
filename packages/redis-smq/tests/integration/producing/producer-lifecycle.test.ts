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
  createBareProducer,
  startProducer,
} from '../../helpers/factories/producer.js';

/**
 * Producer lifecycle: predicates, events, identity.
 *
 * The producer is a `Runnable` — it has a `run()` / `shutdown()` lifecycle
 * with intermediate states (`goingUp`, `goingDown`) that emit events as the
 * producer moves between them. This file pins the producer's side of that
 * contract:
 *
 *   - Predicate methods (`isRunning`, `isUp`, `isDown`, `isGoingUp`,
 *     `isGoingDown`, `isOperational`) report the state the producer is
 *     actually in after each transition resolves.
 *
 *   - Events fire in the documented order: `goingUp` → `up` on start,
 *     `goingDown` → `down` on shutdown.
 *
 *   - Each event fires exactly once per transition — no duplicates, no
 *     missing emissions.
 *
 *   - `run()` after `shutdown()` is a supported transition that returns the
 *     producer to the fully-running state, including a full event cycle.
 *
 *   - `getId()` is stable across lifecycle transitions (a shutdown/re-run
 *     does not mint a new identity) and distinct across instances.
 */

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

describe('Producer — predicates', () => {
  it('reports the fully-running state after run() resolves', async () => {
    const producer = await startProducer();

    expect(producer.isRunning()).toBe(true);
    expect(producer.isUp()).toBe(true);
    expect(producer.isDown()).toBe(false);
    expect(producer.isGoingUp()).toBe(false);
    expect(producer.isGoingDown()).toBe(false);
    expect(producer.isOperational()).toBe(true);
  });

  it('reports the fully-down state after shutdown() resolves', async () => {
    const producer = await startProducer();
    await producer.shutdown();

    expect(producer.isRunning()).toBe(false);
    expect(producer.isUp()).toBe(false);
    expect(producer.isDown()).toBe(true);
    expect(producer.isGoingUp()).toBe(false);
    expect(producer.isGoingDown()).toBe(false);
    expect(producer.isOperational()).toBe(false);
  });

  it('returns to the fully-running state after a re-run', async () => {
    const producer = await startProducer();
    await producer.shutdown();
    await producer.run();

    expect(producer.isRunning()).toBe(true);
    expect(producer.isUp()).toBe(true);
    expect(producer.isDown()).toBe(false);
    expect(producer.isOperational()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

describe('Producer — events', () => {
  /**
   * Attach listeners for the four lifecycle events and return the array
   * they push to. The array records event names in the order they fire;
   * its contents are the assertion target for the ordering tests.
   */
  function trackEvents(
    producer: ReturnType<typeof createBareProducer>,
  ): string[] {
    const events: string[] = [];
    producer.on('producer.goingUp', () => events.push('goingUp'));
    producer.on('producer.up', () => events.push('up'));
    producer.on('producer.goingDown', () => events.push('goingDown'));
    producer.on('producer.down', () => events.push('down'));
    return events;
  }

  it('emits goingUp then up on first run', async () => {
    const producer = createBareProducer();
    const events = trackEvents(producer);

    await producer.run();

    expect(events).toEqual(['goingUp', 'up']);
  });

  it('emits goingDown then down on shutdown', async () => {
    const producer = await startProducer();
    const events = trackEvents(producer);

    await producer.shutdown();

    expect(events).toEqual(['goingDown', 'down']);
  });

  it('emits exactly one full lifecycle per run/shutdown cycle', async () => {
    const producer = createBareProducer();
    const events = trackEvents(producer);

    await producer.run();
    await producer.shutdown();
    await producer.run();
    await producer.shutdown();

    expect(events).toEqual([
      'goingUp',
      'up',
      'goingDown',
      'down',
      'goingUp',
      'up',
      'goingDown',
      'down',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

describe('Producer — identity', () => {
  it('returns a stable non-empty id across the lifecycle', async () => {
    const producer = await startProducer();
    const idBefore = producer.getId();

    expect(typeof idBefore).toBe('string');
    expect(idBefore.length).toBeGreaterThan(0);

    // Shut down and re-run. The id must survive; a producer that minted a
    // new identity on each run would break the consumer-side bookkeeping
    // that correlates events (which carry the producerId) with a specific
    // instance. It would also break the crash-recovery path if a producer
    // ever appeared on that path — currently it doesn't, but the id is
    // still the contract that identifies an instance across time.
    await producer.shutdown();
    await producer.run();

    expect(producer.getId()).toBe(idBefore);
  });

  it('assigns a distinct id to each producer', async () => {
    const a = await startProducer();
    const b = await startProducer();

    expect(a.getId()).not.toBe(b.getId());
  });
});
