/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { expectMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import bluebird from 'bluebird';

/**
 * Integration test for the basic consume path.
 *
 * Producing a message and consuming it takes the message through the full
 * round trip: an in-memory `ProducibleMessage` is serialized into Redis,
 * delivered to a consumer's handler, acknowledged by the handler, and
 * moved out of the pending list. Every other test in this folder builds
 * on that path.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consuming a message', () => {
  it('delivers a produced message to the consumer handler and acknowledges it', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();

    // The handler wraps a spy so the test can assert both that it ran and
    // what it received. `vi.fn()` is a plain call recorder here — the
    // production code sees a normal handler function.
    const handled = vi.fn();
    const consumer = await getConsumer({
      queue,
      messageHandler: (msg: IMessageTransferable, cb) => {
        handled(msg);
        cb();
      },
    });

    const body = { hello: 'world' };

    // Produce first, then subscribe, then run. See the file header for
    // why this order matters.
    const [messageId] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body),
    );

    const acked = untilMessageAcknowledged(consumer, messageId);

    await consumer.run();
    await acked;

    // The handler must have been invoked exactly once. `toHaveBeenCalledTimes(1)`
    // is a stronger assertion than "the handler was called" — it catches
    // duplicate delivery, which would not be observable from the ack event
    // alone.
    expect(handled).toHaveBeenCalledTimes(1);

    const received = handled.mock.calls[0][0] as IMessageTransferable;
    expect(received.id).toBe(messageId);
    expect(received.body).toEqual(body);
    expect(received.destinationQueue).toEqual(queue);

    // Post-consume state, asserted through the message manager rather than
    // through the handler's captured message — RedisSMQ's own view of
    // the message is the authoritative one.
    await expectMessageStatus(messageId, EMessagePropertyStatus.ACKNOWLEDGED);

    // The message has left the pending list and entered the acknowledged
    // list. Both assertions are made because a bug in the ack pipeline
    // could move the message out of pending without actually acknowledging
    // it (dropping it), or acknowledge it without removing it from pending
    // (double-delivery risk).
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(1);
  });

  it('does not redeliver an acknowledged message', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();

    const handled = vi.fn();
    const consumer = await getConsumer({
      queue,
      messageHandler: (msg: IMessageTransferable, cb) => {
        handled(msg);
        cb();
      },
    });

    const [messageId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody({ hello: 'world' }),
    );

    const acked = untilMessageAcknowledged(consumer, messageId);

    await consumer.run();
    await acked;

    expect(handled).toHaveBeenCalledTimes(1);

    // The ack pipeline may batch and flush asynchronously (see the default
    // consumer options in `test-defaults.ts`). A bug that left the message
    // eligible for a second delivery — a stale pending entry, a
    // half-processed state — would fire the handler again during the
    // window after the ack event. Waiting a fixed short interval makes
    // the failure loud rather than a silent, occasionally-reproducing
    // flake on a later test.
    await bluebird.delay(1000);

    expect(handled).toHaveBeenCalledTimes(1);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);
  });
});
