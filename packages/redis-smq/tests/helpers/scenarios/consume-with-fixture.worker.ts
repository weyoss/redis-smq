/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Child-process worker that produces a message to a queue, consumes
 * it with a file-based handler loaded from `helpers/fixtures/handlers/`,
 * and signals the parent once the handler has fired.
 *
 * The handler is not inlined — the parent sends a `handlerFilename`
 * alongside the Redis config and queue, and the worker registers that
 * path with `consumer.consume(queue, handlerFilename)`. RedisSMQ's
 * file-based handler loader resolves the module in a worker context
 * and invokes its default export.
 *
 * This makes the worker reusable for every scenario that needs "a
 * consumer running a known fixture in a separate process":
 *
 *   - `ack.js`     → a successful delivery; the ack event fires.
 *   - `unack.js`   → a failed delivery; the unack and DL events fire.
 *   - `throw.js`   → a synchronous throw from the handler.
 *   - `async-throw.js` → an async handler that rejects.
 *
 * A test that needs one of those observations forks this worker with
 * the matching fixture and subscribes to the relevant bus event.
 *
 * WHY THE HANDLER PATH IS RESOLVED BY THE PARENT:
 *
 *   The worker runs in a forked process with a different working
 *   directory context than the parent. Resolving the fixture's path
 *   in the parent (via `env.getCurrentDir()` relative to the parent's
 *   location) and sending the absolute path in the payload removes
 *   any ambiguity about which directory the child would resolve a
 *   relative path against.
 *
 * NOT A TEST FILE:
 *
 *   Excluded from the test glob by its `.worker.ts` suffix, matching
 *   `crash-consumer.worker.ts`.
 */

import type { IRedisConfig } from 'redis-smq-common';
import { type IQueueParams, RedisSMQ } from '../../../src/index.js';

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

interface IPayload {
  redisConfig: IRedisConfig;
  queue: IQueueParams;
  /** Absolute path to a `.js` handler fixture. */
  handlerFilename: string;
}

function isPayload(value: unknown): value is IPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.redisConfig === 'object' &&
    v.redisConfig !== null &&
    typeof v.queue === 'object' &&
    v.queue !== null &&
    typeof v.handlerFilename === 'string' &&
    v.handlerFilename.length > 0
  );
}

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

if (!process.send) {
  console.error(
    '[consume-with-fixture.worker] not running as a forked child ' +
      '(no IPC channel); exiting',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Handshake
// ---------------------------------------------------------------------------

let handled = false;

process.on('message', (raw: unknown) => {
  if (handled) return;
  handled = true;

  void handlePayload(raw).catch((err: unknown) => {
    console.error(
      '[consume-with-fixture.worker] failed:',
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    process.exit(1);
  });
});

setTimeout(() => {
  console.error(
    '[consume-with-fixture.worker] safety timeout exceeded, exiting',
  );
  process.exit(1);
}, 60_000).unref();

// ---------------------------------------------------------------------------
// Payload handler
// ---------------------------------------------------------------------------

async function handlePayload(raw: unknown): Promise<void> {
  if (!isPayload(raw)) {
    throw new Error(`invalid payload: ${JSON.stringify(raw)}`);
  }

  const { redisConfig, queue, handlerFilename } = raw;

  await RedisSMQ.initialize(redisConfig);

  // Start the bus so the child's event emissions publish to Redis.
  //
  // The parent test always calls `getEventBus()` before forking, so
  // the parent side is subscribed. This line brings the child side up
  // to the same state; without it, events fired in the child would
  // not propagate.
  const bus = RedisSMQ.getEventBus();
  await bus.run();

  // Install a local no-op listener for the ack event. The
  // framework's `RedisEmitter` may only publish to Redis when the
  // emitting process has a listener for the event; a local listener
  // guarantees the publication path is exercised.
  //
  // The listener is diagnostic only — it does not affect any
  // assertion. If a future framework change makes local listeners
  // unnecessary for publication, this can be removed.
  bus.on('consumer.messageAcknowledged', () => {
    /* no-op: presence of the listener is what matters */
  });

  const producer = RedisSMQ.createProducer();
  await producer.run();
  await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('consume-with-fixture'),
  );

  const consumer = RedisSMQ.createConsumer();
  await consumer.consume(queue, handlerFilename);
  await consumer.run();

  process.send?.('consuming');

  // Linger so the parent's bus subscription has time to receive the
  // event. The parent kills this process as soon as its `waitFor`
  // resolves; the linger is a safety net for slow runs, not a
  // timing gate.
  //
  // 30 seconds is calibrated empirically. A cold-forked child pays
  // a substantial startup cost — RedisSMQ initialization, event bus
  // startup, and the consumer's WorkerCluster loading its background
  // workers — before the first poll lands. On the reference machine
  // this has been observed at ~9s end-to-end from fork to ack
  // observed at the parent. The linger must comfortably exceed that.
  //
  // The parent kills this process on success, so a large linger costs
  // nothing on the happy path — it only affects how long a failing
  // run takes to time out.
  setTimeout(() => process.exit(0), 30_000);
}
