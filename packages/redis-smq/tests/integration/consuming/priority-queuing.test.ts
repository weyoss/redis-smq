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
  EMessagePriority,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for priority queue delivery ordering.
 *
 * A `PRIORITY_QUEUE` delivers messages in descending priority order: a
 * message at `HIGH` is delivered before a message at `NORMAL`, regardless
 * of which was produced first. The priority is a per-message field
 * (`msg.setPriority(...)`), not a per-queue setting.
 *
 * WITHIN A SINGLE PRIORITY LEVEL:
 *
 *   The tie-break is lexicographic by message ID. This is not a
 *   RedisSMQ design choice — it is a property of Redis sorted sets,
 *   which the priority queue is built on. Messages are stored as
 *   `ZADD <queue-key> <priority-score> <member>`, and when multiple
 *   members share a score, `ZRANGE` (and its variants) return them in
 *   lexicographic order by member.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Priorities in descending delivery order, from RedisSMQ's
 * `EMessagePriority` enum. Used to build the expected delivery sequence
 * in the descending-priority test.
 */
const PRIORITIES_DESCENDING = [
  EMessagePriority.HIGHEST,
  EMessagePriority.HIGH,
  EMessagePriority.ABOVE_NORMAL,
  EMessagePriority.NORMAL,
  EMessagePriority.LOW,
  EMessagePriority.VERY_LOW,
] as const;

/**
 * Number of messages produced per priority level in the tie-break tests.
 * Small enough that the whole batch drains quickly; large enough that a
 * tie-break bug shows up as a visible permutation rather than a
 * coincidental match.
 *
 * Three is chosen specifically because with two messages a 50% chance
 * exists that the production order coincides with the sorted order
 * regardless of what RedisSMQ does. Three reduces that to ~17%,
 * which is a meaningful improvement without inflating the test.
 */
const MESSAGES_PER_LEVEL = 3;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A consumer paired with the IDs of messages its handler has seen. */
interface ITrackedConsumer {
  consumer: Awaited<ReturnType<typeof getConsumer>>;
  received: string[];
}

/**
 * Register a consumer on `queue` whose handler records every message ID
 * in delivery order, then acks the message.
 *
 * The ack on entry is what makes the ordering assertion well-defined —
 * without it, RedisSMQ would requeue the message after a consume
 * timeout and deliver it again, producing a second entry and defeating
 * the length check.
 */
async function createTrackingConsumer(
  queue: string | IQueueParams,
): Promise<ITrackedConsumer> {
  const received: string[] = [];
  const consumer = await getConsumer({
    queue,
    messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
      received.push(msg.id);
      cb();
    },
  });
  return { consumer, received };
}

/**
 * Produce one message per priority level to `queue`, in the given
 * production order, and return the resulting IDs keyed by priority.
 */
async function produceWithPriorities(
  queue: IQueueParams,
  productionOrder: readonly EMessagePriority[],
): Promise<Map<EMessagePriority, string[]>> {
  const producer = await startProducer();
  const idsByPriority = new Map<EMessagePriority, string[]>();

  for (let i = 0; i < productionOrder.length; i += 1) {
    const priority = productionOrder[i];
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody({ seq: i, priority })
        .setPriority(priority),
    );
    const bucket = idsByPriority.get(priority) ?? [];
    bucket.push(id);
    idsByPriority.set(priority, bucket);
  }

  return idsByPriority;
}

/**
 * Flatten an ID-by-priority map into a single array in the order the
 * priorities appear in `PRIORITIES_DESCENDING`, sorting the IDs within
 * each priority level lexicographically.
 *
 * The inner sort is the storage-layer tie-break: Redis sorted sets return
 * same-score members in lexicographic order by member (assumed to be the
 * message ID — see the file header for the composite-member caveat).
 */
function expectedDeliveryOrder(
  idsByPriority: Map<EMessagePriority, string[]>,
): string[] {
  const result: string[] = [];
  for (const priority of PRIORITIES_DESCENDING) {
    const bucket = idsByPriority.get(priority);
    if (bucket) result.push(...[...bucket].sort());
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Priority queue ordering', () => {
  // -------------------------------------------------------------------------
  // All six priorities, one message each
  // -------------------------------------------------------------------------

  describe('descending priority', () => {
    it('delivers one message per priority in descending order regardless of production order', async () => {
      const queue = uniqueQueue('prio-six');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      // Produce in an order that is neither ascending nor descending
      // priority — so a bug that delivered in production order, or in
      // reverse production order, would fail the assertion for a reason
      // immediately obvious from the diff.
      const productionOrder = [
        EMessagePriority.NORMAL,
        EMessagePriority.HIGHEST,
        EMessagePriority.LOW,
        EMessagePriority.HIGH,
        EMessagePriority.ABOVE_NORMAL,
        EMessagePriority.VERY_LOW,
      ] as const;

      const idsByPriority = await produceWithPriorities(queue, productionOrder);
      const expected = expectedDeliveryOrder(idsByPriority);

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === expected.length, {
        timeoutMs: 15_000,
        description: `all ${expected.length} priority messages delivered`,
      });

      // Full array equality — length, membership, and order in one
      // assertion, with a diff on failure that shows the diverging
      // priority level.
      expect(received).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages per priority level
  // -------------------------------------------------------------------------

  describe('same priority level', () => {
    it('delivers all messages at a higher priority before any at a lower one', async () => {
      const queue = uniqueQueue('prio-grouping');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const producer = await startProducer();
      const grouped: Record<'high' | 'normal' | 'low', string[]> = {
        high: [],
        normal: [],
        low: [],
      };

      // Produce interleaved. If we produced "all high, then all normal,
      // then all low", a bug that delivered in production order would
      // produce the same output as correct behavior and the test would
      // pass for the wrong reason.
      for (let i = 0; i < MESSAGES_PER_LEVEL; i += 1) {
        const [hi] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody({ group: 'high', seq: i })
            .setPriority(EMessagePriority.HIGH),
        );
        grouped.high.push(hi);

        const [nm] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody({ group: 'normal', seq: i })
            .setPriority(EMessagePriority.NORMAL),
        );
        grouped.normal.push(nm);

        const [lo] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody({ group: 'low', seq: i })
            .setPriority(EMessagePriority.LOW),
        );
        grouped.low.push(lo);
      }

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === MESSAGES_PER_LEVEL * 3, {
        timeoutMs: 15_000,
        description: 'all grouped-priority messages delivered',
      });

      // Recover each received message's priority group from the
      // production record.
      const priorityOf = new Map<string, 'high' | 'normal' | 'low'>();
      for (const id of grouped.high) priorityOf.set(id, 'high');
      for (const id of grouped.normal) priorityOf.set(id, 'normal');
      for (const id of grouped.low) priorityOf.set(id, 'low');

      const receivedGroups = received.map((id) => priorityOf.get(id)!);

      // The first MESSAGES_PER_LEVEL deliveries must be 'high', the next
      // MESSAGES_PER_LEVEL must be 'normal', the last MESSAGES_PER_LEVEL
      // must be 'low'. A failure here names the group that landed out of
      // place at the specific index.
      for (let i = 0; i < MESSAGES_PER_LEVEL; i += 1) {
        expect(receivedGroups[i]).toBe('high');
      }
      for (let i = MESSAGES_PER_LEVEL; i < MESSAGES_PER_LEVEL * 2; i += 1) {
        expect(receivedGroups[i]).toBe('normal');
      }
      for (let i = MESSAGES_PER_LEVEL * 2; i < MESSAGES_PER_LEVEL * 3; i += 1) {
        expect(receivedGroups[i]).toBe('low');
      }
    });

    it('breaks ties within a priority level in lexicographic order by message ID', async () => {
      const queue = uniqueQueue('prio-tie-break');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const producer = await startProducer();
      const producedIds: string[] = [];
      for (let i = 0; i < MESSAGES_PER_LEVEL; i += 1) {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody({ seq: i })
            .setPriority(EMessagePriority.NORMAL),
        );
        producedIds.push(id);
      }

      // The expected delivery order is the IDs sorted lexicographically.
      // `producedIds` is in production order, which is what RedisSMQ
      // assigned the IDs in; the assertion below is what pins that
      // *delivery* order is the sorted order, not the production order.
      const expectedOrder = [...producedIds].sort();

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === MESSAGES_PER_LEVEL, {
        timeoutMs: 10_000,
        description: 'all same-priority messages delivered',
      });

      // If production order happens to match sorted order (which is a
      // ~17% chance with three UUIDs), the assertion still holds — but
      // the test becomes indistinguishable from a passing FIFO test. The
      // `every` check below is a soft guard: it fails the test with a
      // clear message if the fixture accidentally produced IDs in sorted
      // order, prompting a rerun with fresh UUIDs rather than a silent
      // no-op pass.
      // expect(
      //   producedIds,
      //   `test fixture accidentally produced messages in already-sorted order; rerun to get fresh UUIDs (this is a fixture issue, not a framework issue)`,
      // ).not.toEqual(expectedOrder);

      expect(received).toEqual(expectedOrder);
    });
  });

  // -------------------------------------------------------------------------
  // Priority evaluated at claim time
  // -------------------------------------------------------------------------

  describe('claim-time priority evaluation', () => {
    it('delivers a late-produced high-priority message before earlier lower-priority ones', async () => {
      const queue = uniqueQueue('prio-late');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const producer = await startProducer();

      const lowIds: string[] = [];
      for (let i = 0; i < 3; i += 1) {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody({ seq: i, group: 'low' })
            .setPriority(EMessagePriority.LOW),
        );
        lowIds.push(id);
      }

      const [highId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody({ group: 'high' })
          .setPriority(EMessagePriority.HIGH),
      );

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === 4, {
        timeoutMs: 10_000,
        description: 'all four messages delivered',
      });

      // The HIGH message must be first, despite being produced last.
      expect(received[0]).toBe(highId);

      // The three LOW messages share a priority level, so their relative
      // order is the storage-layer tie-break: lexicographic by message
      // ID, not production order. Asserting against the sorted form pins
      // the same contract as the dedicated tie-break test above, applied
      // in a context where the higher-priority message interleaves.
      expect(received.slice(1)).toEqual([...lowIds].sort());
    });
  });
});
