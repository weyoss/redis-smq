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
import { expectGapNear } from '../../helpers/assertions/time.js';

/**
 * Integration tests for rate-limit enforcement on a FIFO queue.
 *
 * A queue's rate limit caps how many messages a consumer can check out
 * within a rolling window. With `{limit: 3, interval: 10000}`, the
 * framework delivers at most 3 messages per 10 seconds: the first
 * three pass through immediately, the fourth is held until the window
 * rolls over, and then the next three pass through.
 *
 * RedisSMQ enforces the limit at delivery time — the consumer's
 * `CHECKOUT_MESSAGE` script checks the rate-limit counters before
 * handing a message to the handler. Messages that are eligible for
 * delivery but blocked by the limit stay in the pending list; they are
 * not deferred to a scheduled list and their state does not change.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The rate limit configuration under test.
 *
 * 3 messages per 10 seconds gives a batch pattern that is easy to
 * observe: two full batches of 3, separated by a clear ~10-second
 * pause. Larger `limit` values increase the setup cost without
 * changing the pattern; smaller intervals erase the pause into poll
 * jitter.
 */
const RATE_LIMIT = { limit: 3, interval: 10_000 } as const;

/**
 * Total messages produced. Two full batches — exactly enough to
 * observe the pause without the test also waiting for a partial
 * third batch.
 */
const TOTAL_MESSAGES = RATE_LIMIT.limit * 2;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate limiting — FIFO queue', () => {
  it('delivers messages in batches separated by the rate-limit interval', async () => {
    const queue = uniqueQueue('rl-fifo');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Set the limit. `set` resolves after the Redis write lands, so
    // the limit is in effect for every checkout below.
    const rateLimit = RedisSMQ.createQueueRateLimitManager();
    await rateLimit.set(queue, RATE_LIMIT);

    // Pre-state: confirm the limit was written.
    expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

    // Produce every message before starting the consumer, so that all
    // of them are in the pending list when the rate limit begins to
    // apply
    const producer = await startProducer();
    for (let i = 0; i < TOTAL_MESSAGES; i += 1) {
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`msg-${i}`),
      );
    }

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(TOTAL_MESSAGES);

    const timestamps: number[] = [];
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        timestamps.push(Date.now());
        cb();
      },
    });

    await consumer.run();

    // Wait for all deliveries. The last one lands after the second
    // rate-limit window opens, so the timeout is the interval plus
    // generous slack for the poll-and-ack tail.
    await waitFor(() => timestamps.length === TOTAL_MESSAGES, {
      timeoutMs: RATE_LIMIT.interval * 3,
      intervalMs: 200,
      description: `all ${TOTAL_MESSAGES} messages delivered`,
    });

    // Compute the gaps between consecutive deliveries.
    const gaps = timestamps.slice(1).map((ts, i) => ts - timestamps[i]);

    // With `limit: 3`, the pattern is:
    //   gap 0: msg 0 → msg 1     (within first batch)
    //   gap 1: msg 1 → msg 2     (within first batch)
    //   gap 2: msg 2 → msg 3     (window rollover — the rate limit)
    //   gap 3: msg 3 → msg 4     (within second batch)
    //   gap 4: msg 4 → msg 5     (within second batch)
    expect(gaps).toHaveLength(TOTAL_MESSAGES - 1);

    // The within-batch gaps are near zero. Poll jitter and the
    // consumer's own ack-and-poll cycle keep them under the tolerance
    // in practice; the tolerance is what makes the assertion robust
    // to CI load.
    expectGapNear(gaps[0], 0, 'gap 1 (msg 0 → msg 1)');
    expectGapNear(gaps[1], 0, 'gap 2 (msg 1 → msg 2)');

    // The window-rollover gap is approximately the interval. This is
    // the assertion that actually distinguishes a working rate limit
    // from a broken one: a regression that ignored the limit would
    // produce a near-zero gap here (all six messages delivered
    // immediately), and the lower bound would fail with the actual
    // value named in the message.
    expectGapNear(
      gaps[2],
      RATE_LIMIT.interval,
      'gap 3 (msg 2 → msg 3, window rollover)',
    );

    // The second batch's within-batch gaps are also near zero.
    expectGapNear(gaps[3], 0, 'gap 4 (msg 3 → msg 4)');
    expectGapNear(gaps[4], 0, 'gap 5 (msg 4 → msg 5)');

    // Post-state: every message was acked (the handler is
    // immediate-ack). The acknowledged count reaching
    // TOTAL_MESSAGES requires waiting on the batch-ack timer — the
    // framework batches acks with a `batchTimeoutMs` of 1000 in the
    // test defaults, so the last ack may not have flushed by the time
    // the 6th timestamp is recorded.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    await waitFor(
      async () => (await acknowledged.countMessages(queue)) === TOTAL_MESSAGES,
      {
        timeoutMs: 5000,
        description: `all ${TOTAL_MESSAGES} messages acknowledged`,
      },
    );

    // Both views agree: the acked list has every message and the
    // pending list is empty. A regression that delivered messages
    // without removing them from pending — or that left them in
    // pending after ack — would surface here.
    expect(await acknowledged.countMessages(queue)).toBe(TOTAL_MESSAGES);
    expect(await pending.countMessages(queue)).toBe(0);

    await consumer.shutdown();
  });
});
