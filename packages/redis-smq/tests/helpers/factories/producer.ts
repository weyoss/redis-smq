/**
 * Producer factory for tests.
 *
 * Two entry points:
 *
 *   - startProducer(...)   — create a producer, run it, and return it.
 *                            This is what almost every test wants.
 *   - createBareProducer() — create a producer without running it. For
 *                            tests that assert on the pre-run state or that
 *                            control when `run()` is called.
 *
 * Both track every producer they create in a module-level registry. The
 * `afterEach` in `tests/setup/per-test.ts` calls `shutdownAllProducers()`
 * to drain it, so a test that throws mid-assertion cannot leak a live
 * producer into the next test.
 *
 * Producers are not auto-shut-down at the end of their test body. The
 * registry drains on teardown, but tests that assert specific lifecycle
 * behavior (goingUp/up/goingDown/down events, isOperational, etc.) should
 * still call `producer.shutdown()` explicitly — the teardown is idempotent.
 */

import {
  type IProducer,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a producer and start it.
 *
 * Accepts no options today because `RedisSMQ.createProducer()` accepts none
 * in the current API. If that changes, add a parameter typed as
 * `Parameters<typeof RedisSMQ.createProducer>[0]` rather than re-declaring
 * an options interface here — the signature should track the source.
 */
export async function startProducer(): Promise<IProducer> {
  const producer = createBareProducer();
  await producer.run();
  return producer;
}

/**
 * Create a producer without starting it.
 *
 * Use when the test needs to control when `run()` is called, or when the
 * test is asserting on the pre-run state (e.g. `isOperational() === false`,
 * or that `produce()` rejects with `ProducerNotRunningError`). The producer
 * is still tracked in the registry and will be shut down by teardown —
 * shutdown on a producer that was never run is a no-op.
 */
export function createBareProducer(): IProducer {
  const producer = RedisSMQ.createProducer();
  track(producer);
  return producer;
}

// ---------------------------------------------------------------------------
// Convenience
// ---------------------------------------------------------------------------

/**
 * Produce a single message and return the message ID.
 *
 * Wraps the `newProducibleMessage().setQueue(...).setBody(...)` pattern that
 * appears in almost every test. Pass a producer if the test already has one,
 * or omit it to create-and-start a temporary one (which is still tracked and
 * will be cleaned up by teardown).
 */
export async function produceMessage(
  queue: string | IQueueParams,
  body: unknown,
  producer?: IProducer,
): Promise<string> {
  const p = producer ?? (await startProducer());
  const msg = RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body);
  const [id] = await p.produce(msg);
  return id;
}

/**
 * Produce a message and return both the producer and the message ID. For
 * tests that need the producer handle for subsequent assertions (event
 * listeners, shutdown behavior) but want a one-line setup.
 */
export async function produceMessageWithHandle(
  queue: string | IQueueParams,
  body: unknown,
): Promise<{ producer: IProducer; messageId: string }> {
  const producer = await startProducer();
  const msg = RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body);
  const [messageId] = await producer.produce(msg);
  return { producer, messageId };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const liveProducers = new Set<IProducer>();

function track(producer: IProducer): void {
  liveProducers.add(producer);
}

/**
 * Shut down every tracked producer. Idempotent — a producer already shut
 * down by its test yields an error which we swallow. Re-entrant — the set
 * is cleared before awaiting, so a `shutdown` that triggers more cleanup
 * cannot re-enter this function.
 */
export async function shutdownAllProducers(): Promise<void> {
  const producers = [...liveProducers];
  liveProducers.clear();
  await Promise.all(producers.map((p) => p.shutdown().catch(() => undefined)));
}

/**
 * Count of tracked producers that have not yet been drained. Intended for
 * debugging a hang or for the rare test that asserts cleanup happened. Do
 * not use as a normal assertion — the registry is internal state.
 */
export function liveProducerCount(): number {
  return liveProducers.size;
}
