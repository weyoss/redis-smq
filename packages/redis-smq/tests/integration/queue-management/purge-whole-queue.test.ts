/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EQueueType,
  errors,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import {
  produceAndAck,
  produceAndDeadLetter,
} from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for purging a queue in full.
 *
 * `QueuePublishedMessages.purge(queue)` is the whole-queue purge. It
 * removes messages in every state the queue tracks — pending,
 * acknowledged, dead-lettered, and scheduled. This is the operation's
 * distinguishing contract: the four state-specific purges
 * (`QueuePendingMessages.purge` and its siblings) are scoped to one
 * list, while `QueuePublishedMessages.purge` clears everything.
 *
 * The state-specific purges are covered in their own files. This file
 * covers the two cases that make `QueuePublishedMessages.purge`
 * distinct:
 *
 *   1. Clearing a queue whose messages are spread across all four
 *      states in a single call.
 *
 *   2. Clearing a queue whose audit configuration disables some of the
 *      state-specific lists — the whole-queue purge still works when
 *      the per-state purges would reject.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the purge worker to complete.
 *
 * Same rationale as the other purge files: the purge schedules a
 * background job; the worker picks it up on its next tick and processes
 * messages in batches. The mixed-state test has more messages than the
 * single-state files, so the worker does more work — 20 seconds gives
 * room.
 */
const PURGE_TIMEOUT_MS = 20_000;

/**
 * Scheduled delay for the scheduled-state setup message.
 *
 * Long enough that no test or CI hiccup could fire the message during
 * the test — the message stays in the scheduled list until the purge
 * removes it.
 */
const SCHEDULED_DELAY_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages to `queue` with no scheduling parameters,
 * leaving them in the pending list.
 *
 * No consumer is registered during the call, so the messages stay
 * pending after the helper returns.
 */
async function producePending(
  queue: IQueueParams,
  count: number,
): Promise<void> {
  const producer = await startProducer();
  for (let i = 0; i < count; i += 1) {
    await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`pending-${i}`),
    );
  }
  await producer.shutdown();
}

/**
 * Produce `count` scheduled messages to `queue` with a long delay.
 *
 * No schedule worker is running, so the messages stay in the scheduled
 * list. The 60-second delay is a second line of defense against a
 * leaked worker firing them mid-test.
 */
async function produceScheduled(
  queue: IQueueParams,
  count: number,
): Promise<void> {
  const producer = await startProducer();
  for (let i = 0; i < count; i += 1) {
    await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(`scheduled-${i}`)
        .setScheduledDelay(SCHEDULED_DELAY_MS),
    );
  }
  await producer.shutdown();
}

/**
 * Wait until every message-state count for `queue` is zero.
 *
 * The purge runs in the background, so the counts do not change
 * synchronously with the `purge()` call returning. The predicate checks
 * all four buckets so a partial purge — one that cleared pending but
 * left acknowledged behind — fails the wait rather than passing on a
 * single bucket.
 */
async function waitForAllCountsZero(queue: IQueueParams): Promise<void> {
  const queueMessages = RedisSMQ.createQueuePublishedMessages();
  await waitFor(
    async () => {
      const counts = await queueMessages.countMessagesByStatus(queue);
      return (
        counts.pending === 0 &&
        counts.acknowledged === 0 &&
        counts.deadLettered === 0 &&
        counts.scheduled === 0
      );
    },
    {
      timeoutMs: PURGE_TIMEOUT_MS,
      description: `all message counts for queue ${queue.ns}:${queue.name} reached zero`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging a queue in full', () => {
  // -------------------------------------------------------------------------
  // Mixed states
  // -------------------------------------------------------------------------

  it('clears messages in every state with a single whole-queue purge', async () => {
    const queue = uniqueQueue('purge-whole-mixed');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Phase 1: two messages that will end up in the scheduled list.
    // Produced first so the ack consumer below does not see them.
    await produceScheduled(queue, 2);

    // Phase 2: two messages that will end up acknowledged. The
    // consumer's lifecycle is inside the helper.
    await produceAndAck(queue, 2);

    // Phase 3: two messages that will end up dead-lettered. Same
    // lifecycle pattern as phase 2, with a failing handler.
    await produceAndDeadLetter(queue, 2);

    // Phase 4: two messages that will stay pending. No consumer is
    // registered, so they sit in the pending list.
    await producePending(queue, 2);

    // Pre-state: two messages in each of the four states.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const before = await queueMessages.countMessagesByStatus(queue);
    expect(before).toEqual({
      pending: 2,
      acknowledged: 2,
      deadLettered: 2,
      scheduled: 2,
    });

    // The single whole-queue purge.
    await queueMessages.purge(queue);

    // Poll for all four buckets to reach zero. A partial purge — one
    // that cleared only the pending list, say — would leave one of the
    // other counts non-zero, and the wait would time out with a
    // message naming the queue.
    await waitForAllCountsZero(queue);

    // Confirm the final state explicitly, for the failure message. A
    // regression that left a bucket non-zero would fail the wait above
    // with a generic timeout; this assertion names the specific
    // mismatch.
    const after = await queueMessages.countMessagesByStatus(queue);
    expect(after).toEqual({
      pending: 0,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });

    // The total count matches — nothing survived the purge.
    expect(await queueMessages.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Audit-disabled configuration
  // -------------------------------------------------------------------------

  it('clears the queue when message audit is disabled and the audit purges reject', async () => {
    const queue = uniqueQueue('purge-whole-audit-disabled');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Disable audit for this test. The config manager merges, so only
    // the `messageAudit` section changes; `namespace` and `logger`
    // retain their test-suite defaults.
    const configManager = RedisSMQ.createConfigManager();
    await configManager.updateConfig({ messageAudit: false });

    // Produce and ack one message. With audit disabled, the ack
    // pipeline still runs — the message is delivered and processed —
    // but no record is kept in the acknowledged list.
    await produceAndAck(queue, 1);

    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

    // The whole-queue accessor works regardless of audit. The count
    // reports the message even though no audit record exists for it.
    expect(await queueMessages.countMessages(queue)).toBe(1);

    // The audit-specific accessors reject with their specific classes.
    await expect(acknowledged.countMessages(queue)).rejects.toThrow(
      errors.AcknowledgmentAuditDisabledError,
    );
    await expect(deadLettered.countMessages(queue)).rejects.toThrow(
      errors.DeadLetterAuditDisabledError,
    );

    // The audit-specific purge also rejects — same class as the count.
    await expect(acknowledged.purge(queue)).rejects.toThrow(
      errors.AcknowledgmentAuditDisabledError,
    );

    // The whole-queue purge succeeds despite the audit being disabled.
    await queueMessages.purge(queue);

    // The whole-queue count drops to zero — the message is gone from
    // the pipeline, not merely hidden from an audit view.
    await waitFor(
      async () => (await queueMessages.countMessages(queue)) === 0,
      {
        timeoutMs: PURGE_TIMEOUT_MS,
        description: `queue ${queue.ns}:${queue.name} total count reached zero after purge`,
      },
    );

    expect(await queueMessages.countMessages(queue)).toBe(0);
  });
});
