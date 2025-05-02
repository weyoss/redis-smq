/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './types/index.js';
import { AsyncCallbackTimeoutError } from './errors/index.js';

/**
 * Creates a wrapped callback with timeout handling
 *
 * If the callback is not called within the specified timeout,
 * an error is triggered.
 *
 * @param callback - The original callback
 * @param timeoutMs - Timeout in milliseconds
 * @typeparam T - The type of data returned by the callback
 * @returns A wrapped callback with timeout handling
 */
export function withTimeout<T>(
  callback: ICallback<T>,
  timeoutMs: number,
): ICallback<T> {
  let called = false;

  // Create the timeout that will trigger if the callback isn't called in time
  const timeoutId = setTimeout(() => {
    if (called) return;
    called = true;
    callback(new AsyncCallbackTimeoutError());
  }, timeoutMs);

  // Return the wrapped callback
  return (err, result) => {
    if (called) return;
    called = true;

    clearTimeout(timeoutId);
    callback(err, result);
  };
}
