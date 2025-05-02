/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parallel } from './parallel.js';
import { ICallback } from './types/index.js';

/**
 * Processes items in a collection using a specified operation
 *
 * Items are processed in chunks to avoid memory issues with large collections.
 * Each chunk is processed in parallel, but chunks themselves are processed sequentially.
 *
 * @param items - Collection of items to process
 * @param operation - Operation to apply to each item
 * @param chunkSize - Size of chunks to process
 * @param callback - The callback to invoke with results
 * @typeparam T - The type of items in the collection
 * @typeparam R - The type of data returned as an array of results
 *
 * @example
 * ```javascript
 * // Example 1: Process a list of user IDs to fetch user data
 * const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
 *
 * map(
 *   userIds,
 *   (userId, cb) => {
 *     fetchUserData(userId, (err, userData) => {
 *       if (err) return cb(err);
 *       // Transform or validate the user data if needed
 *       return cb(null, {
 *         id: userData.id,
 *         name: userData.name,
 *         isActive: userData.status === 'active'
 *       });
 *     });
 *   },
 *   2, // Process 2 users at a time
 *   (err, users) => {
 *     if (err) {
 *       console.error('Failed to fetch user data:', err);
 *       return;
 *     }
 *     console.log(`Successfully processed ${users.length} users`);
 *     // users is an array of user objects
 *   }
 * );
 * ```
 */
export function map<T, R>(
  items: T[],
  operation: (item: T, cb: ICallback<R>) => void,
  chunkSize: number,
  callback: ICallback<R[]>,
): void {
  if (items.length === 0) {
    return callback(null, []);
  }

  const results: R[] = [];

  /**
   * Processes a chunk of items
   */
  const processChunk = (startIndex: number, chunkIndex: number = 1): void => {
    if (startIndex >= items.length) {
      return callback(null, results);
    }

    const endIndex = Math.min(startIndex + chunkSize, items.length);
    const chunkItems = items.slice(startIndex, endIndex);

    parallel(
      chunkItems.map((item) => (cb) => {
        try {
          operation(item, (err, result) => {
            if (err) {
              return cb(err);
            }
            return cb(null, result);
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          return cb(err);
        }
      }),
      (err, chunkResults) => {
        if (err) return callback(err);
        // @ts-expect-error TS2488
        results.push(...chunkResults);

        // Process next chunk with setImmediate to avoid blocking
        setImmediate(() => processChunk(endIndex, chunkIndex + 1));
      },
    );
  };

  // Start processing from the beginning of the collection
  processChunk(0);
}
