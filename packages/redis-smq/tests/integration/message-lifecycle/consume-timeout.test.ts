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
import {
  untilMessageAcknowledged,
  untilMessageUnacknowledged,
} from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the consume-timeout path.
 *
 * A message produced with `.setConsumeTimeout(ms)` gives the handler
 * `ms` milliseconds to report an outcome. If the handler hasn't called
 * its callback by then, RedisSMQ:
 *
 *   1. Records an unack with cause `TIMEOUT`.
 *   2. Runs the unack pipeline, which resolves the message according to
 *      its retry policy — DEAD_LETTER, REQUEUE, or DELAY, exactly as for
 *      any other unack.
 *   3. Discards any callback invocation the handler makes later. The
 *      framework's `settled` flag is already true, so the late call is
 *      a no-op.
 *
 * The handler is *not* killed. It keeps running after the timeout. For
 * an in-process handler this is invisible; for a file-based handler in
 * a worker thread, the worker eventually returns and its result is
 * discarded. RedisSMQ does not attempt to cancel in-flight work,
 * because JavaScript has no way to interrupt a running function.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Consume timeout used by the timeout tests.
 *
 * 1500ms is short enough that the tests complete in a few seconds, long
 * enough that RedisSMQ's timer setup and the handler's synchronous
 * entry can't race it. The handler in the failing tests deliberately
 * never calls its callback, so the timer always wins.
 */
const CONSUME_TIMEOUT_MS = 1500;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Consume timeout', () => {
  // -------------------------------------------------------------------------
  // Timeout with no retries
  // -------------------------------------------------------------------------

  it('unacks with cause TIMEOUT and dead-letters when retryThreshold is 0', async () => {
    const queue = uniqueQueue('timeout-dl');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const handlerCalls: number[] = [];

    const consumer = await getConsumer({
      queue,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      messageHandler: (_msg: IMessageTransferable, _cb: ICallback) => {
        handlerCalls.push(Date.now());
        // Deliberately does not call _cb.
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('times-out')
        .setConsumeTimeout(CONSUME_TIMEOUT_MS)
        .setRetryThreshold(0),
    );

    // Subscribe before run — the unack event fires when the timeout
    // triggers, and it must be captured.
    const timedOut = untilMessageUnacknowledged(
      consumer,
      id,
      EMessageUnacknowledgementCause.TIMEOUT,
    );

    await consumer.run();
    await timedOut;

    // The message reaches the dead-letter list. The unack cause is
    // TIMEOUT, but the dead-letter cause is RETRY_THRESHOLD_EXCEEDED —
    // the retry policy ran as usual, and the threshold of 0 left no
    // room for a retry.
    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 10_000,
      description: `message ${id} dead-lettered after consume timeout`,
    });

    // The handler was invoked exactly once. A second invocation would
    // indicate the message was requeued despite the threshold being 0.
    expect(handlerCalls).toHaveLength(1);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);
    expect(page.totalItems).toBe(1);
    expect(page.items[0].id).toBe(id);

    // The unacknowledgement history records cause TIMEOUT, distinct
    // from the UNACKNOWLEDGED cause that a handler-reported failure
    // would produce. This is the observable signal that RedisSMQ
    // detected a timeout rather than receiving a failure from the
    // handler.
    const history =
      await RedisSMQ.createMessageManager().getMessageUnacknowledgementHistory(
        id,
      );

    expect(history).toHaveLength(1);
    expect(history[0].cause).toBe(EMessageUnacknowledgementCause.TIMEOUT);
    expect(history[0].messageId).toBe(id);
  });

  // -------------------------------------------------------------------------
  // Timeout with retries available
  // -------------------------------------------------------------------------

  it('redelivers the message when retries are available and the handler succeeds on the second attempt', async () => {
    const queue = uniqueQueue('timeout-retry');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    let attempt = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        attempt += 1;
        if (attempt === 1) {
          // First delivery: do not call cb. RedisSMQ's timer
          // fires and the message is requeued.
          return;
        }
        // Second delivery: succeed immediately, before the timer can
        // fire.
        cb();
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('times-out-then-succeeds')
        .setConsumeTimeout(CONSUME_TIMEOUT_MS)
        .setRetryThreshold(3)
        .setRetryDelay(0),
    );

    // Both events are subscribed before run. The unack fires first
    // (after the timeout), the ack fires second (after the redelivery).
    const timedOut = untilMessageUnacknowledged(
      consumer,
      id,
      EMessageUnacknowledgementCause.TIMEOUT,
    );
    const acked = untilMessageAcknowledged(consumer, id);

    await consumer.run();
    await timedOut;
    await acked;

    // The handler was invoked twice: once for the timed-out delivery,
    // once for the successful retry.
    expect(attempt).toBe(2);

    await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
  });

  // -------------------------------------------------------------------------
  // Handler completes under the timeout
  // -------------------------------------------------------------------------

  it('acks normally when the handler completes before the timeout', async () => {
    const queue = uniqueQueue('timeout-not-exceeded');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    let handlerCalls = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        handlerCalls += 1;
        // Complete well under the timeout. The 100ms delay is long
        // enough to be a meaningful runtime for the handler — the
        // framework has to actually wait for the callback — but short
        // enough that the timer has no chance to fire.
        setTimeout(() => cb(), 100);
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('completes-in-time')
        .setConsumeTimeout(CONSUME_TIMEOUT_MS),
    );

    const acked = untilMessageAcknowledged(consumer, id);

    await consumer.run();
    await acked;

    expect(handlerCalls).toBe(1);
    await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
  });

  // -------------------------------------------------------------------------
  // consumeTimeout: 0 — no timer
  // -------------------------------------------------------------------------

  it('does not apply a timeout when consumeTimeout is 0', async () => {
    const queue = uniqueQueue('timeout-zero');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    let handlerCalls = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        handlerCalls += 1;
        setTimeout(() => cb(), 500);
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('no-timeout')
        .setConsumeTimeout(0),
    );

    const acked = untilMessageAcknowledged(consumer, id);

    await consumer.run();
    await acked;

    expect(handlerCalls).toBe(1);
    await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
  });
});
