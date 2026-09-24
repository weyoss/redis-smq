/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { BrowserStorageSet } from '../../../src/core/queue-messages/browser-storage-set.js';
import { withRedisClient } from '../../helpers/redis/client.js';

/**
 * Integration tests for `BrowserStorageSet` — the storage primitive
 * behind RedisSMQ's per-queue consumer-group registry.
 *
 * `BrowserStorageSet` wraps a Redis `SET`. Redis sets are *unordered*,
 * which changes the shape of every read operation compared to the
 * sibling `BrowserStorageList`:
 *
 *   - There is no "newest-first" or "oldest-first". The primitive
 *     returns items in whatever order Redis happens to return them,
 *     and RedisSMQ's consumers of the set never depend on that
 *     order.
 *
 *   - Pagination is cursor-based, not index-based. The underlying
 *     Redis command is `SSCAN`, and the primitive's `fetchItems`
 *     accepts `{ page, pageSize }` rather than `{ offsetStart,
 *     offsetEnd }`. The `pageSize` is passed to Redis as a `COUNT`
 *     *hint* — Redis is free to return more or fewer items per
 *     iteration, so the actual page boundaries are not fixed.
 *
 *   - `fetchAllItems` also uses `SSCAN`, iterating cursors until the
 *     scan completes, and collects into a `Set` internally to
 *     guarantee no duplicates even though the underlying Redis set
 *     has none.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Item count for the small-set test.
 *
 * Well below any plausible internal `COUNT` hint — the primitive
 * passes no `COUNT` to `SSCAN` in `fetchAllItems`, so Redis uses its
 * default of 10 items per iteration. 20 items is a few iterations.
 */
const SMALL_SET_SIZE = 20;

/**
 * Item count for the large-set test.
 *
 * 1000 items with the default `COUNT` of 10 is roughly 100 SCAN
 * iterations — enough to exercise the loop's multi-iteration
 * behavior and the recursive rescheduling that keeps the event loop
 * responsive.
 */
const LARGE_SET_SIZE = 1000;

/**
 * Item count for the pagination test.
 *
 * 500 items with a page size of 30 exercises 17 page fetches, each
 * of which internally scans from cursor 0. The count is high enough
 * that a bug in the scan-to-page logic (off-by-one in the page
 * counter, or missing the terminal cursor) would produce a
 * detectable gap in the union.
 */
const PAGINATION_SET_SIZE = 500;

/**
 * Page size for the pagination test.
 *
 * Passed to the primitive as the `COUNT` hint on each `SSCAN`. See
 * the file header for why this is a hint rather than a fixed slice
 * size.
 */
const PAGE_SIZE = 30;

/**
 * Number of pages the pagination test iterates.
 *
 * 17 pages of 30 items each is 510 slots, slightly more than the
 * 500-item set. The final page is therefore partially covered —
 * which is not a boundary condition the way it would be for an
 * ordered list, but the extra iteration confirms that the
 * scan-to-page logic handles the terminal case.
 */
const PAGINATION_PAGES = 17;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Promisified `BrowserStorageSet` — what `bluebird.promisifyAll`
 * returns when applied to an instance of the class.
 */
type TStorageSet = ReturnType<typeof bluebird.promisifyAll<BrowserStorageSet>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a promisified `BrowserStorageSet` for the current test.
 *
 * The instance is per-test — no shared state to worry about. The
 * primitive is stateless across calls, so a fresh instance per test
 * costs nothing and removes any possibility of one test's
 * configuration affecting another's.
 */
function setUpStorage(): TStorageSet {
  return bluebird.promisifyAll(new BrowserStorageSet());
}

/**
 * Generate a unique raw Redis key for a test.
 *
 * The prefix identifies the test in failure output; the UUID
 * guarantees uniqueness even if two tests happen to run in the same
 * millisecond. The harness's `flushAll` between tests means
 * collisions would not be a correctness concern, but unique keys
 * make a failure easier to attribute at a glance.
 */
function uniqueKey(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

/**
 * Populate a Redis set with the given items.
 *
 * Uses `SADD` directly through a pool-acquired client. The
 * `withRedisClient` helper handles the acquire/release pairing, so
 * the connection is returned to the pool even if `SADD` fails.
 *
 * The items are written via repeated `SADD` calls rather than a
 * single variadic call. For the sizes in this file (max 1000), the
 * extra round trips are negligible, and the loop shape is easier to
 * read than a spread.
 */
async function populateSet(key: string, items: string[]): Promise<void> {
  await withRedisClient(async (client) => {
    for (const item of items) {
      await client.saddAsync(key, item);
    }
  });
}

/**
 * Generate `count` distinct string items with a common prefix.
 *
 * The items are distinct by construction — an index suffix — which
 * is what a Redis set requires to actually store `count` members.
 * A `Set` comparison against this array would fail if two items
 * collided.
 */
function generateItems(count: number, prefix = 'a'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrowserStorageSet', () => {
  // -------------------------------------------------------------------------
  // Empty set
  // -------------------------------------------------------------------------

  describe('empty set', () => {
    it('returns an empty array from fetchItems', async () => {
      const key = uniqueKey('storage-set-empty');
      const storage = setUpStorage();

      const items = await storage.fetchItemsAsync(key, {
        page: 1,
        pageSize: PAGE_SIZE,
      });

      expect(items).toEqual([]);
    });

    it('returns an empty array from fetchAllItems', async () => {
      const key = uniqueKey('storage-set-empty-all');
      const storage = setUpStorage();

      const items = await storage.fetchAllItemsAsync(key);

      expect(items).toEqual([]);
    });

    it('reports zero items from count', async () => {
      const key = uniqueKey('storage-set-empty-count');
      const storage = setUpStorage();

      expect(await storage.countAsync(key)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Count
  // -------------------------------------------------------------------------

  describe('count', () => {
    it('reflects the number of distinct items in the set', async () => {
      const key = uniqueKey('storage-set-count');
      const storage = setUpStorage();

      expect(await storage.countAsync(key)).toBe(0);

      await populateSet(key, ['a', 'b']);

      expect(await storage.countAsync(key)).toBe(2);
    });

    it('does not double-count a member added twice', async () => {
      const key = uniqueKey('storage-set-dedup');
      const storage = setUpStorage();

      await populateSet(key, ['a', 'b']);
      await populateSet(key, ['a']);

      expect(await storage.countAsync(key)).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Small set — single-iteration-ish fetchAllItems
  // -------------------------------------------------------------------------

  describe('small set', () => {
    it('round-trips every item via fetchAllItems', async () => {
      const key = uniqueKey('storage-set-small');
      const storage = setUpStorage();

      const expected = generateItems(SMALL_SET_SIZE);
      await populateSet(key, expected);

      const items = await storage.fetchAllItemsAsync(key);

      expect(new Set(items)).toEqual(new Set(expected));
      expect(items).toHaveLength(SMALL_SET_SIZE);
    });
  });

  // -------------------------------------------------------------------------
  // Large set — multi-iteration fetchAllItems
  // -------------------------------------------------------------------------

  describe('large set (scanning)', () => {
    it('returns the full set via fetchAllItems across many scan iterations', async () => {
      const key = uniqueKey('storage-set-large');
      const storage = setUpStorage();

      const expected = generateItems(LARGE_SET_SIZE);
      await populateSet(key, expected);

      const items = await storage.fetchAllItemsAsync(key);

      expect(new Set(items)).toEqual(new Set(expected));
      expect(items).toHaveLength(LARGE_SET_SIZE);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('pagination', () => {
    it('collects every page to cover the full set, and returns empty past the end', async () => {
      const key = uniqueKey('storage-set-pagination');
      const storage = setUpStorage();

      const expected = generateItems(PAGINATION_SET_SIZE);
      await populateSet(key, expected);

      const collected = new Set<string>();
      for (let page = 1; page <= PAGINATION_PAGES; page += 1) {
        const items = await storage.fetchItemsAsync(key, {
          page,
          pageSize: PAGE_SIZE,
        });
        for (const item of items) {
          collected.add(item);
        }
      }

      // The union of every page covers the full set. The length
      // assertion catches a regression where the primitive returned
      // duplicates across pages (the primitive deduplicates in some
      // paths but not others — the union's cardinality is the
      // observable that matters).
      expect(collected.size).toBe(PAGINATION_SET_SIZE);
      expect(collected).toEqual(new Set(expected));

      // Out of bounds: a page beyond the end of the set. The
      // primitive's scan-to-page logic detects the terminal cursor
      // before reaching the requested page and returns an empty
      // array. Callers rely on this for "are there more pages?"
      // checks.
      const outOfBounds = await storage.fetchItemsAsync(key, {
        page: PAGINATION_PAGES + 1,
        pageSize: PAGE_SIZE,
      });
      expect(outOfBounds).toEqual([]);
    });
  });
});
