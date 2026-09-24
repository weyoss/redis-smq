/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { EQueueType } from '../../../src/index.js';
import { _isConsumerAlive } from '../../../src/core/consumer/_/_is-consumer-alive.js';
import { withRedisClient } from '../../helpers/redis/client.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration test for the consumer heartbeat.
 *
 * The heartbeat is a Redis key the consumer sets on `run()` and refreshes
 * periodically. `_isConsumerAlive(redisClient, consumerId)` reads that key
 * and reports whether the consumer is still considered up. RedisSMQ
 * uses this signal in two ways:
 *
 *   - The consumer registry (`QueueManager.getConsumers`) reports only
 *     live consumers.
 *   - The reap worker uses an *expired* heartbeat to decide that a
 *     consumer has crashed and its in-flight messages need to be requeued.
 *
 * This file covers the *graceful* path: a consumer that shuts down
 * cleanly removes its heartbeat key, so `_isConsumerAlive` immediately
 * reports `false` after `shutdown()` resolves — the reaper never sees it,
 * and the shutdown is not confused with a crash.
 *
 * It does NOT cover the crash path. That path relies on the TTL expiring
 * because a crashed process cannot remove its own key, and it is
 * exercised end-to-end in `consumer-crash-recovery.test.ts`. The two
 * paths are separate behaviors with separate failure modes; keeping them
 * in separate files means a failure here points at shutdown bookkeeping,
 * and a failure there points at the reaper.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * `_isConsumerAlive` is callback-style:
 *   `(redisClient, consumerId, cb: (err, alive) => void)`.
 *
 * The promisified form is `(redisClient, consumerId) => Promise<boolean>`.
 * `bluebird.promisify` (rather than `node:util.promisify`) is used for
 * consistency with the rest of the codebase, where bluebird is already the
 * promisification tool of choice.
 */
const isConsumerAlive = bluebird.promisify(_isConsumerAlive);

/**
 * Convenience: acquire a pool client, check liveness, release.
 *
 * Encapsulates the `withRedisClient` + `isConsumerAlive` pairing that
 * appears in every test below. Named `alive` so the call sites read as
 * `await alive(consumer.getId())` rather than a two-line ceremony.
 */
async function alive(consumerId: string): Promise<boolean> {
  return withRedisClient((client) => isConsumerAlive(client, consumerId));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consumer heartbeat', () => {
  it('reports a running consumer as alive', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const consumer = await getConsumer({ queue });
    await consumer.run();

    expect(await alive(consumer.getId())).toBe(true);
  });

  it('reports a shut-down consumer as not alive', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const consumer = await getConsumer({ queue });
    await consumer.run();

    // Sanity check before the transition: without this, a consumer that
    // never had a heartbeat in the first place would produce the same
    // `false` after shutdown, and the test would pass for the wrong
    // reason.
    expect(await alive(consumer.getId())).toBe(true);

    await consumer.shutdown();

    // The shutdown path removes the heartbeat key synchronously (before
    // `shutdown()` resolves), so no waiting is needed. If a future change
    // made the removal asynchronous — a lazy cleanup, a background timer —
    // this assertion would fail, and the fix would be to wait for the
    // removal rather than to add a sleep.
    expect(await alive(consumer.getId())).toBe(false);
  });

  it('gives each consumer an independent heartbeat', async () => {
    // Two consumers on the same queue. Their heartbeats must be keyed
    // separately — otherwise shutting one down would silently mark the
    // other as dead, and the reaper would requeue messages that the still-
    // running consumer was actively processing.
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const a = await getConsumer({ queue });
    const b = await getConsumer({ queue });

    await a.run();
    await b.run();

    // Both alive.
    expect(await alive(a.getId())).toBe(true);
    expect(await alive(b.getId())).toBe(true);

    // Two distinct IDs, so the keys are necessarily distinct — but
    // asserting it makes the intent explicit and catches a hypothetical
    // future bug where `getId()` returned a constant.
    expect(a.getId()).not.toBe(b.getId());

    // Shutting one down must not affect the other. This is the assertion
    // that distinguishes "separate keys" from "same key, different
    // consumer ID" — a bug where the key was derived from something
    // shared (the queue name, the process ID) would pass the "two IDs,
    // two truths" checks above and fail here.
    await a.shutdown();

    expect(await alive(a.getId())).toBe(false);
    expect(await alive(b.getId())).toBe(true);
  });

  it('reports a consumer that was never run as not alive', async () => {
    // A consumer that has been constructed and has a handler registered
    // but has never been run has no heartbeat. This case matters because
    // the consumer registry (`QueueManager.getConsumers`) must not list
    // it, and the reap worker must not consider it a dead consumer with
    // in-flight messages.
    //
    // `createBareConsumer()` is used rather than `getConsumer()` to skip
    // the queue-registration step entirely — the contract under test is
    // about the run() boundary, not about whether a handler was attached.
    const consumer = createBareConsumer();

    expect(await alive(consumer.getId())).toBe(false);
  });
});
