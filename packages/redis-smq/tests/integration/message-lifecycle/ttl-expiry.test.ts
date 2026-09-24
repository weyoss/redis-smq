/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessageDeadLetterCause,
  EMessagePropertyStatus,
  EMessageUnacknowledgementCause,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for TTL (Time-To-Live) expiry.
 *
 * A message produced with `setTTL(ms)` becomes eligible for expiry once
 * `ms` milliseconds have elapsed since its `createdAt` timestamp. The
 * framework detects expiry at checkout time, not on a timer:
 *
 *   1. The message sits in `PENDING` until a consumer polls its queue.
 *   2. On checkout, `MessageEnvelope.getSetExpired()` compares
 *      `createdAt + ttl` against the current time.
 *   3. If the boundary has passed, `MessageHandler.handleReceivedMessage`
 *      unacks the message with cause `TTL_EXPIRED` *before* invoking the
 *      handler.
 *   4. The unack pipeline resolves to `DEAD_LETTER` with dead-letter
 *      cause `TTL_EXPIRED`.
 *
 * The handler is never invoked for an expired message. This is the
 * primary user-visible contract: TTL expiry is not a failure of the
 * handler, it is RedisSMQ refusing to deliver a message that has
 * outlived its usefulness.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * TTL used by the expiry test.
 *
 * 2000ms is short enough that the test completes quickly, long enough
 * that scheduling noise around the produce call can't make the message
 * appear expired early.
 */
const TTL_MS = 2000;

/**
 * Margin added to the TTL before the test starts the consumer.
 *
 * Absorbs clock skew and the small delay between `Date.now()` being
 * read (for `createdAt`) and the message actually being written to
 * Redis. 1000ms is comfortable.
 */
const TTL_EXPIRY_MARGIN_MS = 1000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TTL expiry', () => {
  // -------------------------------------------------------------------------
  // Expiry
  // -------------------------------------------------------------------------

  it('dead-letters a message whose TTL has elapsed, without invoking the handler', async () => {
    const queue = uniqueQueue('ttl-expire');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('expires')
        .setTTL(TTL_MS),
    );

    // No consumer is running yet, so the message sits in PENDING and
    // nothing can have changed its state.
    await expectMessageStatus(id, EMessagePropertyStatus.PENDING);

    // Wait for the TTL to elapse. See the file header for why this is
    // a fixed sleep rather than a poll.
    await new Promise((resolve) =>
      setTimeout(resolve, TTL_MS + TTL_EXPIRY_MARGIN_MS),
    );

    // Now start the consumer. Its first poll checks the message out,
    // RedisSMQ detects the expiry, and the message is unacked
    // without the handler being invoked.
    let handlerCalls = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        handlerCalls += 1;
        cb();
      },
    });

    // The dead-lettered event is the terminal signal. Subscribing
    // before `run()` follows the subscribe-before-trigger contract.
    // The event will fire within a few hundred ms of the consumer's
    // first poll.
    const deadLettered = waitForMessageStatus(
      id,
      EMessagePropertyStatus.DEAD_LETTERED,
      {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after TTL expiry`,
      },
    );

    await consumer.run();

    await deadLettered;

    // The handler was never invoked. This is the primary contract:
    // expiry is detected at checkout, before delivery.
    expect(handlerCalls).toBe(0);

    // The message is in the dead-letter list, and nowhere else.
    const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLetteredMessages.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(id);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(0);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Non-expiry — the complement
  // -------------------------------------------------------------------------

  it('delivers a message normally when its TTL has not elapsed', async () => {
    const queue = uniqueQueue('ttl-not-expired');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('does-not-expire')
        // 60s: long enough that the test is guaranteed to complete
        // well before the boundary. The point of this test is that the
        // framework respects a future TTL, not that it works around a
        // tight one.
        .setTTL(60_000),
    );

    let handlerCalls = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        handlerCalls += 1;
        cb();
      },
    });

    const acked = untilMessageAcknowledged(consumer, id);

    await consumer.run();
    await acked;

    // The handler ran exactly once, and the message reached the
    // acknowledged state.
    expect(handlerCalls).toBe(1);
    await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
  });

  // -------------------------------------------------------------------------
  // Dead-letter cause
  // -------------------------------------------------------------------------

  it('records the dead-letter cause as TTL_EXPIRED', async () => {
    const queue = uniqueQueue('ttl-cause');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('check-cause')
        .setTTL(TTL_MS),
    );

    await new Promise((resolve) =>
      setTimeout(resolve, TTL_MS + TTL_EXPIRY_MARGIN_MS),
    );

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
    });

    await consumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 10_000,
      description: `message ${id} dead-lettered after TTL expiry`,
    });

    // With no retry policy applicable — the message was never run — the
    // history has exactly one record. Both the general unack cause and
    // the specific dead-letter cause are `TTL_EXPIRED`.
    const history =
      await RedisSMQ.createMessageManager().getMessageUnacknowledgementHistory(
        id,
      );

    expect(history).toHaveLength(1);
    expect(history[0].cause).toBe(EMessageUnacknowledgementCause.TTL_EXPIRED);
    expect(history[0].deadLetterCause).toBe(
      EMessageDeadLetterCause.TTL_EXPIRED,
    );
    expect(history[0].messageId).toBe(id);
  });
});
