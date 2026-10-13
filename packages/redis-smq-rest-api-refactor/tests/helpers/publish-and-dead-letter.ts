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
import type { IQueueParams } from 'redis-smq';

const { delay } = bluebird;

/**
 * Publishes a message to `queue` and drives it to DEAD_LETTERED.
 *
 * Starts a throwaway producer and consumer via the library. The
 * consumer's callback always errors; with `retryThreshold: 0`, the
 * first failure dead-letters the message. The helper waits for the
 * `consumer.messageDeadLettered` event, then shuts both handles down.
 *
 * The event-based wait (rather than a status-endpoint poll) mirrors
 * the original package's helper. It's faster — the event fires as
 * soon as the library has written the state, before the HTTP status
 * route has had a chance to observe it — and it doesn't require the
 * test's HTTP surface to be the source of truth for setup that
 * happens outside the API.
 *
 * Caller is responsible for ensuring `queue` exists before calling.
 */
export async function publishAndDeadLetter(
  queue: IQueueParams | string,
): Promise<string[]> {
  const producer = await RedisSMQ.startProducer();
  const consumer = await RedisSMQ.startConsumer();

  try {
    const message = RedisSMQ.newProducibleMessage();
    message.setBody({ hello: 'world' }).setQueue(queue).setRetryThreshold(0);
    const ids = await producer.produce(message);

    const deadLettered: string[] = [];
    const eventBus = RedisSMQ.getEventBus();
    await eventBus.run();
    eventBus.on('consumer.messageDeadLettered', (messageId: string) => {
      deadLettered.push(messageId);
    });

    await consumer.consume(queue, (_msg, cb) => cb(new Error('forced')));

    while (
      JSON.stringify([...ids].sort()) !==
      JSON.stringify([...deadLettered].sort())
    ) {
      await delay(100);
    }

    return ids;
  } finally {
    await consumer.shutdown();
    await producer.shutdown();
  }
}
