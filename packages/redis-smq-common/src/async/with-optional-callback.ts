/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './types/index.js';

export function withOptionalCallback<T>(
  cb: ICallback<T> | undefined,
  fn: (callback: ICallback<T>) => void,
): Promise<T> | void {
  if (cb) {
    fn(cb);
    return;
  }
  return new Promise<T>((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve(result as T);
    });
  });
}
