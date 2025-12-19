/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './types/callback.js';

/**
 * Creates a wrapped callback with retry logic
 *
 * If the operation fails, it will be retried up to the specified number of attempts.
 *
 * @param operation - The operation to execute with retry logic
 * @param callback - The original callback
 * @param options - Retry options
 * @param options.maxAttempts - Maximum number of attempts (default: 3)
 * @param options.retryDelay - Delay between retries in milliseconds (default: 1000)
 * @param options.shouldRetry - Function to determine if an error should trigger a retry (default: retry all errors)
 * @typeparam T - The type of data returned by the operation
 */
export function withRetry<T>(
  operation: (cb: ICallback<T>) => void,
  options: {
    maxAttempts?: number;
    retryDelay?: number;
    shouldRetry?: (err: Error) => boolean;
  } = {},
  callback: ICallback<T>,
): void {
  const maxAttempts = options.maxAttempts ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempts = 0;

  const attemptOperation = () => {
    attempts++;

    try {
      operation((err, result) => {
        if (err) {
          if (attempts < maxAttempts && shouldRetry(err)) {
            setTimeout(attemptOperation, retryDelay);
            return;
          }
          return callback(err);
        }
        return callback(null, result);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (attempts < maxAttempts && shouldRetry(err)) {
        setTimeout(attemptOperation, retryDelay);
        return;
      }
      return callback(err);
    }
  };

  attemptOperation();
}
