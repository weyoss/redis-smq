/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it, vitest } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../../src/index.js';
import { waitFor } from '../../../helpers/assertions/wait-for.js';
import { createBareConsumer } from '../../../helpers/factories/consumer.js';
import { createBareProducer } from '../../../helpers/factories/producer.js';
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';

/**
 * Integration test for the `Runnable` lifecycle under sustained load.
 *
 * The scenario: a producer produces continuously while a consumer
 * cycles through six run/shutdown pairs. The lifecycle events must
 * fire the correct number of times on each instance despite the
 * load — one full cycle for the producer, six for the consumer, with
 * no dropped or duplicated events.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Number of `run()`/`shutdown()` pairs the consumer cycles through.
 *
 * The specific value is arbitrary; six matches the original test's
 * cycle count and is enough to distinguish "the machinery works" from
 * "the machinery works on the first cycle only".
 */
const CONSUMER_CYCLES = 6;

/**
 * Milliseconds between consecutive produces in the load loop.
 *
 * 20ms is roughly 50 messages/second — high enough to constitute a
 * sustained load, low enough to avoid pegging the CPU or flooding
 * Redis. The test's subject is the lifecycle machinery, not the
 * throughput ceiling, so the pacing is chosen for stability rather
 * than for maximum pressure.
 */
const PRODUCE_PACE_MS = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A short promise-based sleep.
 *
 * The suite's helper layer does not expose a `sleep` — the async
 * assertions use `waitFor` on a predicate instead. This file's load
 * loop needs an unconditional pace, not a predicate to poll, so a
 * local helper is the right shape. It is small enough to inline here
 * rather than extract.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('Runnable lifecycle — sustained load', () => {
  it('keeps the lifecycle event counts correct while a producer runs continuously and a consumer cycles', async () => {
    const queue = uniqueQueue('lifecycle-sustained');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // -------------------------------------------------------------------
    // Producer: construct bare so listeners are installed before run
    // -------------------------------------------------------------------
    //
    // `createBareProducer` registers the instance for per-test
    // teardown, so a failure mid-test does not leak a running
    // producer into the next test.
    const producer = createBareProducer();
    const producerGoingUp = vitest.fn();
    const producerUp = vitest.fn();
    const producerGoingDown = vitest.fn();
    const producerDown = vitest.fn();
    producer.on('producer.goingUp', producerGoingUp);
    producer.on('producer.up', producerUp);
    producer.on('producer.goingDown', producerGoingDown);
    producer.on('producer.down', producerDown);

    await producer.run();

    // -------------------------------------------------------------------
    // The load loop
    // -------------------------------------------------------------------
    //
    // The loop runs continuously until `stopped` is set. Each iteration
    // produces one message and then sleeps for `PRODUCE_PACE_MS`, so
    // the load is sustained but paced.
    //
    // The `try/catch` around the produce call distinguishes two cases:
    //
    //   - The loop was cancelled by the test's stop flag → exit
    //     cleanly. The rejection from `producer.produce` during
    //     shutdown is expected; the loop does not treat it as a
    //     failure.
    //
    //   - Any other error → re-throw. The loop's promise rejects,
    //     and the test's `finally` block below surfaces the actual
    //     error rather than masking it.
    let stopped = false;
    const produceLoop = (async () => {
      while (!stopped) {
        try {
          await producer.produce(
            RedisSMQ.newProducibleMessage().setBody('load').setQueue(queue),
          );
        } catch (err) {
          if (stopped) return;
          throw err;
        }
        await sleep(PRODUCE_PACE_MS);
      }
    })();

    // -------------------------------------------------------------------
    // Consumer: construct bare, register handler, install listeners
    // -------------------------------------------------------------------
    //
    // Registration happens before the listeners are installed, so the
    // handler config exists when `run()` is called in the first cycle
    // — the realistic order of operations for a caller.
    const consumer = createBareConsumer();
    const consumerGoingUp = vitest.fn();
    const consumerUp = vitest.fn();
    const consumerGoingDown = vitest.fn();
    const consumerDown = vitest.fn();
    consumer.on('consumer.goingUp', consumerGoingUp);
    consumer.on('consumer.up', consumerUp);
    consumer.on('consumer.goingDown', consumerGoingDown);
    consumer.on('consumer.down', consumerDown);

    await consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
      cb(),
    );

    // -------------------------------------------------------------------
    // The consumer's cycle loop
    // -------------------------------------------------------------------
    //
    // Each cycle: run, wait for at least one new ack, shut down. The
    // `baseline` is captured before `run()` so the wait is on a
    // *new* ack rather than on any ack the queue might already have
    // from a previous cycle.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

    try {
      for (let i = 0; i < CONSUMER_CYCLES; i += 1) {
        const baseline = await acknowledged.countMessages(queue);

        await consumer.run();

        // The wait resolves as soon as the consumer has acked at
        // least one new message — proving the consumer actually ran,
        // not merely started. A generous timeout covers a loaded CI
        // where the consumer's first poll might be delayed by the
        // producer's concurrent activity.
        await waitFor(
          async () => (await acknowledged.countMessages(queue)) > baseline,
          {
            timeoutMs: 15_000,
            description:
              `consumer cycle ${i + 1}/${CONSUMER_CYCLES} acked at least ` +
              `one message`,
          },
        );

        await consumer.shutdown();
      }

      // Idempotent shutdown: the consumer is already down (the last
      // cycle's shutdown ran). Calling `shutdown()` again is a no-op
      // and fires no additional lifecycle events. The event-count
      // assertions below confirm this.
      await consumer.shutdown();
    } finally {
      // Stop the load loop, then wait for it to exit before shutting
      // the producer down. The nested `try/finally` ensures the
      // producer is torn down even if the loop's promise rejects
      // with a real error (in which case that error still propagates
      // from the outer `await produceLoop`).
      stopped = true;
      try {
        await produceLoop;
      } finally {
        await producer.shutdown();
      }
    }

    // Idempotent shutdown: the producer is already down. Same
    // contract as the consumer's idempotent shutdown above — no
    // additional lifecycle events fire.
    await producer.shutdown();

    // -------------------------------------------------------------------
    // Assertions
    // -------------------------------------------------------------------
    //
    // Producer: exactly one of each event, despite the continuous
    // produce activity. The load does not affect the producer's
    // lifecycle counts.
    expect(producerGoingUp).toHaveBeenCalledTimes(1);
    expect(producerUp).toHaveBeenCalledTimes(1);
    expect(producerGoingDown).toHaveBeenCalledTimes(1);
    expect(producerDown).toHaveBeenCalledTimes(1);

    // Consumer: one of each event per cycle, and no extras. The
    // seven `shutdown()` calls in the loop above (six from the
    // cycles, one idempotent) produce six `goingDown` and six `down`
    // events — the idempotent shutdown is a genuine no-op.
    expect(consumerGoingUp).toHaveBeenCalledTimes(CONSUMER_CYCLES);
    expect(consumerUp).toHaveBeenCalledTimes(CONSUMER_CYCLES);
    expect(consumerGoingDown).toHaveBeenCalledTimes(CONSUMER_CYCLES);
    expect(consumerDown).toHaveBeenCalledTimes(CONSUMER_CYCLES);
  });
});
