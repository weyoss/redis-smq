/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import {
  EMessagePriority,
  EQueueType,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { keys } from '../../../src/core/common/redis/keys/keys.js';
import { BrowserStorageSortedSet } from '../../../src/core/queue-messages/browser-storage-sorted-set.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for `BrowserStorageSortedSet` — the storage
 * primitive behind a priority queue's pending-message set.
 *
 * `BrowserStorageSortedSet` wraps a Redis `ZSET`. Each member has an
 * associated numeric score, and reads fall into two categories:
 *
 *   - `fetchItems` uses `ZRANGE`, which returns members ordered by
 *     score (lowest to highest), with same-score members broken by
 *     lexicographic member order. The primitive's caller supplies an
 *     inclusive `[offsetStart, offsetEnd]` index range, and the
 *     returned items are a deterministic slice of that ordering.
 *
 *   - `fetchAllItems` uses `ZSCAN`, which iterates the ZSET's
 *     internal representation via cursors. **ZSCAN does NOT return
 *     members in score order.** The order is unspecified and not part
 *     of the primitive's contract — the tests assert on membership,
 *     not order.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Item count for the small-set test.
 *
 * Well below the primitive's internal ZSCAN `COUNT` hint (100), so
 * `fetchAllItems` reads the set in one or two iterations.
 */
const SMALL_SET_SIZE = 20;

/**
 * Item count for the large-set test.
 *
 * 1000 is comfortably above the ZSCAN `COUNT` of 100, so
 * `fetchAllItems` exercises the multi-iteration path. Matches the
 * original `queue-message-storage-sorted-set/test00003`.
 */
const LARGE_SET_SIZE = 1000;

/**
 * Item count for the pagination test.
 *
 * 500 items with a page size of 30 exercises 17 pages, the last of
 * which is partially filled. Matches the original
 * `queue-message-storage-sorted-set/test00004`.
 */
const PAGINATION_SET_SIZE = 500;

/**
 * Page size for the pagination test. See `PAGINATION_SET_SIZE` for
 * why 30.
 */
const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Promisified `BrowserStorageSortedSet` — what `bluebird.promisifyAll`
 * returns when applied to an instance of the class.
 */
type TStorageSortedSet = ReturnType<
  typeof bluebird.promisifyAll<BrowserStorageSortedSet>
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a promisified `BrowserStorageSortedSet` and resolve the
 * priority-queue key for the given queue.
 *
 * The instance is per-test — the primitive is stateless across calls,
 * so a fresh instance costs nothing and removes any possibility of
 * one test's configuration affecting another's.
 */
function setUpStorage(queue: IQueueParams): {
  storage: TStorageSortedSet;
  keyQueuePriority: string;
} {
  const storage = bluebird.promisifyAll(new BrowserStorageSortedSet());
  const { keyQueuePriority } = keys.getQueueKeys(queue.ns, queue.name, null);
  return { storage, keyQueuePriority };
}

/**
 * Produce `count` messages to a priority queue at a single priority
 * level, and return the produced IDs in production order.
 *
 * All messages get the same score (`EMessagePriority.HIGHEST`), which
 * is what makes the pagination test's assertions deterministic — see
 * the file header for why. The returned array is in production order,
 * which is generally *not* the order the sorted set returns; callers
 * that need the storage order should sort the returned IDs
 * lexicographically.
 *
 * The producer is started and shut down inside the helper. A shared
 * producer across tests would be marginally faster, but the per-call
 * setup keeps the resource accounting trivial and the failure
 * attribution clear.
 */
async function produceToPriorityQueue(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const produced: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(`msg-${i}`)
        .setPriority(EMessagePriority.HIGHEST),
    );
    produced.push(id);
  }
  await producer.shutdown();
  return produced;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrowserStorageSortedSet', () => {
  // -------------------------------------------------------------------------
  // Empty set
  // -------------------------------------------------------------------------

  describe('empty set', () => {
    it('returns an empty array from fetchItems', async () => {
      const queue = uniqueQueue('storage-zset-empty');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      const items = await storage.fetchItemsAsync(keyQueuePriority, {
        offsetStart: 0,
        offsetEnd: 99,
      });

      expect(items).toEqual([]);
    });

    it('returns an empty array from fetchAllItems', async () => {
      const queue = uniqueQueue('storage-zset-empty-all');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      const items = await storage.fetchAllItemsAsync(keyQueuePriority);

      expect(items).toEqual([]);
    });

    it('reports zero items from count', async () => {
      const queue = uniqueQueue('storage-zset-empty-count');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      expect(await storage.countAsync(keyQueuePriority)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Count
  // -------------------------------------------------------------------------

  describe('count', () => {
    it('reflects the number of items written to the sorted set', async () => {
      const queue = uniqueQueue('storage-zset-count');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      expect(await storage.countAsync(keyQueuePriority)).toBe(0);

      await produceToPriorityQueue(queue, 1);

      expect(await storage.countAsync(keyQueuePriority)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Small set — single-iteration-ish fetchAllItems
  // -------------------------------------------------------------------------

  describe('small set', () => {
    it('round-trips every item via fetchAllItems, order-insensitively', async () => {
      const queue = uniqueQueue('storage-zset-small');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      const produced = await produceToPriorityQueue(queue, SMALL_SET_SIZE);
      expect(produced).toHaveLength(SMALL_SET_SIZE);

      const items = await storage.fetchAllItemsAsync(keyQueuePriority);

      // The length assertion catches duplicates that the Set
      // comparison would silently collapse.
      expect(items).toHaveLength(SMALL_SET_SIZE);
      expect(new Set(items)).toEqual(new Set(produced));
    });
  });

  // -------------------------------------------------------------------------
  // Large set — multi-iteration fetchAllItems
  // -------------------------------------------------------------------------

  describe('large set (scanning)', () => {
    it('returns the full set via fetchAllItems across many ZSCAN iterations', async () => {
      const queue = uniqueQueue('storage-zset-large');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      const produced = await produceToPriorityQueue(queue, LARGE_SET_SIZE);
      expect(produced).toHaveLength(LARGE_SET_SIZE);

      const items = await storage.fetchAllItemsAsync(keyQueuePriority);

      expect(items).toHaveLength(LARGE_SET_SIZE);
      expect(new Set(items)).toEqual(new Set(produced));
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('pagination', () => {
    it('returns the correct slice for each page and an empty array out of bounds', async () => {
      const queue = uniqueQueue('storage-zset-pagination');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);
      const { storage, keyQueuePriority } = setUpStorage(queue);

      const produced = await produceToPriorityQueue(queue, PAGINATION_SET_SIZE);
      expect(produced).toHaveLength(PAGINATION_SET_SIZE);

      // The storage order for same-score members is the lexicographic
      // sort of the member IDs. See the file header.
      const expectedSorted = [...produced].sort();

      for (let i = 0; i < 17; i += 1) {
        const offsetStart = i * PAGE_SIZE;
        const offsetEnd = offsetStart + PAGE_SIZE - 1;

        const page = await storage.fetchItemsAsync(keyQueuePriority, {
          offsetStart,
          offsetEnd,
        });

        // `slice` takes an exclusive end, so `offsetEnd + 1`.
        expect(
          page,
          `page ${i} (offsetStart=${offsetStart}, offsetEnd=${offsetEnd})`,
        ).toEqual(expectedSorted.slice(offsetStart, offsetEnd + 1));
      }

      // Out of bounds: a range starting well past the end of the
      // set. `ZRANGE` returns an empty array for that, and the
      // primitive does the same. Callers rely on that for "are there
      // more pages?" checks.
      const outOfBoundsStart = expectedSorted.length + 10;
      const outOfBounds = await storage.fetchItemsAsync(keyQueuePriority, {
        offsetStart: outOfBoundsStart,
        offsetEnd: outOfBoundsStart + 50,
      });

      expect(outOfBounds).toEqual([]);
    });
  });
});
