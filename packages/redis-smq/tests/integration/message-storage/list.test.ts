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
import { EQueueType, type IQueueParams, RedisSMQ } from '../../../src/index.js';
import { keys } from '../../../src/core/common/redis/keys/keys.js';
import { BrowserStorageList } from '../../../src/core/queue-messages/browser-storage-list.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for `BrowserStorageList` — the storage primitive
 * behind a queue's pending-message list.
 *
 * `BrowserStorageList` wraps a Redis `LIST`. RedisSMQ pushes a
 * message ID onto the list head as each message is produced, so a
 * read via `LRANGE 0 -1` returns the *newest* items first. FIFO and
 * LIFO queue types both use this primitive; the ordering difference
 * between them is realized by which end the consumer pops from, not
 * by a different storage layout.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Item count for the small-list test.
 *
 * Well below the primitive's 100-item chunk size, so `fetchAllItems`
 * reads the list in a single Redis round trip. Matches the original
 * `queue-message-storage-list/test00006`.
 */
const SMALL_LIST_SIZE = 20;

/**
 * Item count for the large-list (chunking) test.
 *
 * 1000 is comfortably above the primitive's 100-item chunk size, so
 * `fetchAllItems` exercises the multi-chunk path (10 chunks).
 * Matches the original `queue-message-storage-list/test00003`.
 */
const LARGE_LIST_SIZE = 1000;

/**
 * Item count for the pagination test.
 *
 * 500 items with a page size of 30 exercises 17 pages, the last of
 * which is partially filled — a boundary condition that catches
 * off-by-one errors in `fetchItems`. Matches the original
 * `queue-message-storage-list/test00004`.
 */
const PAGINATION_LIST_SIZE = 500;

/**
 * Page size for the pagination test. See `PAGINATION_LIST_SIZE` for
 * why 30.
 */
const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Promisified `BrowserStorageList` — what `bluebird.promisifyAll`
 * returns when applied to an instance of the class.
 *
 * Declared once so the setup helper's return type can be named,
 * rather than inferred at each call site.
 */
type TStorageList = ReturnType<
  typeof bluebird.promisifyAll<BrowserStorageList>
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a promisified `BrowserStorageList` and resolve the pending
 * list's Redis key for the given queue.
 *
 * The storage instance is per-test — no shared state to worry about —
 * and the key is derived from RedisSMQ's own `keys` helper, so
 * the test does not hardcode the key format.
 */
function setUpStorage(queue: IQueueParams): {
  storage: TStorageList;
  keyQueuePending: string;
} {
  const storage = bluebird.promisifyAll(new BrowserStorageList());
  const { keyQueuePending } = keys.getQueueKeys(queue.ns, queue.name, null);
  return { storage, keyQueuePending };
}

/**
 * Produce `count` messages to `queue` and return the message IDs in
 * the order they appear on the queue's pending list.
 *
 * The pending list stores messages newest-first — RedisSMQ
 * pushes to the list head on every produce — so the returned array
 * is the reverse of the production order. Returning it in list
 * order lets the caller compare directly against `fetchItems` /
 * `fetchAllItems` output with `toEqual`, without having to reverse
 * anything at the assertion site.
 *
 * The producer is started and shut down inside the helper. A shared
 * producer across tests would be marginally faster, but the
 * per-call setup keeps the resource accounting trivial and the
 * failure attribution clear.
 */
async function produceToPendingList(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const produced: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`msg-${i}`),
    );
    produced.push(id);
  }
  await producer.shutdown();

  // List order is newest-first. See the helper's docstring.
  return produced.reverse();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrowserStorageList', () => {
  // -------------------------------------------------------------------------
  // Empty list
  // -------------------------------------------------------------------------

  describe('empty list', () => {
    it('returns an empty array from fetchItems', async () => {
      const queue = uniqueQueue('storage-list-empty');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      const items = await storage.fetchItemsAsync(keyQueuePending, {
        offsetStart: 0,
        offsetEnd: 99,
      });

      expect(items).toEqual([]);
    });

    it('returns an empty array from fetchAllItems', async () => {
      const queue = uniqueQueue('storage-list-empty-all');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      const items = await storage.fetchAllItemsAsync(keyQueuePending);

      expect(items).toEqual([]);
    });

    it('reports zero items from count', async () => {
      const queue = uniqueQueue('storage-list-empty-count');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      expect(await storage.countAsync(keyQueuePending)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Count
  // -------------------------------------------------------------------------

  describe('count', () => {
    it('reflects the number of items written to the list', async () => {
      const queue = uniqueQueue('storage-list-count');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      expect(await storage.countAsync(keyQueuePending)).toBe(0);

      await produceToPendingList(queue, 1);

      expect(await storage.countAsync(keyQueuePending)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Small list — single-chunk fetchAllItems
  // -------------------------------------------------------------------------

  describe('small list', () => {
    it('round-trips every item via fetchAllItems in newest-first order', async () => {
      const queue = uniqueQueue('storage-list-small');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      const expected = await produceToPendingList(queue, SMALL_LIST_SIZE);
      expect(expected).toHaveLength(SMALL_LIST_SIZE);

      const items = await storage.fetchAllItemsAsync(keyQueuePending);

      expect(items).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // Large list — multi-chunk fetchAllItems
  // -------------------------------------------------------------------------

  describe('large list (chunking)', () => {
    it('returns the full list via fetchAllItems when the list exceeds one chunk', async () => {
      const queue = uniqueQueue('storage-list-large');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      const expected = await produceToPendingList(queue, LARGE_LIST_SIZE);
      expect(expected).toHaveLength(LARGE_LIST_SIZE);

      const items = await storage.fetchAllItemsAsync(keyQueuePending);

      expect(items).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('pagination', () => {
    it('returns the correct slice for each page and an empty array out of bounds', async () => {
      const queue = uniqueQueue('storage-list-pagination');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      const { storage, keyQueuePending } = setUpStorage(queue);

      const expected = await produceToPendingList(queue, PAGINATION_LIST_SIZE);
      expect(expected).toHaveLength(PAGINATION_LIST_SIZE);

      for (let i = 0; i < 17; i += 1) {
        const offsetStart = i * PAGE_SIZE;
        const offsetEnd = offsetStart + PAGE_SIZE - 1;

        const page = await storage.fetchItemsAsync(keyQueuePending, {
          offsetStart,
          offsetEnd,
        });

        // `slice` takes an exclusive end, so `offsetEnd + 1`.
        expect(
          page,
          `page ${i} (offsetStart=${offsetStart}, offsetEnd=${offsetEnd})`,
        ).toEqual(expected.slice(offsetStart, offsetEnd + 1));
      }

      // Out of bounds: a range starting well past the end of the
      // list. The primitive returns an empty array, not an error.
      const outOfBoundsStart = expected.length + 10;
      const outOfBounds = await storage.fetchItemsAsync(keyQueuePending, {
        offsetStart: outOfBoundsStart,
        offsetEnd: outOfBoundsStart + 50,
      });

      expect(outOfBounds).toEqual([]);
    });
  });
});
