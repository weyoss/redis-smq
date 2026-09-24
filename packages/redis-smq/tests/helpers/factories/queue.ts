/**
 * Queue factory for tests.
 *
 * Three concerns, kept separate:
 *
 *   1. `getDefaultQueue()` — the *canonical* queue for tests that only need
 *      "some queue" and don't care about the name. Uses a fixed name so
 *      assertions can hardcode it when useful. Prefer `uniqueQueue()` when
 *      the test does its own setup/teardown and the name is an implementation
 *      detail — generated names make cross-test interference impossible.
 *
 *   2. `uniqueQueue()` — generate a fresh queue name with a random suffix.
 *      Each test that calls this gets its own queue, no cleanup required.
 *
 *   3. `createQueue(...)` — explicitly create a queue with a given type and
 *      delivery model. Typed — no boolean overloads.
 *
 * `TEST_NAMESPACE` is re-exported so tests don't have to reach into
 * `test-config.ts` for it, and so there's one place to change the namespace
 * if the suite ever runs against a shared Redis.
 */

import { randomUUID } from 'node:crypto';
import {
  EQueueDeliveryModel,
  EQueueType,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { TEST_NAMESPACE } from '../config/test-config.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical name of the default queue. Kept stable so tests that hardcode
 * `testing/test_queue` in assertions (there are a few) still work. New tests
 * that don't need a fixed name should prefer `uniqueQueue()`.
 */
const DEFAULT_QUEUE_NAME = 'test_queue';

/** Re-exported for convenience — import from here, not from test-config. */
export { TEST_NAMESPACE };

// ---------------------------------------------------------------------------
// Public API — naming
// ---------------------------------------------------------------------------

/**
 * The default queue used across tests.
 *
 * Returns a fresh object each call so a caller mutating the result cannot
 * affect the next caller.
 */
export function getDefaultQueue(): IQueueParams {
  return { ns: TEST_NAMESPACE, name: DEFAULT_QUEUE_NAME };
}

/**
 * Generate a queue with a random, collision-free name.
 *
 * Use this for any test where the queue is an implementation detail:
 *
 *   const queue = uniqueQueue();
 *   await createQueue(queue, EQueueType.FIFO_QUEUE);
 *   // ... test body ...
 *   // no cleanup needed — the queue is unique to this test
 *
 * The optional `prefix` is for readability in failure output and logs.
 */
export function uniqueQueue(prefix = 'q'): IQueueParams {
  return { ns: TEST_NAMESPACE, name: `${prefix}-${randomUUID()}` };
}

// ---------------------------------------------------------------------------
// Public API — creation
// ---------------------------------------------------------------------------

/**
 * Create a queue with the given type and delivery model.
 *
 * The default delivery model is POINT_TO_POINT, which matches the majority
 * of tests. Pass PUB_SUB for fan-out to consumer groups (see the pub-sub
 * tests).
 *
 * Idempotent against the underlying `QueueManager.save()` — saving a queue
 * that already exists with the same type/delivery is a no-op.
 */
export async function createQueue(
  queue: string | IQueueParams,
  type: EQueueType = EQueueType.FIFO_QUEUE,
  deliveryModel: EQueueDeliveryModel = EQueueDeliveryModel.POINT_TO_POINT,
): Promise<IQueueParams> {
  const normalized = normalize(queue);
  await RedisSMQ.createQueueManager().save(normalized, type, deliveryModel);
  return normalized;
}

/**
 * Create a queue if it does not already exist. Convenience for setups that
 * may run more than once (e.g. `beforeEach` on a shared queue name).
 *
 * Unlike `createQueue`, this tolerates the queue already existing with a
 * *different* type/delivery model — it does not verify the existing shape.
 * Use `createQueue` directly if the type matters for correctness.
 */
export async function ensureQueue(
  queue: string | IQueueParams,
  type: EQueueType = EQueueType.FIFO_QUEUE,
  deliveryModel: EQueueDeliveryModel = EQueueDeliveryModel.POINT_TO_POINT,
): Promise<IQueueParams> {
  const normalized = normalize(queue);
  const manager = RedisSMQ.createQueueManager();
  const exists = await manager.exists(normalized);
  if (!exists) {
    await manager.save(normalized, type, deliveryModel);
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Accept either a bare queue name (string) or a full `IQueueParams`. A
 * bare string gets the test namespace.
 */
function normalize(queue: string | IQueueParams): IQueueParams {
  return typeof queue === 'string'
    ? { ns: TEST_NAMESPACE, name: queue }
    : queue;
}
