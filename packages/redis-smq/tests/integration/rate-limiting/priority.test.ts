/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePriority,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { expectGapNear } from '../../helpers/assertions/time.js';

/**
 * Integration tests for rate-limit enforcement on a priority queue.
 *
 * A priority queue stores its pending messages in a Redis sorted set
 * (`keyQueuePriority`) scored by priority level, rather than in the
 * list (`keyQueuePending`) a FIFO queue uses. The rate limiter sits in
 * front of the checkout path, before the storage-specific dequeue
 * logic, and its counters are per-queue rather than per-priority-level.
 *
 * The observable consequence, and the contract this file tests: a
 * rate-limited priority queue delivers its messages in priority order,
 * but the *count* of deliveries in a window is bounded by the limit
 * regardless of which priorities those deliveries were. Priorities
 * decide *which* messages come out; the limit decides *how many*.
 *
 * MIXED PRIORITIES ARE THE POINT:
 *
 *   The FIFO variant of this file (`fifo.test.ts`) uses a single
 *   priority-free configuration and asserts the batch-then-pause
 *   pattern. That pattern is the same here, but with a stronger
 *   premise: if RedisSMQ ever enforced the rate limit *per
 *   priority level* rather than *per queue* — a plausible bug if the
 *   limiter lived inside the priority-aware dequeue loop rather than
 *   above it — a same-priority-only test would not notice.
 *
 *   Producing 3 HIGH and 3 VERY_LOW with `limit: 3, interval: 10000`
 *   would, under per-level enforcement, deliver all 3 HIGH immediately
 *   (level limit 3) and all 3 VERY_LOW immediately (level limit 3) —
 *   six messages, no pause, wrong on the wall-clock assertion. Under
 *   per-queue enforcement, the first three deliveries exhaust the
 *   window regardless of which priority they came from, and the next
 *   three wait for the window to roll.
 *
 *   The test asserts both the *timing* (batch-then-pause) and the
 *   *ordering* (HIGH before VERY_LOW) so a regression that broke
 *   either is caught with a specific failure.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The rate limit configuration under test.
 *
 * Same values as `fifo.test.ts` for direct comparability — a reader
 * who has opened both files sees the same numbers and can trust the
 * gap-pattern assertions to mean the same thing.
 */
const RATE_LIMIT = { limit: 3, interval: 10_000 } as const;

/**
 * Number of messages produced at each of the two priority levels.
 * `RATE_LIMIT.limit` per level — enough that a per-level bug would
 * produce a visibly different pattern (two full batches instead of
 * one), while a per-queue limit produces exactly the expected
 * batch-then-pause-then-batch.
 */
const MESSAGES_PER_LEVEL = RATE_LIMIT.limit;

/**
 * Total messages produced across both levels.
 */
const TOTAL_MESSAGES = MESSAGES_PER_LEVEL * 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A captured delivery: the moment RedisSMQ handed the message to
 * the handler, plus enough of the message's contents to attribute the
 * delivery to a priority level.
 *
 * Capturing the priority at delivery time (rather than reconstructing
 * it later) keeps the ordering assertion — "HIGH before VERY_LOW" —
 * self-contained and independent of the message body.
 */
interface IDelivery {
  ts: number;
  body: unknown;
  priority: EMessagePriority | null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate limiting — priority queue', () => {
  it('enforces the limit queue-wide, delivering in priority order', async () => {
    const queue = uniqueQueue('rl-priority');
    await createQueue(queue, EQueueType.PRIORITY_QUEUE);

    // Set the limit. As in `fifo.test.ts`, the set resolves after the
    // Redis write lands, so the limit is in effect for every checkout
    // below.
    const rateLimit = RedisSMQ.createQueueRateLimitManager();
    await rateLimit.set(queue, RATE_LIMIT);
    expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

    // Produce all messages before starting the consumer.
    const producer = await startProducer();
    for (let i = 0; i < MESSAGES_PER_LEVEL; i += 1) {
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody(`high-${i}`)
          .setPriority(EMessagePriority.HIGH),
      );
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody(`low-${i}`)
          .setPriority(EMessagePriority.VERY_LOW),
      );
    }

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(TOTAL_MESSAGES);

    // Register the consumer. The handler captures the delivery
    // timestamp, body, and priority — everything the assertions below
    // need. `priority` is read off the transferable message so the
    // ordering assertion does not depend on the body string.
    const deliveries: IDelivery[] = [];
    const consumer = await getConsumer({
      queue,
      messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
        deliveries.push({
          ts: Date.now(),
          body: msg.body,
          priority: msg.priority,
        });
        cb();
      },
    });

    await consumer.run();

    // Wait for all deliveries. The last one lands after the second
    // rate-limit window opens.
    await waitFor(() => deliveries.length === TOTAL_MESSAGES, {
      timeoutMs: RATE_LIMIT.interval * 3,
      intervalMs: 200,
      description: `all ${TOTAL_MESSAGES} messages delivered`,
    });

    // Compute the gaps between consecutive deliveries.
    const gaps = deliveries.slice(1).map((d, i) => d.ts - deliveries[i].ts);

    expect(gaps).toHaveLength(TOTAL_MESSAGES - 1);

    // --- Ordering assertion ---------------------------------------------
    // The first batch is every HIGH message. RedisSMQ's priority
    // queue orders by priority level (descending), then by the
    // storage tie-break within a level. Since the two priorities are
    // widely separated, HIGH is delivered entirely before VERY_LOW.
    //
    // This is asserted *before* the timing gaps because a wrong
    // ordering would make the timing assertions harder to interpret:
    // if a VERY_LOW arrived early, the "batch 1 → pause → batch 2"
    // framing breaks, and the failure should point at the ordering,
    // not at a mysterious gap.
    for (let i = 0; i < MESSAGES_PER_LEVEL; i += 1) {
      expect(
        deliveries[i].priority,
        `delivery ${i} (body=${String(deliveries[i].body)}) ` +
          `was not HIGH — priority ordering broke within the first batch`,
      ).toBe(EMessagePriority.HIGH);
    }
    for (let i = MESSAGES_PER_LEVEL; i < TOTAL_MESSAGES; i += 1) {
      expect(
        deliveries[i].priority,
        `delivery ${i} (body=${String(deliveries[i].body)}) ` +
          `was not VERY_LOW — priority ordering broke within the second batch`,
      ).toBe(EMessagePriority.VERY_LOW);
    }

    // --- Timing assertions ----------------------------------------------
    // With `limit: 3`, the pattern matches `fifo.test.ts`:
    //
    //   gap 0: HIGH 0 → HIGH 1     (within first batch)
    //   gap 1: HIGH 1 → HIGH 2     (within first batch)
    //   gap 2: HIGH 2 → LOW 0      (window rollover — the rate limit)
    //   gap 3: LOW 0 → LOW 1       (within second batch)
    //   gap 4: LOW 1 → LOW 2       (within second batch)
    expectGapNear(gaps[0], 0, 'gap 1 (HIGH 0 → HIGH 1)');
    expectGapNear(gaps[1], 0, 'gap 2 (HIGH 1 → HIGH 2)');

    expectGapNear(
      gaps[2],
      RATE_LIMIT.interval,
      'gap 3 (HIGH 2 → VERY_LOW 0, window rollover)',
    );

    expectGapNear(gaps[3], 0, 'gap 4 (VERY_LOW 0 → VERY_LOW 1)');
    expectGapNear(gaps[4], 0, 'gap 5 (VERY_LOW 1 → VERY_LOW 2)');

    // --- Post-state -----------------------------------------------------
    // Every message was acked. The batch-ack timer may not have
    // flushed by the time the 6th delivery timestamp was captured, so
    // the assertion polls.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    await waitFor(
      async () => (await acknowledged.countMessages(queue)) === TOTAL_MESSAGES,
      {
        timeoutMs: 5000,
        description: `all ${TOTAL_MESSAGES} messages acknowledged`,
      },
    );

    expect(await acknowledged.countMessages(queue)).toBe(TOTAL_MESSAGES);
    expect(await pending.countMessages(queue)).toBe(0);

    await consumer.shutdown();
  });
});
