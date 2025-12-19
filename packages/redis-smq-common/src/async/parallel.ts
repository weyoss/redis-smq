/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, TAsyncOperationList } from './types/callback.js';
import { MapAsyncOperationReturnTypeToResult } from './types/index.js';

/**
 * Executes multiple asynchronous operations in parallel
 *
 * All operations are started simultaneously, and the callback is invoked
 * when all operations complete or when any operation fails.
 *
 * @param operations - Array of operations to execute in parallel
 * @param callback - The callback to invoke with results
 *
 * @example
 * ```javascript
 * // Example 1: Basic usage with different return types
 * parallel(
 *   [
 *     (cb) => fetchUserData(userId, cb),
 *     (cb) => fetchUserPosts(userId, cb)
 *   ],
 *   (err, results) => {
 *     if (err) {
 *       console.error('An error occurred:', err);
 *       return;
 *     }
 *
 *     const [userData, userPosts] = results;
 *     // userData is of type UserData
 *     // userPosts is of type Post[]
 *     console.log(`User ${userData.name} has ${userPosts.length} posts`);
 *   }
 * );
 * ```
 *
 * @example
 * ```javascript
 * // Example 2: Error handling
 * parallel(
 *   [
 *     (cb) => readFile('config.json', cb),
 *     (cb) => connectToDatabase(cb),
 *     (cb) => validateLicense(cb)
 *   ],
 *   (err, [configData, dbConnection, licenseStatus]) => {
 *     if (err) {
 *       console.error('Initialization failed:', err);
 *       process.exit(1);
 *     }
 *
 *     // All operations completed successfully
 *     startApplication(configData, dbConnection, licenseStatus);
 *   }
 * );
 * ```
 */
export function parallel<AsyncOperationList extends TAsyncOperationList>(
  operations: [...AsyncOperationList],
  callback: ICallback<MapAsyncOperationReturnTypeToResult<AsyncOperationList>>,
): void {
  if (operations.length === 0) {
    // @ts-expect-error TS2769
    return callback(null, []);
  }

  let completed = 0;
  let failed = false;
  const results: unknown[] = new Array(operations.length);

  operations.forEach((operation, index) => {
    try {
      operation((err, result) => {
        if (failed) return; // Already failed, ignore further results
        if (err) {
          failed = true;
          return callback(err);
        }

        results[index] = result;
        completed++;

        if (completed === operations.length) {
          // @ts-expect-error TS2769
          return callback(null, results);
        }
      });
    } catch (error) {
      if (failed) return; // Already failed, ignore further errors
      failed = true;
      const err = error instanceof Error ? error : new Error(String(error));
      return callback(err);
    }
  });
}
