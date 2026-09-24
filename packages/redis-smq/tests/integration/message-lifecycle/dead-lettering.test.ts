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
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the dead-lettering path.
 *
 * A message reaches the dead-letter list when the retry pipeline
 * determines that no further attempts should be made. There are three
 * distinct causes, each with its own trigger:
 *
 *   - `RETRY_THRESHOLD_EXCEEDED` — the message failed as many times as
 *     `retryThreshold` allows.
 *
 *   - `TTL_EXPIRED` — the message's `ttl` elapsed before it could be
 *     processed. Tested in `ttl-expiry.test.ts`.
 *
 *   - `PERIODIC_MESSAGE` — a scheduled/periodic message that is no
 *     longer eligible for repetition. Tested in `scheduling/`.
 *
 * This file covers only the first cause. The other two produce the same
 * terminal state (a message in the dead-letter list) but through
 * different triggers, and they are tested where the trigger lives.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Produce one message to `queue` with the given retry policy.
 *
 * Every test in this file uses a handler that always fails, so the
 * threshold is always reached and the outcome is always a dead-letter.
 * `retryDelay: 0` avoids the extra latency of the delayed branch — the
 * delay itself is not the subject of this file.
 */
async function produceFailingMessage(
  queue: ReturnType<typeof uniqueQueue>,
  body: string,
  retryThreshold: number,
): Promise<string> {
  const producer = await startProducer();
  const [id] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody(body)
      .setRetryThreshold(retryThreshold)
      .setRetryDelay(0),
  );
  return id;
}

/**
 * Register a consumer whose handler always reports a failure.
 *
 * The `calls` array records the timestamps of each invocation. Tests
 * use `calls.length` to assert the number of deliveries, which is the
 * ground truth for how many times RedisSMQ attempted the message.
 */
async function registerAlwaysFailingConsumer(
  queue: ReturnType<typeof uniqueQueue>,
): Promise<{
  calls: number[];
  consumer: Awaited<ReturnType<typeof getConsumer>>;
}> {
  const calls: number[] = [];
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
      calls.push(Date.now());
      cb(new Error('always fails'));
    },
  });
  return { calls, consumer };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dead-lettering — retry threshold exceeded', () => {
  // -------------------------------------------------------------------------
  // retryThreshold: 0 — dead-letter on first failure
  // -------------------------------------------------------------------------

  it('dead-letters on the first failure when retryThreshold is 0', async () => {
    const queue = uniqueQueue('dl-threshold-0');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { calls, consumer } = await registerAlwaysFailingConsumer(queue);

    const id = await produceFailingMessage(queue, 'no-retries', 0);

    await consumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 10_000,
      description: `message ${id} dead-lettered after first failure`,
    });

    // The handler ran exactly once. A second invocation would mean the
    // framework retried despite the threshold being 0.
    expect(calls).toHaveLength(1);

    // The message is in the dead-letter list, and nowhere else.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(id);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(0);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // retryThreshold: N — dead-letter after N failures
  // -------------------------------------------------------------------------

  it('dead-letters after exactly retryThreshold failed deliveries', async () => {
    const queue = uniqueQueue('dl-threshold-3');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { calls, consumer } = await registerAlwaysFailingConsumer(queue);

    const id = await produceFailingMessage(queue, 'three-retries', 3);

    await consumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 20_000,
      description: `message ${id} dead-lettered after retry threshold reached`,
    });

    expect(calls).toHaveLength(3);

    // The message reached the dead-letter list, and the message state
    // confirms RedisSMQ's count matches the handler's.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);
    expect(page.totalItems).toBe(1);
    expect(page.items[0].id).toBe(id);

    const state = await RedisSMQ.createMessageManager().getMessageState(id);
    expect(state.attempts).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Dead-letter cause
  // -------------------------------------------------------------------------

  it('records the dead-letter cause as RETRY_THRESHOLD_EXCEEDED', async () => {
    const queue = uniqueQueue('dl-cause');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { consumer } = await registerAlwaysFailingConsumer(queue);

    const id = await produceFailingMessage(queue, 'check-cause', 0);

    await consumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 10_000,
      description: `message ${id} dead-lettered`,
    });

    // The unacknowledgement history records both the cause of the
    // unack and the dead-letter action. With `retryThreshold: 0`, the
    // message fails once and immediately dead-letters, so the history
    // has exactly one record.
    const history =
      await RedisSMQ.createMessageManager().getMessageUnacknowledgementHistory(
        id,
      );

    expect(history).toHaveLength(1);
    expect(history[0].deadLetterCause).toBe(
      EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
    );
    expect(history[0].messageId).toBe(id);
  });

  // -------------------------------------------------------------------------
  // Not delivered again
  // -------------------------------------------------------------------------

  it('does not deliver a dead-lettered message to any consumer', async () => {
    const queue = uniqueQueue('dl-no-redelivery');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // First consumer: always fails, drives the message to the
    // dead-letter list.
    const { consumer: failingConsumer } =
      await registerAlwaysFailingConsumer(queue);

    const id = await produceFailingMessage(queue, 'no-redelivery', 0);

    await failingConsumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 10_000,
      description: `message ${id} dead-lettered`,
    });

    // Second consumer: same queue, always succeeds. If RedisSMQ
    // were to redeliver a dead-lettered message for any reason, this
    // consumer would receive it — and the counter below would be
    // non-zero.
    //
    // The failing consumer is still running. That is intentional: a
    // dead-lettered message must not come back to its original
    // consumer either. `registerAlwaysFailingConsumer` retains the
    // first consumer in the registry, so it stays alive for the
    // duration of the test.
    let secondConsumerCalls = 0;
    const secondConsumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        secondConsumerCalls += 1;
        cb();
      },
    });

    await secondConsumer.run();

    // Settle window: give RedisSMQ enough time to (incorrectly)
    // deliver the dead-lettered message, if it were going to.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Neither consumer saw a second delivery. The failing consumer
    // was called once (the original failure), and the second consumer
    // was called zero times.
    expect(secondConsumerCalls).toBe(0);

    const state = await RedisSMQ.createMessageManager().getMessageState(id);
    // The message remains dead-lettered; no redelivery moved it out.
    await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
      timeoutMs: 1000,
      description: `message ${id} still dead-lettered after settle window`,
    });
    expect(state.attempts).toBe(1);
  });
});
