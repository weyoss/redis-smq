/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './types/index.js';

/**
 * Executes an asynchronous operation with standardized error handling and logging
 *
 * @param operation - The async operation to execute
 * @param callback - The callback to invoke with results
 * @typeparam T - The type of data returned by the operation
 */
export function exec<T>(
  operation: (cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  try {
    operation((err, result) => {
      if (err) {
        return callback(err);
      }
      return callback(null, result);
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return callback(err);
  }
}
