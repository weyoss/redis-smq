/**
 * Event bus accessor for tests.
 *
 * The event bus is a per-process singleton exposed by
 * `RedisSMQ.getEventBus()`. It must be `run()` before any listener will
 * fire. This helper wraps that sequence and is the canonical way for tests
 * to obtain the bus.
 *
 * The bus is a distributed event bus: an event published by any process
 * connected to the same Redis is delivered to every subscriber. Tests must
 * therefore not assume events originate from a single producer or
 * consumer — subscribe with a predicate that filters by ID.
 *
 * Listener lifecycle:
 *   Listeners registered during a test do not survive into the next test —
 *   `RedisSMQ.shutdown()` in `tests/setup/per-test.ts` tears the bus down
 *   and clears them. This helper does not dedupe or track listeners; use
 *   `once` or `removeListener`, or use `events/await-event.ts` which
 *   handles that pattern for the common cases.
 *
 * Why no caching:
 *   A cached bus reference would outlive `RedisSMQ.shutdown()` in the
 *   per-test teardown and hand the next test a dead bus. `run()` on an
 *   already-running bus is a no-op (RedisSMQ follows this convention
 *   for every `Runnable`), so calling it every time is correct and cheap.
 */

import { RedisSMQ, type IEventBus } from '../../../src/index.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the shared event bus, running it if necessary.
 *
 * Safe to call multiple times per test. If a future framework change makes
 * `run()` non-idempotent, this is the single place to add a guard — but do
 * NOT add local caching (see file header).
 */
export async function getEventBus(): Promise<IEventBus> {
  const bus = RedisSMQ.getEventBus();
  await bus.run();
  return bus;
}
