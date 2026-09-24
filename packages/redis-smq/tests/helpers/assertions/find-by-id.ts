/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Find an item by its `id` field, or fail the test with a descriptive
 * message naming the missing ID and the IDs that *were* present.
 *
 * The common shape across the suite is:
 *
 *     const page = await accessor.getMessages(queue, 0, 100);
 *     const record = findById(page.items, expectedId);
 *     expect(record.status).toBe(...);
 *
 * Without this helper, the same lookup is written as:
 *
 *     const record = page.items.find((m) => m.id === expectedId);
 *     expect(record).toBeDefined();       // ← fails with "expected
 *                                         //   undefined to be defined",
 *                                         //   which names neither the
 *                                         //   missing ID nor the ones
 *                                         //   present
 *
 * The failure message is the whole reason the helper exists. A caller
 * investigating a missing message wants to see *which* IDs the accessor
 * returned, not just that the expected one was not among them. The
 * helper's error carries both:
 *
 *     No item with id="b2c3…" found among ["a1b2…", "d4e5…", "f6a7…"]
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the item whose `id` matches, or throw with a descriptive
 * message naming the missing ID and the IDs that were present.
 *
 * The error message quotes every ID in the search set. Quoting
 * disambiguates IDs that would otherwise run together in the joined
 * list (e.g. an ID containing a comma, though RedisSMQ's UUIDs
 * never do).
 */
export function findById<T extends { id: string }>(
  items: readonly T[],
  id: string,
): T {
  const found = items.find((item) => item.id === id);
  if (!found) {
    const available = items.map((item) => `"${item.id}"`).join(', ');
    throw new Error(
      `No item with id="${id}" found among [${available || '(empty)'}]`,
    );
  }
  return found;
}
