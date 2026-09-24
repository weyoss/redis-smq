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
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the retry policy applied to fired scheduled
 * messages.
 *
 * A message produced with a scheduling parameter is not exempt from the
 * retry policy. When the scheduling worker fires it — producing a new
 * message in the pending list — that new message is a normal message
 * from the consumer's perspective. It can be delivered, fail, be
 * requeued, redelivered, and eventually dead-lettered exactly like any
 * other message.
 *
 * The test below pins that contract: a message that originated from a
 * scheduled firing is subject to the retry policy, and when it
 * dead-letters, its `scheduledMessageParentId` still points at the
 * scheduling original — so the lineage survives the entire retry
 * pipeline.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Repeat period. Small enough that the first firing happens quickly
 * (within a worker tick or two after the consumer starts), long enough
 * that the worker doesn't schedule a second firing before the test has
 * had a chance to observe the first.
 */
const REPEAT_PERIOD_MS = 1000;

/**
 * Number of repeats. Two is the smallest value that produces at least
 * one *copy* — the first firing creates a copy, and the second moves
 * the original. With `REPEAT_COUNT: 1` RedisSMQ would move the
 * original on the first firing with no copy, and this test's central
 * assertion (parent lineage) would have nothing to assert on.
 */
const REPEAT_COUNT = 2;

/**
 * Retry threshold. See the file header for why 3 is the correct value.
 */
const RETRY_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduled message retry', () => {
  it('applies the retry policy to a fired scheduled message and preserves the parent lineage', async () => {
    const queue = uniqueQueue('sched-retry');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('scheduled-and-failing')
        .setScheduledRepeat(REPEAT_COUNT)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS)
        .setRetryThreshold(RETRY_THRESHOLD)
        .setRetryDelay(0),
    );

    // A consumer that always fails. Its job is to drive the fired copies
    // through the retry pipeline to a terminal DL. The consumer also
    // starts RedisSMQ's worker cluster, which is what fires the
    // scheduled message in the first place.
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
        cb(new Error('always fails')),
    });

    await consumer.run();

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

    // Wait for a DL whose parent is the scheduling original — that is,
    // a message that was *created by a firing* and then exhausted its
    // retry policy.
    await waitFor(
      async () => {
        const page = await deadLettered.getMessages(queue, 0, 100);
        return page.items.some(
          (m) => m.messageState.scheduledMessageParentId === originalId,
        );
      },
      {
        timeoutMs: 30_000,
        intervalMs: 200,
        description:
          `a dead-lettered message with scheduledMessageParentId=${originalId} ` +
          `appeared in the DL list`,
      },
    );

    // Read the list once more for the assertions. The predicate above
    // guarantees at least one match; this read is what the assertions
    // inspect, so it must not be a stale snapshot.
    const page = await deadLettered.getMessages(queue, 0, 100);
    expect(page.totalItems).toBeGreaterThanOrEqual(1);

    // Find the DL message that came from a scheduled copy. It is
    // distinguished from the scheduling original by its
    // `scheduledMessageParentId`: the original's DL has `null` there,
    // because the original was never created from a scheduled parent.
    //
    // If no copy has DL'd yet, the failure message names every DL's ID
    // and parent pointer so the next step is diagnosable without a
    // second run.
    const fromScheduledCopy = page.items.find(
      (m) => m.messageState.scheduledMessageParentId === originalId,
    );

    expect(
      fromScheduledCopy,
      `no dead-lettered copy references the scheduling original ${originalId}; ` +
        `DL message IDs and their parents: ` +
        page.items
          .map(
            (m) =>
              `${m.id} → ${m.messageState.scheduledMessageParentId ?? 'null'}`,
          )
          .join(', '),
    ).toBeDefined();

    const dlMessageId = fromScheduledCopy!.id;

    // The DL message's state carries the retry history. `attempts`
    // reflects the number of checkouts RedisSMQ performed before
    // dead-lettering. With threshold 3, that's 3.
    const state =
      await RedisSMQ.createMessageManager().getMessageState(dlMessageId);

    expect(state.scheduledMessageParentId).toBe(originalId);
    expect(state.attempts).toBe(RETRY_THRESHOLD);

    // The message is genuinely gone from the pending list — a
    // dead-letter is a move, not a copy.
    const pending = RedisSMQ.createQueuePendingMessages();
    const pendingPage = await pending.getMessages(queue, 0, 100);
    expect(
      pendingPage.items.some((m) => m.id === dlMessageId),
      'the dead-lettered copy is still present in the pending list',
    ).toBe(false);
  });
});
