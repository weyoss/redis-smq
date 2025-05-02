/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, TAsyncOperationList } from './types/callback.js';
import { MapAsyncOperationReturnTypeToResult } from './types/index.js';

/**
 * Executes a sequence of asynchronous operations in series
 *
 * Each operation is executed only if the previous one succeeds.
 * Operations are executed in sequence but independently (results are not passed between operations).
 * The callback is invoked with an array containing the results of all operations.
 *
 * @param operations - Array of operations to execute in sequence
 * @param callback - The final callback to invoke with all results
 *
 * @example
 * ```javascript
 * // Example: Execute multiple independent operations in sequence
 * series(
 *   [
 *     (cb) => fetchUserProfile(userId, cb),
 *     (cb) => fetchUserPermissions(userId, cb),
 *     (cb) => fetchUserPreferences(userId, cb)
 *   ],
 *   (err, results) => {
 *     if (err) {
 *       console.error('One of the operations failed:', err);
 *       return;
 *     }
 *
 *     const [profile, permissions, preferences] = results;
 *     console.log(`User ${profile.name} has ${permissions.length} permissions`);
 *     applyUserSettings(profile, permissions, preferences);
 *   }
 * );
 * ```
 */
export function series<AsyncOperationList extends TAsyncOperationList>(
  operations: [...AsyncOperationList],
  callback: ICallback<MapAsyncOperationReturnTypeToResult<AsyncOperationList>>,
): void {
  if (operations.length === 0) {
    // @ts-expect-error TS2769
    return callback(null, []);
  }

  let currentIndex = 0;
  const results: unknown[] = new Array(operations.length);

  const executeNext = () => {
    if (currentIndex >= operations.length) {
      // @ts-expect-error TS2769
      return callback(null, results);
    }

    const operation = operations[currentIndex];
    try {
      operation((err, result) => {
        if (err) {
          return callback(err);
        }

        // Store the result
        results[currentIndex] = result;

        // Move to the next operation
        currentIndex++;

        // Use setImmediate to prevent stack overflow for long operation chains
        setImmediate(executeNext);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return callback(err);
    }
  };

  executeNext();
}
