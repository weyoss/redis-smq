/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import type { IQueueParams } from 'redis-smq';

export const { delay } = bluebird;

export const EVENT_TIMEOUT_MS = 15_000;

/**
 * `RedisSMQ.initialize` is a process-level singleton — calling it twice
 * throws. Cache the promise so multiple helpers/tests in the same worker
 * share one initialization.
 *
 * Lazy (inside the helper, not at module load) so importing this module
 * doesn't require `REDIS_PORT` to be set. The env var is populated by
 * `global-setup.ts` before workers fork; the module-level read would
 * also work but lazy import keeps side effects out of the import.
 */
let initPromise: Promise<void> | null = null;

export function ensureInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  const port = Number(process.env.REDIS_PORT);
  if (!port) {
    return Promise.reject(
      new Error(
        'REDIS_PORT missing from process.env. ' +
          'global-setup.ts should have loaded .env.local before this worker ' +
          'imported the helper.',
      ),
    );
  }

  // The library default is 127.0.0.1:6379; the dev stack starts Redis
  // on a random port written to .env.local. Without this, we'd connect
  // to the wrong Redis and see an empty queue.
  initPromise = RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port },
  });
  return initPromise;
}

/**
 * Pull a message ID out of whatever a `consumer.*` event emits.
 * Different redis-smq versions pass either:
 *   - the message object (has `.id` or `.getId()`)
 *   - the ID string
 *
 * Returns `null` for anything we can't confidently extract, so a
 * timeout diagnostic shows `(none)` rather than `[object Object]`.
 */
export function extractMessageId(payload: unknown): string | null {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const p = payload as { id?: unknown; getId?: () => unknown };
    if (typeof p.id === 'string') return p.id;
    if (typeof p.getId === 'function') {
      const id = p.getId();
      if (typeof id === 'string') return id;
    }
  }
  return null;
}

type ConsumerCallback = (msg: unknown, cb: (err?: Error) => void) => void;

type ProducibleConfigurator = (
  msg: ReturnType<typeof RedisSMQ.newProducibleMessage>,
) => void;

/**
 * Publishes one message to `queue`, starts a throwaway consumer with the
 * given callback, and waits for `eventName` to fire with the produced
 * message's ID. Shuts down both handles and returns the produced ID(s).
 *
 * Both `publishAndDeadLetter` and `publishAndAcknowledge` are thin
 * wrappers around this — same producer/consumer lifecycle, same event
 * bus lifecycle, only the event name and the consumer callback differ.
 *
 * The event-based wait mirrors the original package's helpers and is
 * faster than polling a status endpoint: the event fires as soon as the
 * library has written the state, before the HTTP status route observes
 * it.
 *
 * The event bus is process-scoped — we call `.run()` defensively (some
 * redis-smq versions require it after `initialize`, some don't) but
 * never shut it down. Producer and consumer handles are per-invocation
 * and are shut down in `finally`.
 *
 * Caller is responsible for ensuring `queue` exists before calling.
 */
export async function publishAndWaitForEvent(
  queue: IQueueParams | string,
  eventName: 'consumer.messageDeadLettered' | 'consumer.messageAcknowledged',
  consume: ConsumerCallback,
  configure?: ProducibleConfigurator,
): Promise<string[]> {
  await ensureInitialized();

  const producer = await RedisSMQ.startProducer();
  const consumer = await RedisSMQ.startConsumer();

  try {
    const message = RedisSMQ.newProducibleMessage();
    message.setBody({ hello: 'world' }).setQueue(queue);
    configure?.(message);
    const ids = await producer.produce(message);

    const received: string[] = [];
    const eventBus = RedisSMQ.getEventBus();
    try {
      await eventBus.run();
    } catch {
      /* already running */
    }
    eventBus.on(eventName, (payload: unknown) => {
      const id = extractMessageId(payload);
      if (id) received.push(id);
    });

    await consumer.consume(queue, consume);

    const deadline = Date.now() + EVENT_TIMEOUT_MS;
    const wanted = [...ids].sort().join(',');
    while ([...received].sort().join(',') !== wanted) {
      if (Date.now() > deadline) {
        throw new Error(
          `Timed out waiting for ${eventName} ` +
            `(expected ${wanted}, got ${received.join(',') || '(none)'}).`,
        );
      }
      await delay(100);
    }

    return ids;
  } finally {
    await consumer.shutdown();
    await producer.shutdown();
  }
}
