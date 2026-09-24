/**
 * Child-process worker for `crash-consumer.ts`.
 *
 * Not a test file. Forked by the parent helper; excluded from the test glob.
 *
 * Lifecycle:
 *   1. Install the message handler, then signal `'ready'` to the parent.
 *   2. Receive the payload: `{ redisConfig, queue, consumerOptions,
 *      consumeOptions }`.
 *   3. Apply options, initialize RedisSMQ, produce one message to `queue`.
 *   4. Register a handler that never acks, then `run()` the consumer.
 *   5. From inside the handler, signal `'consuming'`. At this point the
 *      message is in flight — the parent may SIGKILL at any moment.
 *   6. Hang. The consumer's open connections and heartbeat keep the event
 *      loop alive. The parent's SIGKILL terminates the process.
 *
 * If any step before `'consuming'` fails, print to stderr and exit
 * non-zero. The parent treats a non-signal early exit as an error and
 * surfaces the stderr in the rejection message it throws.
 *
 * WHY THE OPTIONS ARE IN THE PAYLOAD:
 *   `RedisSMQ.setDefaultConsumerOptions` and
 *   `setDefaultMessageConsumeOptions` are process-local — they configure
 *   this process's framework instance, not shared Redis state. The child is
 *   a separate process and does not inherit the parent's settings. If the
 *   child produced a message using the library's built-in defaults, the
 *   message could differ from what the test expects: a different
 *   `retryThreshold` would change whether the crash produces a requeue or
 *   a dead-letter, and a non-zero `ttl` would let the message expire before
 *   the parent's recovery logic observes it. The parent reads its own
 *   defaults and sends them in the payload; the child applies them before
 *   producing.
 *
 * WHY THE CHILD DOES NOT SHUT THE CONSUMER DOWN:
 *   The scenario is a crash, not a graceful shutdown. A graceful shutdown
 *   releases the in-flight message back to pending through the normal
 *   path — a different code path than the one this fixture exists to test
 *   (heartbeat expiry → reap → requeue). The parent's SIGKILL is the only
 *   thing that ends us.
 */

import type { ICallback, IRedisConfig } from 'redis-smq-common';
import {
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

/**
 * Consumer options are derived from RedisSMQ's own setter rather than
 * redeclared — if `setDefaultConsumerOptions` gains a field, this type
 * follows. Same for consume options.
 */
type TConsumerOptions = Parameters<
  typeof RedisSMQ.setDefaultConsumerOptions
>[0];
type TConsumeOptions = Parameters<
  typeof RedisSMQ.setDefaultMessageConsumeOptions
>[0];

interface IPayload {
  redisConfig: IRedisConfig;
  queue: IQueueParams;
  consumerOptions: TConsumerOptions;
  consumeOptions: TConsumeOptions;
}

function isPayload(value: unknown): value is IPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.redisConfig === 'object' &&
    v.redisConfig !== null &&
    typeof v.queue === 'object' &&
    v.queue !== null &&
    typeof v.consumerOptions === 'object' &&
    v.consumerOptions !== null &&
    typeof v.consumeOptions === 'object' &&
    v.consumeOptions !== null
  );
}

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

if (!process.send) {
  // The parent forks us; a missing IPC channel means we were invoked
  // directly, which is a misuse and would otherwise hang silently.

  console.error(
    '[crash-consumer.worker] not running as a forked child (no IPC channel); exiting',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Handshake
// ---------------------------------------------------------------------------

let handled = false;

process.on('message', (raw: unknown) => {
  // The parent sends exactly one payload. Ignore duplicates rather than
  // racing a second initialize / produce.
  if (handled) return;
  handled = true;

  void handlePayload(raw).catch((err: unknown) => {
    console.error(
      '[crash-consumer.worker] failed:',
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    process.exit(1);
  });
});

// Install the handler *before* signalling readiness. If we sent `'ready'`
// first, the parent could reply with the payload before the handler was
// installed and the message would be dropped.
process.send('ready');

// Safety net: if the parent dies before sending SIGKILL, do not linger
// indefinitely. `unref` so this timer does not keep the event loop alive
// on its own — the consumer's connections are what keep the process alive
// during normal operation, not this timer.
setTimeout(() => {
  console.error('[crash-consumer.worker] safety timeout exceeded, exiting');
  process.exit(1);
}, 60_000).unref();

// ---------------------------------------------------------------------------
// Payload handler
// ---------------------------------------------------------------------------

async function handlePayload(raw: unknown): Promise<void> {
  if (!isPayload(raw)) {
    throw new Error(`invalid payload: ${JSON.stringify(raw)}`);
  }

  const { redisConfig, queue, consumerOptions, consumeOptions } = raw;

  // Apply the parent's defaults before initialize so any framework code
  // that reads them during startup sees the test-suite values.
  RedisSMQ.setDefaultConsumerOptions(consumerOptions);
  RedisSMQ.setDefaultMessageConsumeOptions(consumeOptions);

  await RedisSMQ.initialize(redisConfig);

  // Produce first. Once `produce` resolves, the message is durably in the
  // queue; the subsequent crash cannot lose it, and RedisSMQ's
  // recovery path is what restores it after we die.
  const producer = RedisSMQ.createProducer();
  await producer.run();
  await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('crash-consumer-message'),
  );

  // Register a handler that never acks. Its only job is to tell the parent
  // that the message is in flight so the parent can SIGKILL us.
  const consumer = RedisSMQ.createConsumer();
  await consumer.consume(
    queue,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_msg: IMessageTransferable, _cb: ICallback) => {
      // Intentionally no `cb()`. The message stays in `processing` state
      // until RedisSMQ detects our death via heartbeat expiry and
      // reclaims it. A signal is sent to the parent, which will SIGKILL.
      process.send?.('consuming');
    },
  );

  await consumer.run();
}
