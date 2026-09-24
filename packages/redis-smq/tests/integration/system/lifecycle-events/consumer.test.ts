/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EQueueType,
  type IMessageTransferable,
} from '../../../../src/index.js';
import { createBareConsumer } from '../../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';

/**
 * Smoke test for the consumer's `Runnable` lifecycle.
 *
 * A single consumer runs once and shuts down once. The test asserts
 * the four lifecycle events fire on the instance channel and the
 * predicate methods report the expected state at each checkpoint.
 */

describe('Consumer lifecycle — smoke test', () => {
  it('reports the expected predicates and fires the four lifecycle events across a single run/shutdown cycle', async () => {
    const queue = uniqueQueue('lifecycle-consumer-smoke');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Construct without running so the listeners can be installed
    // before the first event fires. `createBareConsumer` registers
    // the instance for per-test teardown, so a failure mid-test does
    // not leave the consumer running into the next test.
    const consumer = createBareConsumer();

    // Register a no-op ack handler. The handler never fires in this
    // test — no messages are produced — but registering it makes the
    // consumer's `run()` go through the full handler validation and
    // `MessageHandlerRunner` initialization, which is the realistic
    // startup path.
    await consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
      cb(),
    );

    // Capture events in the order they fire. The exact sequence is
    // the load-bearing assertion — a regression that reordered or
    // dropped an event would fail with the observed sequence named.
    const events: string[] = [];
    consumer.on('consumer.goingUp', () => events.push('goingUp'));
    consumer.on('consumer.up', () => events.push('up'));
    consumer.on('consumer.goingDown', () => events.push('goingDown'));
    consumer.on('consumer.down', () => events.push('down'));

    try {
      // --- Checkpoint 1: down, before run ---
      //
      // A freshly constructed consumer is in the down state — it has
      // not been run, so `isRunning()` is false and `isDown()` is
      // true. Confirming this baseline makes the post-run assertions
      // meaningful: without it, a regression that left the consumer
      // perpetually "running" would fail the post-shutdown check for
      // a reason that looked like the shutdown path was broken.
      //
      // Note that registration (`consumer.consume(...)` above) does
      // not change the running state — a consumer with a handler
      // config but no `run()` is still down. The handler config is
      // data; only `run()` starts the lifecycle.
      expect(consumer.isRunning()).toBe(false);
      expect(consumer.isDown()).toBe(true);
      expect(consumer.isGoingUp()).toBe(false);
      expect(consumer.isGoingDown()).toBe(false);
      expect(consumer.isOperational()).toBe(false);

      // --- Run ---
      //
      // `run()` resolves once the consumer's startup sequence
      // completes — including the `MessageHandlerRunner`'s
      // initialization of the handler for the registered queue. The
      // resolution is the signal that the consumer is fully
      // operational; a caller can begin producing to the queue at
      // this point.
      await consumer.run();

      // --- Checkpoint 2: up, after run ---
      //
      // The transition is complete once `run()` resolves. All four
      // predicate pairs reflect the fully-up state, and the
      // transition-in-progress flags have cleared.
      expect(consumer.isRunning()).toBe(true);
      expect(consumer.isUp()).toBe(true);
      expect(consumer.isDown()).toBe(false);
      expect(consumer.isGoingUp()).toBe(false);
      expect(consumer.isGoingDown()).toBe(false);
      expect(consumer.isOperational()).toBe(true);

      // --- Shutdown ---
      //
      // `shutdown()` drains the consumer's in-flight work (there is
      // none, since no messages were produced), shuts down the
      // handler instances, and releases the Redis connection.
      await consumer.shutdown();

      // --- Checkpoint 3: down, after shutdown ---
      expect(consumer.isRunning()).toBe(false);
      expect(consumer.isUp()).toBe(false);
      expect(consumer.isDown()).toBe(true);
      expect(consumer.isGoingUp()).toBe(false);
      expect(consumer.isGoingDown()).toBe(false);
      expect(consumer.isOperational()).toBe(false);

      // --- Events ---
      //
      // The exact sequence. This is where the file adds value over
      // the predicate assertions: a regression that suppressed an
      // event, duplicated one, or reversed the goingUp/up order would
      // pass the predicate checks (which only look at the settled
      // state) and fail here with the observed sequence named.
      expect(events).toEqual(['goingUp', 'up', 'goingDown', 'down']);
    } finally {
      // Defensive idempotent shutdown.
      await consumer.shutdown();
    }
  });
});
