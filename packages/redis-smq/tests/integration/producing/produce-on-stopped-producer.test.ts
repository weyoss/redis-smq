/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import {
  createBareProducer,
  startProducer,
} from '../../helpers/factories/producer.js';

/**
 * Integration test for `produce()` on a producer that is not running.
 *
 * Producing requires an active producer: a Redis connection from the pool,
 * a loaded `PubSubTargetResolver` cache, and an initialized state machine.
 * Calling `produce()` outside that state is a caller error and the
 * framework rejects it with `ProducerNotRunningError`.
 *
 * Two lifecycle states produce the same error class:
 *
 *   - The producer was created but `run()` was never called.
 *   - The producer was run and then shut down.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('produce() on a producer that is not running', () => {
  it('rejects with ProducerNotRunningError when run() was never called', async () => {
    const producer = createBareProducer();

    const queue = uniqueQueue();
    await createQueue(queue);

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody({ hello: 'world' });

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.ProducerNotRunningError,
    );
  });

  it('rejects with ProducerNotRunningError after the producer has been shut down', async () => {
    const producer = await startProducer();

    const queue = uniqueQueue();
    await createQueue(queue);

    // Transition to "down" — the state the original test's title referred
    // to but did not actually reach.
    await producer.shutdown();

    // Sanity check: the producer really is down, so the rejection below is
    // caused by state and not by an unrelated setup problem. Without this,
    // a bug in `shutdown()` that left the producer running would produce
    // the correct error class for the wrong reason, and the test would
    // pass anyway.
    expect(producer.isDown()).toBe(true);

    const msg = RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody({ hello: 'world' });

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.ProducerNotRunningError,
    );
  });

  it('produces the same error class regardless of which not-running path led here', async () => {
    const queue = uniqueQueue();
    await createQueue(queue);

    const neverRun = createBareProducer();
    const startedThenStopped = await startProducer();
    await startedThenStopped.shutdown();

    const msg = () =>
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('x');

    await expect(neverRun.produce(msg())).rejects.toThrow(
      errors.ProducerNotRunningError,
    );
    await expect(startedThenStopped.produce(msg())).rejects.toThrow(
      errors.ProducerNotRunningError,
    );
  });

  it('allows a producer that is re-run after shutdown to produce again', async () => {
    const producer = await startProducer();

    const queue = uniqueQueue();
    await createQueue(queue);

    await producer.shutdown();
    await producer.run();

    // Sanity check before the functional assertion — if `run()` after
    // `shutdown()` is broken at the lifecycle level, failing here produces
    // a clearer message than failing at `produce()`.
    expect(producer.isUp()).toBe(true);

    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody({ hello: 'world' }),
    );

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    // Confirm the message actually landed. A re-run that cleared the
    // producer's internal state but left the pool broken in a way that
    // still returned an ID would pass the previous assertion; the count
    // is the real proof.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(1);
  });
});
