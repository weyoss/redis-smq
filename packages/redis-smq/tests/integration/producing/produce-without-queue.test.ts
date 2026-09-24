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
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration test for `produce()` without a destination.
 *
 * A message must be addressed to either a queue or an exchange. Producing a
 * message that has neither is a caller error, and RedisSMQ rejects it
 * with `MessageExchangeRequiredError` — the name refers to the general
 * concept of a "destination" in RedisSMQ's routing model, where a
 * queue is a degenerate case of an exchange.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('produce() without a destination', () => {
  it('rejects with MessageExchangeRequiredError when the message has neither a queue nor an exchange', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage().setBody({ hello: 'world' });

    await expect(producer.produce(msg)).rejects.toThrow(
      errors.MessageExchangeRequiredError,
    );
  });

  it('leaves the producer running after a rejected produce', async () => {
    const producer = await startProducer();

    const msg = RedisSMQ.newProducibleMessage().setBody({ hello: 'world' });

    // Swallow the rejection — we only care about the side effect here.
    await producer.produce(msg).catch(() => undefined);

    expect(producer.isRunning()).toBe(true);
    expect(producer.isUp()).toBe(true);
  });

  it('allows a subsequent correctly-addressed produce to succeed on the same producer', async () => {
    const producer = await startProducer();

    const queue = uniqueQueue();
    await createQueue(queue);

    // First, a bad produce.
    await expect(
      producer.produce(RedisSMQ.newProducibleMessage().setBody({ bad: true })),
    ).rejects.toThrow(errors.MessageExchangeRequiredError);

    // Then, a good one through the same producer instance. If the failed
    // call left the producer in an inconsistent state — a stale internal
    // "last message" reference, a corrupted queue cache — this would fail
    // even though nothing in the test changed except the message.
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ good: true }),
    );

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    // Confirm the message actually landed, not just that produce()
    // resolved. A silent failure to enqueue would otherwise look like
    // success.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(1);
  });

  it('rejects consistently across multiple attempts', async () => {
    const producer = await startProducer();

    const bad = () =>
      producer.produce(
        RedisSMQ.newProducibleMessage().setBody({ hello: 'world' }),
      );

    await expect(bad()).rejects.toThrow(errors.MessageExchangeRequiredError);
    await expect(bad()).rejects.toThrow(errors.MessageExchangeRequiredError);
    await expect(bad()).rejects.toThrow(errors.MessageExchangeRequiredError);
  });
});
