/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError } from '../errors/index.js';
import { ICallback } from './types/callback.js';

/**
 * A generic helper function for handling asynchronous operations with callbacks
 *
 * This function provides a standardized way to:
 * 1. Execute an asynchronous setup operation
 * 2. Check for errors in the setup
 * 3. Check for empty/null results
 * 4. Execute the main operation with the setup result
 *
 * @param setup - The setup function that prepares resources needed for the main operation
 * @param operation - The main operation to execute with the setup result
 * @param callback - The callback to invoke with the final result
 * @typeparam S - The type of data returned by the setup function
 * @typeparam T - The type of data returned by the main operation
 *
 * @example
 * ```typescript
 * // Example: Connecting to Redis and executing a command
 * function getRedisClient(cb: ICallback<RedisClient>) {
 *   const client = createRedisClient();
 *   client.connect((err) => {
 *     if (err) return cb(err);
 *     cb(null, client);
 *   });
 * }
 *
 * function getUserData(client: RedisClient, cb: ICallback<UserData>) {
 *   client.get('user:1', (err, data) => {
 *     if (err) return cb(err);
 *     if (!data) return cb(new Error('User not found'));
 *     cb(null, JSON.parse(data));
 *   });
 * }
 *
 * // Using withCallback to compose these operations
 * withCallback<RedisClient, UserData>(
 *   getRedisClient,
 *   getUserData,
 *   (err, userData) => {
 *     if (err) {
 *       console.error('Failed to get user data:', err);
 *       return;
 *     }
 *     console.log('User data:', userData);
 *   }
 * );
 * ```
 */
export function withCallback<S, T>(
  setup: (cb: ICallback<S>) => void,
  operation: (resource: S, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  setup((err, resource) => {
    // Handle setup errors
    if (err) return callback(err);

    // Handle empty/null resources
    if (resource === null || resource === undefined) {
      return callback(new CallbackEmptyReplyError());
    }

    // Execute the main operation with the resource
    operation(resource, callback);
  });
}
